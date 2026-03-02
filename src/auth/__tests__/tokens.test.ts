import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TEST_HOME = join(tmpdir(), `strava-cli-test-${process.pid}`);

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => join(actual.tmpdir(), `strava-cli-test-${process.pid}`),
  };
});

import { saveTokens, loadTokens, clearTokens, isTokenExpired, getTokenStatus } from '../tokens.js';

describe('tokens', () => {
  beforeEach(() => {
    mkdirSync(TEST_HOME, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true, force: true });
    }
  });

  describe('saveTokens', () => {
    it('saves token data to config directory', () => {
      saveTokens({
        access_token: 'test-access',
        refresh_token: 'test-refresh',
        expires_at: 9999999999,
        token_type: 'Bearer',
      });

      const tokenFile = join(TEST_HOME, '.strava-cli', 'tokens.json');
      expect(existsSync(tokenFile)).toBe(true);

      const content = JSON.parse(readFileSync(tokenFile, 'utf-8'));
      expect(content.access_token).toBe('test-access');
      expect(content.refresh_token).toBe('test-refresh');
      expect(content.expires_at).toBe(9999999999);
      expect(content.token_type).toBe('Bearer');
    });

    it('creates config directory if it does not exist', () => {
      const configDir = join(TEST_HOME, '.strava-cli');
      expect(existsSync(configDir)).toBe(false);

      saveTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: 1000,
      });

      expect(existsSync(configDir)).toBe(true);
    });
  });

  describe('loadTokens', () => {
    it('returns null when no token file exists', () => {
      expect(loadTokens()).toBeNull();
    });

    it('returns saved token data', () => {
      saveTokens({
        access_token: 'my-token',
        refresh_token: 'my-refresh',
        expires_at: 12345,
        token_type: 'Bearer',
      });

      const tokens = loadTokens();
      expect(tokens).not.toBeNull();
      expect(tokens!.access_token).toBe('my-token');
      expect(tokens!.refresh_token).toBe('my-refresh');
    });
  });

  describe('clearTokens', () => {
    it('removes token file', () => {
      saveTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: 1000,
      });

      clearTokens();
      expect(loadTokens()).toBeNull();
    });

    it('does nothing when no token file exists', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('returns false when token is far from expiry', () => {
      const tokens = {
        access_token: 'a',
        refresh_token: 'r',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
        token_type: 'Bearer',
      };
      expect(isTokenExpired(tokens)).toBe(false);
    });

    it('returns true when token is within refresh buffer', () => {
      const tokens = {
        access_token: 'a',
        refresh_token: 'r',
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 min < 15 min buffer
        token_type: 'Bearer',
      };
      expect(isTokenExpired(tokens)).toBe(true);
    });

    it('returns true when token is already expired', () => {
      const tokens = {
        access_token: 'a',
        refresh_token: 'r',
        expires_at: Math.floor(Date.now() / 1000) - 100,
        token_type: 'Bearer',
      };
      expect(isTokenExpired(tokens)).toBe(true);
    });
  });

  describe('getTokenStatus', () => {
    it('returns not authenticated when no tokens', () => {
      const status = getTokenStatus();
      expect(status.authenticated).toBe(false);
    });

    it('returns authenticated with expiry info', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 7200;
      saveTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: expiresAt,
      });

      const status = getTokenStatus();
      expect(status.authenticated).toBe(true);
      expect(status.expires_at).toBe(expiresAt);
      expect(status.expired).toBe(false);
    });
  });
});
