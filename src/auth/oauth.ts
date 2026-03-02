import { randomBytes } from 'node:crypto';
import open from 'open';
import { saveTokens, clearTokens, getTokenStatus, getValidTokens, isTokenExpired, loadTokens } from './tokens.js';
import { findAvailablePort, startCallbackServer } from './server.js';
import { CliError, ExitCode } from '../utils/errors.js';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const SCOPES = 'read,read_all,profile:read_all,activity:read,activity:read_all';

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new CliError(
      'Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in environment',
      ExitCode.AUTH_ERROR,
    );
  }

  return { clientId, clientSecret };
}

export async function login(): Promise<void> {
  const { clientId, clientSecret } = getCredentials();
  const state = randomBytes(16).toString('hex');
  const port = await findAvailablePort(8420);
  const redirectUri = `http://localhost:${port}/callback`;

  const authUrl = new URL(STRAVA_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('approval_prompt', 'auto');

  // Start callback server before opening browser
  const callbackPromise = startCallbackServer(port);

  console.error('Opening browser for Strava authorization...');
  console.error(`\nIf browser does not open, visit:\n${authUrl.toString()}\n`);

  await open(authUrl.toString()).catch(() => {
    // Browser open failed, user will use the URL manually
  });

  const { code, state: returnedState } = await callbackPromise;

  if (returnedState !== state) {
    throw new CliError('OAuth state mismatch — possible CSRF attack', ExitCode.AUTH_ERROR);
  }

  const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new CliError(`Token exchange failed: ${text}`, ExitCode.AUTH_ERROR);
  }

  const data = await tokenResponse.json();

  // Strava returns expires_at directly (unix timestamp)
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    token_type: data.token_type,
  });

  console.log(JSON.stringify({ success: true, message: 'Authentication successful' }));
}

export function logout(): void {
  clearTokens();
  console.log(JSON.stringify({ success: true, message: 'Logged out' }));
}

export function status(): void {
  const tokenStatus = getTokenStatus();
  const tokens = loadTokens();

  if (!tokenStatus.authenticated) {
    console.log(JSON.stringify({
      authenticated: false,
      message: 'Not logged in. Run: strava-cli auth login',
    }));
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = tokenStatus.expires_at! - now;

  console.log(JSON.stringify({
    authenticated: true,
    expires_at: tokenStatus.expires_at,
    expires_in_seconds: expiresIn,
    expires_in_human: expiresIn > 0 ? `${Math.floor(expiresIn / 60)} minutes` : 'EXPIRED',
    needs_refresh: isTokenExpired(tokens!),
  }));
}

export async function refresh(): Promise<void> {
  const tokens = loadTokens();

  if (!tokens) {
    throw new CliError('Not authenticated. Run: strava-cli auth login', ExitCode.AUTH_ERROR);
  }

  const newTokens = await getValidTokens();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = newTokens.expires_at - now;

  console.log(JSON.stringify({
    success: true,
    message: 'Token refreshed successfully',
    expires_at: newTokens.expires_at,
    expires_in_seconds: expiresIn,
    expires_in_human: `${Math.floor(expiresIn / 60)} minutes`,
  }));
}
