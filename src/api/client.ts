import { getValidTokens } from '../auth/tokens.js';
import { BASE_URL } from './endpoints.js';
import { CliError, ExitCode } from '../utils/errors.js';
import { withRetry } from './retry.js';

export interface QueryParams {
  page?: number;
  per_page?: number;
  before?: number;
  after?: number;
  [key: string]: string | number | boolean | undefined;
}

interface RateLimitBucket {
  limit: number;
  used: number;
  remaining: number;
}

interface RateLimitInfo {
  fifteen_min: RateLimitBucket;
  daily: RateLimitBucket;
}

let rateLimitState: RateLimitInfo = {
  fifteen_min: { limit: 200, used: 0, remaining: 200 },
  daily: { limit: 2000, used: 0, remaining: 2000 },
};

function updateRateLimits(headers: Headers): void {
  const limitHeader = headers.get('x-ratelimit-limit');
  const usageHeader = headers.get('x-ratelimit-usage');

  if (limitHeader && usageHeader) {
    const [fifteenMinLimit, dailyLimit] = limitHeader.split(',').map(Number);
    const [fifteenMinUsed, dailyUsed] = usageHeader.split(',').map(Number);

    rateLimitState = {
      fifteen_min: {
        limit: fifteenMinLimit,
        used: fifteenMinUsed,
        remaining: fifteenMinLimit - fifteenMinUsed,
      },
      daily: {
        limit: dailyLimit,
        used: dailyUsed,
        remaining: dailyLimit - dailyUsed,
      },
    };
  }
}

export function getRateLimitStatus(): RateLimitInfo {
  return { ...rateLimitState };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
}

export async function makeRequest<T>(
  endpoint: string,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<T> {
  const tokens = await getValidTokens();

  const url = new URL(BASE_URL + endpoint);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return withRetry(
    async () => {
      let response: Response;
      try {
        const fetchOptions: RequestInit = {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        };
        if (options?.method) {
          fetchOptions.method = options.method;
        }
        if (options?.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }
        response = await fetch(url.toString(), fetchOptions);
      } catch (error) {
        throw new CliError(
          `Network error: ${error instanceof Error ? error.message : String(error)}`,
          ExitCode.NETWORK_ERROR,
          { endpoint, retryable: true },
        );
      }

      updateRateLimits(response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          throw new CliError(
            'Authentication failed. Run: strava-cli auth login',
            ExitCode.AUTH_ERROR,
            { endpoint, statusCode: 401, retryable: false },
          );
        }
        if (response.status === 429) {
          const status = getRateLimitStatus();
          throw new CliError(
            `Rate limit exceeded (15min: ${status.fifteen_min.used}/${status.fifteen_min.limit}, daily: ${status.daily.used}/${status.daily.limit})`,
            ExitCode.RATE_LIMIT,
            { endpoint, statusCode: 429, retryable: true },
          );
        }
        const text = await response.text();
        throw new CliError(
          `API request failed (${response.status}): ${text}`,
          ExitCode.GENERAL_ERROR,
          { endpoint, statusCode: response.status, retryable: false },
        );
      }

      return response.json() as Promise<T>;
    },
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      shouldRetry: (error) => {
        if (error instanceof CliError) {
          // Retry network errors and rate limits
          if (error.exitCode === ExitCode.NETWORK_ERROR || error.exitCode === ExitCode.RATE_LIMIT) {
            return true;
          }
          // Don't retry auth or other API errors
          return false;
        }
        // Retry unknown errors (network issues, etc.)
        return true;
      },
    },
  );
}

export async function fetchAllPages<T>(
  endpoint: string,
  params: QueryParams = {},
  perPage = 30,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const pageResults = await makeRequest<T[]>(endpoint, {
      ...params,
      page,
      per_page: perPage,
    });

    results.push(...pageResults);

    if (pageResults.length < perPage) {
      break;
    }

    page++;
  }

  return results;
}
