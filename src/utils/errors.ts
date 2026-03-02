export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  AUTH_ERROR = 2,
  RATE_LIMIT = 3,
  NETWORK_ERROR = 4,
}

export class CliError extends Error {
  constructor(
    message: string,
    public exitCode: ExitCode = ExitCode.GENERAL_ERROR,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(JSON.stringify({ error: error.message, code: error.exitCode }));
    process.exit(error.exitCode);
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: message, code: ExitCode.GENERAL_ERROR }));
  process.exit(ExitCode.GENERAL_ERROR);
}
