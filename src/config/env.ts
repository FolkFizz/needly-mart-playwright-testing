import dotenv from 'dotenv';

dotenv.config();

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const pick = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

const baseUrl = pick('PROD_URL', 'https://needly-mart-web.onrender.com');

export const runtime = {
  baseUrl,
  headless: toBool(process.env.HEADLESS, true),
  user: {
    username: pick('TEST_USER_USERNAME', 'user'),
    password: pick('TEST_USER_PASSWORD', 'user123'),
    email: pick('TEST_USER_EMAIL', 'user@needlymart.com'),
    newPassword: pick('TEST_USER_NEW_PASSWORD', 'user123_new')
  },
  testHooks: {
    apiKey: pick('TEST_API_KEY', '')
  },
  timeouts: {
    test: toInt(process.env.TEST_TIMEOUT_MS, 45_000),
    expect: toInt(process.env.EXPECT_TIMEOUT_MS, 7_000),
    action: toInt(process.env.ACTION_TIMEOUT_MS, 15_000),
    navigation: toInt(process.env.NAVIGATION_TIMEOUT_MS, 30_000)
  },
  security: {
    requiredResponseHeaders: [
      'x-content-type-options',
      'x-frame-options',
      'content-security-policy'
    ]
  }
};
