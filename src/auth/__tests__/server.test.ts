import { describe, it, expect } from 'vitest';
import { findAvailablePort, startCallbackServer } from '../server.js';

describe('findAvailablePort', () => {
  it('finds an available port', async () => {
    const port = await findAvailablePort(9000);
    expect(port).toBeGreaterThanOrEqual(9000);
    expect(typeof port).toBe('number');
  });
});

describe('startCallbackServer', () => {
  it('resolves with code and state on successful callback', async () => {
    const port = await findAvailablePort(9100);
    const serverPromise = startCallbackServer(port);

    // Simulate OAuth callback
    const response = await fetch(
      `http://localhost:${port}/callback?code=test-code&state=test-state`,
    );
    expect(response.status).toBe(200);

    const result = await serverPromise;
    expect(result.code).toBe('test-code');
    expect(result.state).toBe('test-state');
  });

  it('rejects on OAuth error', async () => {
    const port = await findAvailablePort(9200);
    const serverPromise = startCallbackServer(port);

    // Fire the request but don't await it — the server closes before responding fully
    fetch(`http://localhost:${port}/callback?error=access_denied`).catch(() => {});

    await expect(serverPromise).rejects.toThrow('OAuth error: access_denied');
  });

  it('returns 404 for non-callback paths', async () => {
    const port = await findAvailablePort(9300);
    const serverPromise = startCallbackServer(port);

    const response = await fetch(`http://localhost:${port}/other`);
    expect(response.status).toBe(404);

    // Clean up: trigger a valid callback to close the server
    await fetch(`http://localhost:${port}/callback?code=c&state=s`);
    await serverPromise;
  });
});
