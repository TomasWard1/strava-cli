export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  AUTH_ERROR = 2,
  RATE_LIMIT = 3,
  NETWORK_ERROR = 4,
}

export interface ErrorContext {
  endpoint?: string;
  statusCode?: number;
  retryable?: boolean;
  [key: string]: unknown;
}

export class CliError extends Error {
  constructor(
    message: string,
    public exitCode: ExitCode = ExitCode.GENERAL_ERROR,
    public context?: ErrorContext,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

function formatErrorJSON(error: unknown): Record<string, unknown> {
  if (error instanceof CliError) {
    const result: Record<string, unknown> = {
      error: error.message,
      code: error.exitCode,
    };
    if (error.context) {
      result.context = error.context;
    }
    return result;
  }

  const message = error instanceof Error ? error.message : String(error);
  return { error: message, code: ExitCode.GENERAL_ERROR };
}

/**
 * Handle errors with TTY-aware output.
 * - TTY (human): human-readable error to stderr
 * - Non-TTY (agent): JSON error to stdout for parsing
 */
export function handleError(error: unknown): never {
  const errJSON = formatErrorJSON(error);
  const isTTY = !!process.stdout.isTTY;

  if (isTTY) {
    const status = errJSON.context && (errJSON.context as Record<string, unknown>).statusCode
      ? ` (${(errJSON.context as Record<string, unknown>).statusCode})`
      : '';
    console.error(`Error: ${errJSON.error}${status}`);
  } else {
    console.log(JSON.stringify(errJSON));
  }

  process.exit(errJSON.code as number);
}
