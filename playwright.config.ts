import { defineConfig, devices } from '@playwright/test';
import { runtime } from './src/config/env';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTagRegex = (raw: string | undefined): RegExp | undefined => {
  if (!raw) return undefined;
  const tags = raw.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (tags.length === 0) return undefined;

  const lookaheads = tags.map((tag) => `(?=.*${escapeRegExp(tag)})`).join('');
  return new RegExp(`${lookaheads}.*`, 'i');
};

const grep = buildTagRegex(process.env.TAGS);
const grepInvert = buildTagRegex(process.env.EXCLUDE_TAGS);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: runtime.timeouts.test,
  expect: {
    timeout: runtime.timeouts.expect
  },
  grep,
  grepInvert,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', suiteTitle: false }]
  ],
  use: {
    baseURL: runtime.baseUrl,
    headless: runtime.headless,
    actionTimeout: runtime.timeouts.action,
    navigationTimeout: runtime.timeouts.navigation,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@mobile/
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grepInvert: /@mobile/
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 15 Pro'] },
      grep: /@mobile/
    },
    {
      name: 'pixel',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile/
    }
  ]
});
