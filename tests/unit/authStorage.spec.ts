import { describe, it, expect, beforeEach } from 'vitest';
import { AUTH_LOGIN_INFO_KEY, createAuthStorageAdapter } from '@/platform/authStorage';

/** Minimal Storage polyfill — Node 26 leaves global localStorage undefined without --localstorage-file. */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
  };
}

describe('createAuthStorageAdapter', () => {
  let local: Storage;
  let session: Storage;

  beforeEach(() => {
    local = createMemoryStorage();
    session = createMemoryStorage();
  });

  it('platform uses sessionStorage', () => {
    const adapter = createAuthStorageAdapter(true, {
      localStorageImpl: local,
      sessionStorageImpl: session,
    });
    adapter.setItem('k', 'v');
    expect(session.getItem('k')).toBe('v');
    expect(local.getItem('k')).toBeNull();
    expect(adapter.getItem('k')).toBe('v');
  });

  it('platform clears old localStorage ftAuthLoginInfo without migration', () => {
    local.setItem(
      AUTH_LOGIN_INFO_KEY,
      JSON.stringify({ bot: { accessToken: 'old-token', refreshToken: 'old-refresh' } }),
    );

    const adapter = createAuthStorageAdapter(true, {
      localStorageImpl: local,
      sessionStorageImpl: session,
    });

    expect(local.getItem(AUTH_LOGIN_INFO_KEY)).toBeNull();
    // Must not migrate old token into sessionStorage
    expect(adapter.getItem(AUTH_LOGIN_INFO_KEY)).toBeNull();
    expect(session.getItem(AUTH_LOGIN_INFO_KEY)).toBeNull();
  });

  it('non-platform uses localStorage and leaves sessionStorage alone', () => {
    const adapter = createAuthStorageAdapter(false, {
      localStorageImpl: local,
      sessionStorageImpl: session,
    });
    adapter.setItem(AUTH_LOGIN_INFO_KEY, 'data');
    expect(local.getItem(AUTH_LOGIN_INFO_KEY)).toBe('data');
    expect(session.getItem(AUTH_LOGIN_INFO_KEY)).toBeNull();
    expect(adapter.getItem(AUTH_LOGIN_INFO_KEY)).toBe('data');
    adapter.removeItem(AUTH_LOGIN_INFO_KEY);
    expect(local.getItem(AUTH_LOGIN_INFO_KEY)).toBeNull();
  });

  it('non-platform does not clear existing localStorage auth', () => {
    local.setItem(AUTH_LOGIN_INFO_KEY, '{"kept":true}');
    createAuthStorageAdapter(false, {
      localStorageImpl: local,
      sessionStorageImpl: session,
    });
    expect(local.getItem(AUTH_LOGIN_INFO_KEY)).toBe('{"kept":true}');
  });
});
