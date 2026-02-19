import dotenv from 'dotenv';

dotenv.config();

type IdentityMode = 'static' | 'worker';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNonNegativeInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const pick = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

const resolveIdentityMode = (value: string | undefined): IdentityMode => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === '' || normalized === 'worker') return 'worker';
  if (normalized === 'static') return 'static';
  throw new Error(
    `[config] Unsupported TEST_IDENTITY_MODE="${value}". Use one of: worker, static.`
  );
};

const compactToken = (value: string | undefined, fallback: string): string => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (normalized.length > 0) return normalized.slice(-6);
  return fallback;
};

const splitEmail = (email: string): { local: string; domain: string } => {
  const [localPart, domainPart] = email.split('@');
  const local = localPart && localPart.length > 0 ? localPart : 'user';
  const domain = domainPart && domainPart.length > 0 ? domainPart : 'needlymart.com';
  return { local, domain };
};

const withIdentityUsername = (username: string, suffix: string, mode: IdentityMode): string =>
  mode === 'worker' ? `${username}_${suffix}` : username;

const withIdentityEmail = (email: string, suffix: string, mode: IdentityMode): string => {
  if (mode !== 'worker') return email;
  const { local, domain } = splitEmail(email);
  return `${local}+${suffix}@${domain}`;
};

const baseUrl = pick('PROD_URL', 'https://needly-mart-web.onrender.com');
const identityMode = resolveIdentityMode(process.env.TEST_IDENTITY_MODE);
const workerIndex = toNonNegativeInt(process.env.TEST_WORKER_INDEX, 0);
const runTokenFallback = `${Date.now().toString(36)}${process.pid.toString(36)}`.slice(-6);
const runToken = compactToken(process.env.TEST_RUN_ID, runTokenFallback);
const identitySuffix = `w${workerIndex}${runToken}`;

const baseUser = {
  username: pick('TEST_USER_USERNAME', 'user'),
  password: pick('TEST_USER_PASSWORD', 'user123'),
  email: pick('TEST_USER_EMAIL', 'user@needlymart.com'),
  newPassword: pick('TEST_USER_NEW_PASSWORD', 'user123_new')
};

export const runtime = {
  baseUrl,
  headless: toBool(process.env.HEADLESS, true),
  user: {
    username: withIdentityUsername(baseUser.username, identitySuffix, identityMode),
    password: baseUser.password,
    email: withIdentityEmail(baseUser.email, identitySuffix, identityMode),
    newPassword: baseUser.newPassword
  },
  identity: {
    mode: identityMode,
    workerIndex,
    runToken,
    suffix: identitySuffix,
    autoProvisionUser: toBool(process.env.TEST_AUTO_PROVISION_USER, true)
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
