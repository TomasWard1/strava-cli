import { randomBytes } from 'node:crypto';
import open from 'open';
import { saveTokens, clearTokens, getTokenStatus, getValidTokens, isTokenExpired, loadTokens } from './tokens.js';
import { getCredentials, saveConfig } from './config.js';
import { findAvailablePort, startCallbackServer } from './server.js';
import { CliError, ExitCode } from '../utils/errors.js';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const SCOPES = 'read,read_all,profile:read_all,activity:read,activity:read_all';

function isTTY(): boolean {
  return !!process.stdout.isTTY;
}

/**
 * Read a line from stdin. Works in both TTY and piped modes.
 */
function readLine(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.resume();
    process.stdin.once('data', (chunk) => {
      data = chunk.toString().trim();
      process.stdin.pause();
      resolve(data);
    });
  });
}

/**
 * Read a secret from stdin with masked input (shows * for each char).
 * Handles paste as a single chunk by iterating chars.
 */
function promptSecret(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stderr.write(prompt);

    if (!process.stdin.isTTY) {
      // Non-interactive: just read the line
      let data = '';
      process.stdin.setEncoding('utf-8');
      process.stdin.resume();
      process.stdin.once('data', (chunk) => {
        data = chunk.toString().trim();
        process.stdin.pause();
        resolve(data);
      });
      return;
    }

    // Interactive: mask input with raw mode
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');

    let secret = '';
    const onData = (data: string) => {
      // Clipboard paste arrives as single chunk — iterate chars
      for (const char of data) {
        if (char === '\r' || char === '\n') {
          process.stderr.write('\n');
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          resolve(secret);
          return;
        }
        if (char === '\u007F' || char === '\b') {
          // Backspace
          if (secret.length > 0) {
            secret = secret.slice(0, -1);
            process.stderr.write('\b \b');
          }
        } else if (char === '\u0003') {
          // Ctrl+C
          process.stderr.write('\n');
          process.exit(1);
        } else {
          secret += char;
          process.stderr.write('*');
        }
      }
    };

    process.stdin.on('data', onData);
  });
}

/**
 * Interactive onboarding: prompt for credentials when none found.
 * Only runs in TTY mode.
 */
async function interactiveSetup(): Promise<{ clientId: string; clientSecret: string }> {
  process.stderr.write('\n');
  process.stderr.write('  Strava CLI Setup\n');
  process.stderr.write('  ================\n\n');
  process.stderr.write('  1. Go to https://www.strava.com/settings/api\n');
  process.stderr.write('  2. Create an application (or use an existing one)\n');
  process.stderr.write('  3. Copy your Client ID and Client Secret\n\n');

  const clientId = await readLine('  Client ID: ');
  const clientSecret = await promptSecret('  Client Secret: ');

  if (!clientId || !clientSecret) {
    throw new CliError('Client ID and Client Secret are required', ExitCode.AUTH_ERROR);
  }

  // Save to config file for future use
  saveConfig({ client_id: clientId, client_secret: clientSecret });
  process.stderr.write('\n  Credentials saved to ~/.strava-cli/config.json\n\n');

  return { clientId, clientSecret };
}

/**
 * Get or prompt for credentials.
 * Agent mode: env vars or config file, fail if missing.
 * Human mode: interactive prompt if not found.
 */
async function resolveCredentials(): Promise<{ clientId: string; clientSecret: string }> {
  const creds = getCredentials();
  if (creds) return creds;

  if (isTTY()) {
    return interactiveSetup();
  }

  throw new CliError(
    'No credentials found. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET env vars',
    ExitCode.AUTH_ERROR,
  );
}

export async function login(): Promise<void> {
  const { clientId, clientSecret } = await resolveCredentials();
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

  if (isTTY()) {
    process.stderr.write('Opening browser for Strava authorization...\n');
    process.stderr.write(`\nIf browser does not open, visit:\n${authUrl.toString()}\n\n`);
  }

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

  if (isTTY()) {
    const name = data.athlete ? `${data.athlete.firstname} ${data.athlete.lastname}` : '';
    process.stderr.write(`\nYou're in!${name ? ` Welcome, ${name}.` : ''}\n`);
  } else {
    console.log(JSON.stringify({ success: true }));
  }
}

export function logout(): void {
  clearTokens();

  if (isTTY()) {
    process.stderr.write('Logged out.\n');
  } else {
    console.log(JSON.stringify({ success: true }));
  }
}

export function status(): void {
  const tokenStatus = getTokenStatus();
  const tokens = loadTokens();

  if (!tokenStatus.authenticated) {
    if (isTTY()) {
      process.stderr.write('Not authenticated. Run: strava-cli auth login\n');
    } else {
      console.log(JSON.stringify({ authenticated: false }));
    }
    process.exit(ExitCode.AUTH_ERROR);
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = tokenStatus.expires_at! - now;
  const needsRefresh = isTokenExpired(tokens!);

  if (isTTY()) {
    if (needsRefresh) {
      process.stderr.write('Authenticated (token needs refresh)\n');
    } else {
      process.stderr.write(`Authenticated (expires in ${Math.floor(expiresIn / 60)} min)\n`);
    }
  } else {
    console.log(JSON.stringify({
      authenticated: true,
      expires_at: tokenStatus.expires_at,
      expires_in_seconds: expiresIn,
      needs_refresh: needsRefresh,
    }));
  }
}

export async function refresh(): Promise<void> {
  const tokens = loadTokens();

  if (!tokens) {
    throw new CliError('Not authenticated. Run: strava-cli auth login', ExitCode.AUTH_ERROR);
  }

  const newTokens = await getValidTokens();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = newTokens.expires_at - now;

  if (isTTY()) {
    process.stderr.write(`Token refreshed (expires in ${Math.floor(expiresIn / 60)} min)\n`);
  } else {
    console.log(JSON.stringify({
      success: true,
      expires_at: newTokens.expires_at,
      expires_in_seconds: expiresIn,
    }));
  }
}
