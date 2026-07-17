import { describe, it, expect } from 'vitest';
import { API_BASE_PATH, normalizeApiBase } from '@/platform/apiBase';

describe('normalizeApiBase', () => {
  it('platform uses window.location.origin and appends API path once', () => {
    const result = normalizeApiBase('http://should-be-ignored:8080', true);
    expect(result).toBe(`${window.location.origin}${API_BASE_PATH}`);
    expect(result.endsWith('/api/v1')).toBe(true);
    expect(result.includes('/api/v1/api/v1')).toBe(false);
  });

  it('does not double-append /api/v1 when already present', () => {
    expect(normalizeApiBase('http://localhost:8080/api/v1', false)).toBe(
      'http://localhost:8080/api/v1',
    );
    expect(normalizeApiBase('http://localhost:8080/api/v1/', false)).toBe(
      'http://localhost:8080/api/v1',
    );
  });

  it('appends /api/v1 once when missing', () => {
    expect(normalizeApiBase('http://localhost:8080', false)).toBe('http://localhost:8080/api/v1');
    expect(normalizeApiBase('http://localhost:8080/', false)).toBe('http://localhost:8080/api/v1');
  });

  it('handles null/empty for non-platform as relative API base', () => {
    expect(normalizeApiBase(null, false)).toBe(API_BASE_PATH);
    expect(normalizeApiBase(undefined, false)).toBe(API_BASE_PATH);
    expect(normalizeApiBase('', false)).toBe(API_BASE_PATH);
  });

  it('normalizes only once for repeated calls with already-normalized input', () => {
    const once = normalizeApiBase('http://bot.example', false);
    const twice = normalizeApiBase(once, false);
    expect(once).toBe('http://bot.example/api/v1');
    expect(twice).toBe(once);
  });
});
