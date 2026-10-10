import { defineConfig, devices } from '@playwright/test';

/**
 * System tests: the built website in a real (headless) browser against a running backend.
 * Never point this at the school's live backend: the tests create notices, leave requests, enquiries etc.
 * Default: website on http://localhost:5190 built with VITE_API_BASE_URL=http://localhost:8090/api, backend on 8090
 * started with an in-memory H2 database (see README "System tests").
 */
export default defineConfig({
  testDir: './tests/system',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.SYSTEST_WEB_URL || 'http://localhost:5190',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
