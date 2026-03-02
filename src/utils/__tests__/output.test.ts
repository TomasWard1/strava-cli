import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveFormat, getFormat, output } from '../output.js';

describe('resolveFormat', () => {
  it('returns json when format is json', () => {
    expect(resolveFormat('json')).toBe('json');
  });

  it('returns pretty when format is pretty', () => {
    expect(resolveFormat('pretty')).toBe('pretty');
  });

  it('returns pretty when auto and TTY', () => {
    expect(resolveFormat('auto', true)).toBe('pretty');
  });

  it('returns json when auto and not TTY', () => {
    expect(resolveFormat('auto', false)).toBe('json');
  });

  it('defaults to process.stdout.isTTY when no isTTY arg', () => {
    // In test environment, isTTY is undefined (falsy) → json
    expect(resolveFormat('auto')).toBe('json');
  });
});

describe('getFormat', () => {
  it('returns explicit format option', () => {
    expect(getFormat({ format: 'json' })).toBe('json');
    expect(getFormat({ format: 'pretty' })).toBe('pretty');
  });

  it('returns json when --json flag', () => {
    expect(getFormat({ json: true })).toBe('json');
  });

  it('returns pretty when --pretty flag', () => {
    expect(getFormat({ pretty: true })).toBe('pretty');
  });

  it('defaults to auto', () => {
    expect(getFormat({})).toBe('auto');
  });
});

describe('output', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs JSON when format resolves to json', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = { id: 1, name: 'test' };

    output(data, () => 'pretty text', 'json');

    expect(spy).toHaveBeenCalledWith(JSON.stringify(data));
  });

  it('outputs pretty text when format resolves to pretty', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    output({ id: 1 }, () => 'formatted output', 'pretty');

    expect(spy).toHaveBeenCalledWith('formatted output');
  });

  it('falls back to JSON when no prettyFn', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = { id: 1 };

    output(data, undefined, 'pretty');

    expect(spy).toHaveBeenCalledWith(JSON.stringify(data));
  });
});
