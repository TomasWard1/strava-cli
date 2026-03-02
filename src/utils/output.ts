/**
 * Output helper: JSON by default, pretty when --pretty flag is set.
 * Agent-first: JSON to stdout for piping. Pretty for humans.
 */
export function output(data: unknown, prettyFn?: () => string, pretty = false): void {
  if (pretty && prettyFn) {
    console.log(prettyFn());
  } else {
    console.log(JSON.stringify(data));
  }
}
