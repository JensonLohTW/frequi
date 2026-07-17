/**
 * Platform single-origin smoke (P0).
 *
 * Requires:
 * - PLATFORM_E2E=1
 * - Frontend built with VITE_PLATFORM_SINGLE_ORIGIN=true
 *   (compose.ci frontend image, or local preview started by scripts/run_platform_e2e.sh)
 *
 * Optional:
 * - E2E_SENTINEL_TOKEN: unique access_token value (auto-generated if unset)
 * - PLATFORM_E2E_REAL_API=1: hit live /api/v1/ping through nginx (compose.ci)
 * - E2E_SENTINEL_OUT: write access sentinel to this path for scripts/scan_token_leak.sh
 *
 * Trace/video/HAR stay off for this file (see playwright.config platform project).
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

const enabled = process.env.PLATFORM_E2E === '1';
const realApi = process.env.PLATFORM_E2E_REAL_API === '1';

function makeSentinel(kind: 'access' | 'refresh'): string {
  if (kind === 'access' && process.env.E2E_SENTINEL_TOKEN) {
    return process.env.E2E_SENTINEL_TOKEN;
  }
  const base = process.env.E2E_SENTINEL_TOKEN || `e2e-sentinel-${randomBytes(16).toString('hex')}`;
  return kind === 'access' ? base : `${base}-refresh`;
}

async function mockPlatformApis(page: Page, accessToken: string, refreshToken: string) {
  // Most-specific routes first; catch-all last (Playwright matches newest first, with fallback).
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/token/login') || url.includes('/api/v1/ping')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {},
    });
  });

  await page.route('**/api/v1/ping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { status: 'pong' },
    });
  });

  await page.route('**/api/v1/token/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  });
}

async function dumpStorage(page: Page) {
  return page.evaluate(() => {
    const dump = (store: Storage) => {
      const out: Record<string, string | null> = {};
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key) {
          out[key] = store.getItem(key);
        }
      }
      return out;
    };
    return { local: dump(localStorage), session: dump(sessionStorage) };
  });
}

test.describe('Platform same-origin smoke', () => {
  test.skip(!enabled, 'Set PLATFORM_E2E=1 against a VITE_PLATFORM_SINGLE_ORIGIN=true build');

  test('ping via same-origin /api path', async ({ page, request }) => {
    if (realApi) {
      const res = await request.get('/api/v1/ping');
      expect(res.ok(), `ping status ${res.status()}`).toBeTruthy();
      const body = await res.json();
      expect(body).toMatchObject({ status: 'pong' });
      return;
    }

    await page.route('**/api/v1/ping', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { status: 'pong' },
      });
    });
    await page.goto('/');
    const body = await page.evaluate(async () => {
      const res = await fetch('/api/v1/ping');
      return res.json();
    });
    expect(body).toMatchObject({ status: 'pong' });
  });

  test('login keeps token in sessionStorage only; not localStorage or console', async ({
    page,
  }) => {
    const accessSentinel = makeSentinel('access');
    const refreshSentinel = makeSentinel('refresh');
    if (process.env.E2E_SENTINEL_OUT) {
      writeFileSync(process.env.E2E_SENTINEL_OUT, accessSentinel, { mode: 0o600 });
    }

    const consoleLines: string[] = [];
    page.on('console', (msg) => {
      consoleLines.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleLines.push(String(err));
    });

    await mockPlatformApis(page, accessSentinel, refreshSentinel);

    // Open app once so the origin is valid, then plant a legacy localStorage auth blob.
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(
        'ftAuthLoginInfo',
        JSON.stringify({
          'ftbot.0': {
            botName: 'LegacyBot',
            apiUrl: 'http://127.0.0.1:8080',
            accessToken: 'legacy-access-must-not-migrate',
            refreshToken: 'legacy-refresh-must-not-migrate',
            autoRefresh: true,
          },
        }),
      );
    });
    // Platform adapter must drop the legacy key on boot (no migration into sessionStorage).
    await page.reload();
    await page.waitForLoadState('networkidle');

    const afterBoot = await dumpStorage(page);
    expect(
      afterBoot.local.ftAuthLoginInfo ?? null,
      `legacy localStorage auth should be cleared on platform boot; storage=${JSON.stringify(afterBoot)}`,
    ).toBeNull();
    // useStorage may writeDefaults "{}" into sessionStorage — that is fine, but legacy tokens must not migrate.
    const sessionBoot = afterBoot.session.ftAuthLoginInfo ?? '';
    expect(sessionBoot).not.toContain('legacy-access-must-not-migrate');
    expect(sessionBoot).not.toContain('legacy-refresh-must-not-migrate');
    expect(sessionBoot).not.toContain('LegacyBot');

    await expect(page.getByText('Freqtrade bot Login')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('textbox', { name: 'Bot Name' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Bot Name' }).fill('PlatformBot');
    // URL stays at window.location.origin (single-origin); still fill username/password.
    await page.getByRole('textbox', { name: 'Username' }).fill('freqtrade');
    await page.getByRole('textbox', { name: 'Password' }).fill('ci-only-password-not-a-secret!!');

    const loginButton = page.locator('button[type=submit]');
    await expect(loginButton).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/token/login') && r.request().method() === 'POST',
      ),
      loginButton.click(),
    ]);

    await expect(page.getByText('PlatformBot', { exact: true })).toBeVisible({ timeout: 15_000 });

    const storage = await dumpStorage(page);

    expect(storage.local.ftAuthLoginInfo ?? null).toBeNull();
    expect(storage.session.ftAuthLoginInfo).toBeTruthy();
    expect(storage.session.ftAuthLoginInfo).toContain(accessSentinel);
    expect(storage.session.ftAuthLoginInfo).toContain(refreshSentinel);

    const localBlob = JSON.stringify(storage.local);
    expect(localBlob).not.toContain(accessSentinel);
    expect(localBlob).not.toContain(refreshSentinel);
    expect(localBlob).not.toContain('legacy-access-must-not-migrate');

    const consoleBlob = consoleLines.join('\n');
    expect(consoleBlob).not.toContain(accessSentinel);
    expect(consoleBlob).not.toContain(refreshSentinel);
  });
});
