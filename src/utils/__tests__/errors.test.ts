import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliError, ExitCode, handleError } from '../errors.js';

describe('CliError', () => {
  it('creates error with default exit code', () => {
    const error = new CliError('test error');
    expect(error.message).toBe('test error');
    expect(error.exitCode).toBe(ExitCode.GENERAL_ERROR);
    expect(error.name).toBe('CliError');
  });

  it('creates error with custom exit code', () => {
    const error = new CliError('auth failed', ExitCode.AUTH_ERROR);
    expect(error.exitCode).toBe(ExitCode.AUTH_ERROR);
  });

  it('accepts optional context metadata', () => {
    const error = new CliError('API failed', ExitCode.NETWORK_ERROR, {
      endpoint: '/athlete',
      statusCode: 500,
      retryable: true,
    });
    expect(error.context).toEqual({
      endpoint: '/athlete',
      statusCode: 500,
      retryable: true,
    });
  });

  it('defaults context to undefined', () => {
    const error = new CliError('simple error');
    expect(error.context).toBeUndefined();
  });
});

describe('ExitCode', () => {
  it('has expected values', () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.GENERAL_ERROR).toBe(1);
    expect(ExitCode.AUTH_ERROR).toBe(2);
    expect(ExitCode.RATE_LIMIT).toBe(3);
    expect(ExitCode.NETWORK_ERROR).toBe(4);
  });
});

describe('handleError', () => {
  let exitSpy: any;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stdoutSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('non-TTY mode (agent)', () => {
    beforeEach(() => {
      // Tests run in non-TTY by default (process.stdout.isTTY is undefined)
    });

    it('outputs JSON to stdout for CliError', () => {
      handleError(new CliError('auth failed', ExitCode.AUTH_ERROR));

      const result = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(result.error).toBe('auth failed');
      expect(result.code).toBe(ExitCode.AUTH_ERROR);
      expect(exitSpy).toHaveBeenCalledWith(ExitCode.AUTH_ERROR);
    });

    it('includes context in JSON output when present', () => {
      handleError(new CliError('network error', ExitCode.NETWORK_ERROR, {
        endpoint: '/athlete/activities',
        retryable: true,
      }));

      const result = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(result.error).toBe('network error');
      expect(result.code).toBe(ExitCode.NETWORK_ERROR);
      expect(result.context.endpoint).toBe('/athlete/activities');
      expect(result.context.retryable).toBe(true);
    });

    it('handles unknown errors with GENERAL_ERROR', () => {
      handleError('string error');

      const result = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(result.error).toBe('string error');
      expect(result.code).toBe(ExitCode.GENERAL_ERROR);
      expect(exitSpy).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
    });
  });

  describe('TTY mode (human)', () => {
    beforeEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    });

    afterEach(() => {
      Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true });
    });

    it('outputs human-readable error to stderr', () => {
      handleError(new CliError('auth failed', ExitCode.AUTH_ERROR));

      expect(stderrSpy).toHaveBeenCalledWith('Error: auth failed');
      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(ExitCode.AUTH_ERROR);
    });

    it('includes status code in human output when available', () => {
      handleError(new CliError('not found', ExitCode.GENERAL_ERROR, {
        endpoint: '/athlete',
        statusCode: 404,
      }));

      expect(stderrSpy).toHaveBeenCalledWith('Error: not found (404)');
    });
  });
});
