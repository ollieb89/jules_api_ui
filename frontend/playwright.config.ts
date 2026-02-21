import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4700',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run start',
    url: 'http://127.0.0.1:4700',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
