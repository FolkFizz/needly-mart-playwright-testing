import { defineConfig, devices } from '@playwright/test';
import { runtime } from './src/config/env';

type ExecutionProfile = 'all' | 'smoke' | 'safe' | 'stateful';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseTags = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
};

const buildAllTagRegex = (tags: string[]): RegExp | undefined => {
  if (tags.length === 0) return undefined;

  const lookaheads = tags.map((tag) => `(?=.*${escapeRegExp(tag)})`).join('');
  return new RegExp(`${lookaheads}.*`, 'i');
};

const buildAnyTagRegex = (tags: string[]): RegExp | undefined => {
  if (tags.length === 0) return undefined;
  const patterns = tags.map((tag) => escapeRegExp(tag)).join('|');
  return new RegExp(`(?:${patterns})`, 'i');
};

const uniqueTags = (tags: string[]): string[] => [...new Set(tags)];

const resolveExecutionProfile = (raw: string | undefined): ExecutionProfile => {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === '' || value === 'all') return 'all';
  if (value === 'smoke') return 'smoke';
  if (value === 'safe') return 'safe';
  if (value === 'stateful') return 'stateful';

  throw new Error(
    `[config] Unsupported EXECUTION_PROFILE="${raw}". Use one of: all, smoke, safe, stateful.`
  );
};

const defaultWorkers = process.env.CI ? 2 : undefined;
const executionProfile = resolveExecutionProfile(process.env.EXECUTION_PROFILE);
const profileConfig: Record<
  ExecutionProfile,
  {
    includeTags: string[];
    excludeTags: string[];
    fullyParallel: boolean;
    workers: number | undefined;
  }
> = {
  all: {
    includeTags: [],
    excludeTags: [],
    fullyParallel: true,
    workers: defaultWorkers
  },
  smoke: {
    includeTags: ['@smoke'],
    excludeTags: ['@destructive'],
    fullyParallel: false,
    workers: 1
  },
  safe: {
    includeTags: ['@safe'],
    excludeTags: ['@destructive'],
    fullyParallel: true,
    workers: defaultWorkers
  },
  stateful: {
    includeTags: ['@destructive'],
    excludeTags: [],
    fullyParallel: false,
    workers: 1
  }
};

const selectedProfile = profileConfig[executionProfile];
const baseIncludeTags = uniqueTags([...selectedProfile.includeTags, ...parseTags(process.env.TAGS)]);
const baseExcludeTags = uniqueTags([...selectedProfile.excludeTags, ...parseTags(process.env.EXCLUDE_TAGS)]);

const buildProjectFilters = (options?: { includeTags?: string[]; excludeTags?: string[] }) => ({
  grep: buildAllTagRegex(uniqueTags([...baseIncludeTags, ...(options?.includeTags ?? [])])),
  grepInvert: buildAnyTagRegex(uniqueTags([...baseExcludeTags, ...(options?.excludeTags ?? [])]))
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: selectedProfile.fullyParallel,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: selectedProfile.workers,
  timeout: runtime.timeouts.test,
  expect: {
    timeout: runtime.timeouts.expect
  },
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
      ...buildProjectFilters({ excludeTags: ['@mobile'] })
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      ...buildProjectFilters({ excludeTags: ['@mobile'] })
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 15 Pro'] },
      ...buildProjectFilters({ includeTags: ['@mobile'] })
    },
    {
      name: 'pixel',
      use: { ...devices['Pixel 7'] },
      ...buildProjectFilters({ includeTags: ['@mobile'] })
    }
  ]
});
