/** Freqtrade REST API path suffix. */
export const API_BASE_PATH = '/api/v1';

/**
 * Normalize API base URL exactly once.
 *
 * - platform=true: always `window.location.origin + /api/v1`
 * - platform=false: use provided apiUrl; append `/api/v1` only if missing
 */
export function normalizeApiBase(apiUrl: string | null | undefined, platform: boolean): string {
  if (platform) {
    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    return `${origin}${API_BASE_PATH}`;
  }

  if (apiUrl == null || apiUrl === '') {
    return API_BASE_PATH;
  }

  const trimmed = apiUrl.replace(/\/+$/, '');
  if (trimmed.endsWith(API_BASE_PATH)) {
    return trimmed;
  }
  return `${trimmed}${API_BASE_PATH}`;
}
