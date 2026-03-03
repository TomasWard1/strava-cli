import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry.js';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 1 }),
    ).rejects.toThrow('persistent failure');

    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('auth error'));

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 1,
        shouldRetry: (err) => !err.message.includes('auth'),
      }),
    ).rejects.toThrow('auth error');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('applies exponential backoff', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    // Track delay values
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: () => void, delay?: number) => {
      delays.push(delay || 0);
      return originalSetTimeout(fn, 1); // Execute immediately
    });

    const fnMock = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    await withRetry(fnMock, { maxRetries: 3, baseDelayMs: 100 });

    // Delays should increase (exponential)
    expect(delays.length).toBe(2);
    expect(delays[1]).toBeGreaterThan(delays[0]);

    vi.restoreAllMocks();
  });
});
