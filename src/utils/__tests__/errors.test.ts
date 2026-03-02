import { describe, it, expect } from 'vitest';
import { CliError, ExitCode } from '../errors.js';

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
