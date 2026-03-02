import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRequest, fetchAllPages, getRateLimitStatus } from '../client.js';
import { ExitCode } from '../../utils/errors.js';

// Mock getValidTokens
vi.mock('../../auth/tokens.js', () => ({
  getValidTokens: vi.fn().mockResolvedValue({
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: 9999999999,
    token_type: 'Bearer',
  }),
}));

describe('makeRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes authenticated GET request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1, name: 'Test' }),
      headers: new Headers({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '10,100',
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await makeRequest('/athlete');

    expect(fetch).toHaveBeenCalledWith(
      'https://www.strava.com/api/v3/athlete',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('appends query parameters', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      headers: new Headers(),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await makeRequest('/athlete/activities', { per_page: 30, page: 2 });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=30');
    expect(calledUrl).toContain('page=2');
  });

  it('throws AUTH_ERROR on 401', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
      headers: new Headers(),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await expect(makeRequest('/athlete')).rejects.toMatchObject({
      exitCode: ExitCode.AUTH_ERROR,
    });
  });

  it('throws RATE_LIMIT on 429', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate Limit Exceeded'),
      headers: new Headers(),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await expect(makeRequest('/athlete')).rejects.toMatchObject({
      exitCode: ExitCode.RATE_LIMIT,
    });
  });

  it('tracks rate limit from response headers', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '50,500',
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await makeRequest('/athlete');

    const status = getRateLimitStatus();
    expect(status.fifteen_min.limit).toBe(200);
    expect(status.fifteen_min.used).toBe(50);
    expect(status.daily.limit).toBe(2000);
    expect(status.daily.used).toBe(500);
  });
});

describe('fetchAllPages', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches single page when results < per_page', async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(items),
      headers: new Headers(),
    } as Response);

    const result = await fetchAllPages('/athlete/activities', { per_page: 30 });

    expect(result).toHaveLength(5);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches multiple pages until empty page', async () => {
    const page1 = Array.from({ length: 30 }, (_, i) => ({ id: i }));
    const page2 = Array.from({ length: 30 }, (_, i) => ({ id: i + 30 }));
    const page3: unknown[] = [];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve(page1),
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve(page2),
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve(page3),
        headers: new Headers(),
      } as Response);

    const result = await fetchAllPages('/athlete/activities', { per_page: 30 });

    expect(result).toHaveLength(60);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
