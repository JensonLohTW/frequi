import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

const platformE2e = process.env.PLATFORM_E2E === '1';
const platformBaseURL = process.env.PLATFORM_E2E_BASE_URL || 'http://127.0.0.1:3000';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI; platform e2e is short and sequential for cleaner logs. */
  workers: process.env.CI || platformE2e ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: platformE2e ? 'list' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: platformE2e ? platformBaseURL : 'http://localhost:3000',

    /* Platform P0: trace/video/HAR off by default (scan before upload if re-enabled). */
    trace: platformE2e ? 'off' : 'on-first-retry',
    video: 'off',
    screenshot: platformE2e ? 'off' : 'only-on-failure',
    locale: 'en-US',
  },

  /* Configure projects for major browsers */
  projects: platformE2e
    ? [
        {
          name: 'platform-chromium',
          testMatch: /platform-same-origin\.spec\.ts/,
          use: {
            ...devices['Desktop Chrome'],
            // Prefer bundled Chromium so CI does not require a system Chrome channel.
          },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'], channel: 'chrome' },
          testIgnore: /platform-same-origin\.spec\.ts/,
        },
        {
          name: 'msedge',
          use: { ...devices['Desktop Edge'], channel: 'msedge' }, // or "msedge-beta" or 'msedge-dev'
          testIgnore: /platform-same-origin\.spec\.ts/,
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
          testIgnore: /platform-same-origin\.spec\.ts/,
        },

        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
          testIgnore: /platform-same-origin\.spec\.ts/,
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: platformE2e
    ? undefined
    : {
        command: !process.env.CI ? 'pnpm run dev' : 'pnpm run preview --port 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
});
