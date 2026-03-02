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

export function handleError(error: unknown): never {
  if (error instanceof CliError) {
    const output: Record<string, unknown> = {
      error: error.message,
      code: error.exitCode,
    };
    if (error.context) {
      output.context = error.context;
    }
    console.error(JSON.stringify(output));
    process.exit(error.exitCode);
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: message, code: ExitCode.GENERAL_ERROR }));
  process.exit(ExitCode.GENERAL_ERROR);
}
