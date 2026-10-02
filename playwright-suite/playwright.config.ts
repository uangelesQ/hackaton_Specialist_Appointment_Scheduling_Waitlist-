import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalTeardown: './tests/helpers/globalTeardown.ts',
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        environmentInfo: {
          baseUrl: baseURL,
          apiUrl: process.env.API_URL ?? 'http://localhost:3001',
          node: process.version,
        },
      },
    ],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -w @waitlist/web',
    cwd: '..',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
