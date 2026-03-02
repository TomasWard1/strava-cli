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
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs JSON with error and code for CliError', () => {
    handleError(new CliError('auth failed', ExitCode.AUTH_ERROR));

    const output = JSON.parse(stderrSpy.mock.calls[0][0] as string);
    expect(output.error).toBe('auth failed');
    expect(output.code).toBe(ExitCode.AUTH_ERROR);
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.AUTH_ERROR);
  });

  it('includes context in JSON output when present', () => {
    handleError(new CliError('network error', ExitCode.NETWORK_ERROR, {
      endpoint: '/athlete/activities',
      retryable: true,
    }));

    const output = JSON.parse(stderrSpy.mock.calls[0][0] as string);
    expect(output.error).toBe('network error');
    expect(output.code).toBe(ExitCode.NETWORK_ERROR);
    expect(output.context.endpoint).toBe('/athlete/activities');
    expect(output.context.retryable).toBe(true);
  });

  it('handles unknown errors with GENERAL_ERROR', () => {
    handleError('string error');

    const output = JSON.parse(stderrSpy.mock.calls[0][0] as string);
    expect(output.error).toBe('string error');
    expect(output.code).toBe(ExitCode.GENERAL_ERROR);
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
  });

  it('handles Error instances with GENERAL_ERROR', () => {
    handleError(new Error('plain error'));

    const output = JSON.parse(stderrSpy.mock.calls[0][0] as string);
    expect(output.error).toBe('plain error');
    expect(output.code).toBe(ExitCode.GENERAL_ERROR);
  });
});
