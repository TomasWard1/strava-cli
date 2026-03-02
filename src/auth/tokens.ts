import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { TokenData } from '../types/strava.js';
import { CliError, ExitCode } from '../utils/errors.js';
import { getCredentials } from './config.js';

const CONFIG_DIR = join(homedir(), '.strava-cli');
const TOKEN_FILE = join(CONFIG_DIR, 'tokens.json');

// Refresh tokens 15 minutes before expiry to avoid race conditions
const REFRESH_BUFFER_SECONDS = 900;

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function saveTokens(data: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type?: string;
}): void {
  ensureConfigDir();

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    token_type: data.token_type || 'Bearer',
  };

  writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
  chmodSync(TOKEN_FILE, 0o600);
}

export function loadTokens(): TokenData | null {
  if (!existsSync(TOKEN_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(TOKEN_FILE, 'utf-8');
    return JSON.parse(content) as TokenData;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (existsSync(TOKEN_FILE)) {
    unlinkSync(TOKEN_FILE);
  }
}

export function isTokenExpired(tokens: TokenData): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= tokens.expires_at - REFRESH_BUFFER_SECONDS;
}

export async function refreshAccessToken(tokens: TokenData): Promise<TokenData> {
  const creds = getCredentials();

  if (!creds) {
    throw new CliError(
      'No credentials found. Set STRAVA_CLIENT_ID/SECRET env vars or run: strava-cli auth login',
      ExitCode.AUTH_ERROR,
    );
  }

  const { clientId, clientSecret } = creds;

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `Token refresh failed (${response.status})`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {
      // Use default error message
    }
    throw new CliError(errorMsg, ExitCode.AUTH_ERROR);
  }

  const data = await response.json();
  // Strava returns expires_at directly (not expires_in)
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    token_type: data.token_type,
  });

  return loadTokens()!;
}

export async function getValidTokens(): Promise<TokenData> {
  let tokens = loadTokens();

  if (!tokens) {
    throw new CliError('Not authenticated. Run: strava-cli auth login', ExitCode.AUTH_ERROR);
  }

  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken(tokens);
  }

  return tokens;
}

export function getTokenStatus(): {
  authenticated: boolean;
  expires_at?: number;
  expired?: boolean;
} {
  const tokens = loadTokens();
  if (!tokens) {
    return { authenticated: false };
  }
  return {
    authenticated: true,
    expires_at: tokens.expires_at,
    expired: isTokenExpired(tokens),
  };
}
