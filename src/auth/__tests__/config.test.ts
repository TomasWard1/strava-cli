import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TEST_HOME = join(tmpdir(), `strava-cli-config-test-${process.pid}`);

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => join(actual.tmpdir(), `strava-cli-config-test-${process.pid}`),
  };
});

import { loadConfig, saveConfig, getCredentials } from '../config.js';

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mkdirSync(TEST_HOME, { recursive: true });
    delete process.env.STRAVA_CLIENT_ID;
    delete process.env.STRAVA_CLIENT_SECRET;
  });

  afterEach(() => {
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true, force: true });
    }
    process.env = { ...originalEnv };
  });

  describe('loadConfig', () => {
    it('returns null when no config file exists', () => {
      expect(loadConfig()).toBeNull();
    });

    it('returns config when file exists with valid data', () => {
      const configDir = join(TEST_HOME, '.strava-cli');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(
        join(configDir, 'config.json'),
        JSON.stringify({ client_id: '12345', client_secret: 'secret123' }),
      );

      const config = loadConfig();
      expect(config).toEqual({ client_id: '12345', client_secret: 'secret123' });
    });

    it('returns null when config file has invalid JSON', () => {
      const configDir = join(TEST_HOME, '.strava-cli');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(join(configDir, 'config.json'), 'not json');

      expect(loadConfig()).toBeNull();
    });

    it('returns null when config file is missing required fields', () => {
      const configDir = join(TEST_HOME, '.strava-cli');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(
        join(configDir, 'config.json'),
        JSON.stringify({ client_id: '12345' }), // missing client_secret
      );

      expect(loadConfig()).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('creates config directory and saves config file', () => {
      saveConfig({ client_id: '12345', client_secret: 'secret123' });

      const configFile = join(TEST_HOME, '.strava-cli', 'config.json');
      expect(existsSync(configFile)).toBe(true);

      const content = JSON.parse(readFileSync(configFile, 'utf-8'));
      expect(content.client_id).toBe('12345');
      expect(content.client_secret).toBe('secret123');
    });
  });

  describe('getCredentials', () => {
    it('returns env vars when both are set', () => {
      process.env.STRAVA_CLIENT_ID = 'env-id';
      process.env.STRAVA_CLIENT_SECRET = 'env-secret';

      const creds = getCredentials();
      expect(creds).toEqual({ clientId: 'env-id', clientSecret: 'env-secret' });
    });

    it('returns config file when env vars are missing', () => {
      saveConfig({ client_id: 'file-id', client_secret: 'file-secret' });

      const creds = getCredentials();
      expect(creds).toEqual({ clientId: 'file-id', clientSecret: 'file-secret' });
    });

    it('env vars override config file', () => {
      saveConfig({ client_id: 'file-id', client_secret: 'file-secret' });
      process.env.STRAVA_CLIENT_ID = 'env-id';
      process.env.STRAVA_CLIENT_SECRET = 'env-secret';

      const creds = getCredentials();
      expect(creds).toEqual({ clientId: 'env-id', clientSecret: 'env-secret' });
    });

    it('returns null when no env vars and no config file', () => {
      expect(getCredentials()).toBeNull();
    });

    it('returns null when only one env var is set', () => {
      process.env.STRAVA_CLIENT_ID = 'env-id';
      // STRAVA_CLIENT_SECRET not set

      expect(getCredentials()).toBeNull();
    });
  });
});
