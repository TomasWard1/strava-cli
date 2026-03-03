import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.strava-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface StravaConfig {
  client_id: string;
  client_secret: string;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): StravaConfig | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);

    if (!config.client_id || !config.client_secret) {
      return null;
    }

    return { client_id: config.client_id, client_secret: config.client_secret };
  } catch {
    return null;
  }
}

export function saveConfig(config: StravaConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  chmodSync(CONFIG_FILE, 0o600);
}

/**
 * Get credentials from env vars > config file > null.
 * Priority: STRAVA_CLIENT_ID/SECRET env vars override config file.
 */
export function getCredentials(): { clientId: string; clientSecret: string } | null {
  const envId = process.env.STRAVA_CLIENT_ID;
  const envSecret = process.env.STRAVA_CLIENT_SECRET;

  if (envId && envSecret) {
    return { clientId: envId, clientSecret: envSecret };
  }

  const config = loadConfig();
  if (config) {
    return { clientId: config.client_id, clientSecret: config.client_secret };
  }

  return null;
}
