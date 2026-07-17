import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRefreshCoordinator } from '@/platform/refreshCoordinator';

describe('createRefreshCoordinator', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('shares a single in-flight refresh across concurrent callers', async () => {
    let calls = 0;
    const coordinator = createRefreshCoordinator({
      refresh: async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 40));
        return 'new-token';
      },
      clearSession: vi.fn(),
    });

    const [a, b, c] = await Promise.all([
      coordinator.runRefresh(),
      coordinator.runRefresh(),
      coordinator.runRefresh(),
    ]);

    expect(a).toBe('new-token');
    expect(b).toBe('new-token');
    expect(c).toBe('new-token');
    expect(calls).toBe(1);
  });

  it('allows a new refresh after the previous one settles', async () => {
    let calls = 0;
    const coordinator = createRefreshCoordinator({
      refresh: async () => {
        calls += 1;
        return `token-${calls}`;
      },
      clearSession: vi.fn(),
    });

    await expect(coordinator.runRefresh()).resolves.toBe('token-1');
    await expect(coordinator.runRefresh()).resolves.toBe('token-2');
    expect(calls).toBe(2);
  });

  it('clears session when refresh fails and does not leave Bearer undefined', async () => {
    const clearSession = vi.fn();
    const coordinator = createRefreshCoordinator({
      refresh: async () => {
        throw new Error('refresh failed');
      },
      clearSession,
    });

    await expect(coordinator.runRefresh()).rejects.toThrow('refresh failed');
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(coordinator.buildAuthorizationHeader(undefined)).toBeUndefined();
    expect(coordinator.buildAuthorizationHeader(null)).toBeUndefined();
  });

  it('clears session when refresh returns empty token', async () => {
    const clearSession = vi.fn();
    const coordinator = createRefreshCoordinator({
      refresh: async () => '',
      clearSession,
    });

    await expect(coordinator.runRefresh()).rejects.toThrow();
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(coordinator.buildAuthorizationHeader('')).toBeUndefined();
  });

  it('never builds Bearer undefined / Bearer null strings', () => {
    const coordinator = createRefreshCoordinator({
      refresh: async () => 'tok',
      clearSession: vi.fn(),
    });

    expect(coordinator.buildAuthorizationHeader(undefined)).toBeUndefined();
    expect(coordinator.buildAuthorizationHeader(null)).toBeUndefined();
    expect(coordinator.buildAuthorizationHeader('')).toBeUndefined();
    expect(coordinator.buildAuthorizationHeader('   ')).toBeUndefined();
    expect(coordinator.buildAuthorizationHeader('abc')).toBe('Bearer abc');
  });

  it('tracks single retry of original request via markRetry helper', () => {
    const coordinator = createRefreshCoordinator({
      refresh: async () => 'tok',
      clearSession: vi.fn(),
    });
    const config: { _retry?: boolean } = {};
    expect(coordinator.shouldRetry(config)).toBe(true);
    coordinator.markRetry(config);
    expect(config._retry).toBe(true);
    expect(coordinator.shouldRetry(config)).toBe(false);
  });
});
