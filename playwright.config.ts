import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',         // Where your test files live
  outputDir: 'test-results/', // Where screenshots/videos go
  fullyParallel: true,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }], // Standard HTML report
    ['list']                                         // Console output
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});