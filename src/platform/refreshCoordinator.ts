export interface RefreshCoordinatorOptions {
  /** Performs the actual token refresh HTTP call; must resolve to a non-empty access token. */
  refresh: () => Promise<string>;
  /** Clears stored access/refresh tokens for the current session. */
  clearSession: () => void;
}

export interface RetryableRequestConfig {
  _retry?: boolean;
  headers?: Record<string, unknown> | { set?: (name: string, value: string) => void };
}

export interface RefreshCoordinator {
  /** Single-flight refresh shared across concurrent 401 handlers. */
  runRefresh: () => Promise<string>;
  /** Authorization header value, or undefined when token is missing (never `Bearer undefined`). */
  buildAuthorizationHeader: (token: string | null | undefined) => string | undefined;
  /** Whether this request may still be retried after a refresh (max one retry). */
  shouldRetry: (config: RetryableRequestConfig | undefined) => boolean;
  /** Mark a request as already retried once. */
  markRetry: (config: RetryableRequestConfig) => void;
  /** Apply Authorization only when token is non-empty. */
  applyAuthorization: (config: RetryableRequestConfig, token: string | null | undefined) => void;
}

function isNonEmptyToken(token: string | null | undefined): token is string {
  return typeof token === 'string' && token.trim().length > 0;
}

/**
 * Coordinates concurrent 401 refresh handling:
 * - shares one in-flight refresh Promise
 * - clears session on failure / empty token
 * - never produces `Bearer undefined`
 * - supports a single original-request retry flag
 */
export function createRefreshCoordinator({
  refresh,
  clearSession,
}: RefreshCoordinatorOptions): RefreshCoordinator {
  let inFlight: Promise<string> | null = null;

  function buildAuthorizationHeader(token: string | null | undefined): string | undefined {
    if (!isNonEmptyToken(token)) {
      return undefined;
    }
    return `Bearer ${token}`;
  }

  function runRefresh(): Promise<string> {
    if (inFlight) {
      return inFlight;
    }

    inFlight = (async () => {
      try {
        const token = await refresh();
        if (!isNonEmptyToken(token)) {
          throw new Error('Empty access token from refresh');
        }
        return token;
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  }

  function shouldRetry(config: RetryableRequestConfig | undefined): boolean {
    return Boolean(config) && !config!._retry;
  }

  function markRetry(config: RetryableRequestConfig): void {
    config._retry = true;
  }

  function applyAuthorization(
    config: RetryableRequestConfig,
    token: string | null | undefined,
  ): void {
    const header = buildAuthorizationHeader(token);
    if (!header || !config.headers) {
      return;
    }
    const headers = config.headers as {
      set?: (name: string, value: string) => void;
      Authorization?: string;
    };
    if (typeof headers.set === 'function') {
      headers.set('Authorization', header);
    } else {
      headers.Authorization = header;
    }
  }

  return {
    runRefresh,
    buildAuthorizationHeader,
    shouldRetry,
    markRetry,
    applyAuthorization,
  };
}
