const workerIndex = Number.parseInt(process.env.TEST_WORKER_INDEX || '0', 10);
const pidToken = process.pid.toString(36).slice(-4);

const buildUniqueStamp = (): string =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, '0')}w${Number.isFinite(workerIndex) ? workerIndex : 0}${pidToken}`;

export const buildUniqueAccount = (prefix = 'qa') => {
  const stamp = buildUniqueStamp();
  return {
    username: `${prefix}_${stamp}`,
    email: `${prefix}_${stamp}@needlymart.com`,
    password: 'qauser123'
  };
};

export const buildInvoiceId = () => `ORD-QA-${buildUniqueStamp()}`;
