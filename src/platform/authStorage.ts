/** Storage key used by FreqUI for multi-bot auth payloads. */
export const AUTH_LOGIN_INFO_KEY = 'ftAuthLoginInfo';

/**
 * Narrow storage surface for auth persistence.
 * Callers must not touch token storage outside this adapter.
 */
export interface AuthStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AuthStorageAdapterOptions {
  /** Override localStorage (tests / non-browser hosts). */
  localStorageImpl?: Storage;
  /** Override sessionStorage (tests / non-browser hosts). */
  sessionStorageImpl?: Storage;
}

function createWebStorageAdapter(storage: Storage): AuthStorageAdapter {
  return {
    getItem(key: string): string | null {
      return storage.getItem(key);
    },
    setItem(key: string, value: string): void {
      storage.setItem(key, value);
    },
    removeItem(key: string): void {
      storage.removeItem(key);
    },
  };
}

function resolveStorage(name: 'localStorage' | 'sessionStorage', override?: Storage): Storage {
  if (override) {
    return override;
  }
  try {
    const fromWindow =
      typeof window !== 'undefined' ? (window as Window & typeof globalThis)[name] : undefined;
    if (fromWindow) {
      return fromWindow;
    }
  } catch {
    // ignore
  }
  const fromGlobal = (globalThis as Record<string, unknown>)[name];
  if (fromGlobal && typeof (fromGlobal as Storage).getItem === 'function') {
    return fromGlobal as Storage;
  }
  throw new Error(`${name} is not available`);
}

/**
 * Create an auth storage adapter.
 *
 * - platform=true: sessionStorage; clears legacy localStorage key without migration
 * - platform=false: localStorage (compatible with VueUse useStorage semantics)
 */
export function createAuthStorageAdapter(
  platform: boolean,
  options: AuthStorageAdapterOptions = {},
): AuthStorageAdapter {
  const local = resolveStorage('localStorage', options.localStorageImpl);
  const session = resolveStorage('sessionStorage', options.sessionStorageImpl);

  if (platform) {
    try {
      local.removeItem(AUTH_LOGIN_INFO_KEY);
    } catch {
      // Ignore storage access errors (private mode / SSR).
    }
    return createWebStorageAdapter(session);
  }
  return createWebStorageAdapter(local);
}
