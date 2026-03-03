export type OutputFormat = 'json' | 'pretty' | 'auto';

/**
 * Resolve output format based on explicit flag and TTY detection.
 * - json: always JSON
 * - pretty: always human-readable
 * - auto: pretty if TTY, JSON if piped (agent-first)
 */
export function resolveFormat(format: OutputFormat, isTTY?: boolean): 'json' | 'pretty' {
  if (format === 'json') return 'json';
  if (format === 'pretty') return 'pretty';
  return (isTTY ?? !!process.stdout.isTTY) ? 'pretty' : 'json';
}

/**
 * Extract format from command options.
 * Supports: --format <json|pretty|auto>, --pretty, --json
 */
export function getFormat(opts: { format?: string; pretty?: boolean; json?: boolean }): OutputFormat {
  if (opts.format) return opts.format as OutputFormat;
  if (opts.json) return 'json';
  if (opts.pretty) return 'pretty';
  return 'auto';
}

/**
 * Output helper: format-aware with TTY detection.
 * Agent-first: JSON when piped (auto mode), pretty in terminal.
 */
export function output(data: unknown, prettyFn?: () => string, format: OutputFormat = 'auto'): void {
  const resolved = resolveFormat(format);
  if (resolved === 'pretty' && prettyFn) {
    console.log(prettyFn());
  } else {
    console.log(JSON.stringify(data));
  }
}
