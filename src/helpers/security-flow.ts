export const buildUnknownEmail = (prefix = 'unknown'): string =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10_000)}@needlymart.com`;

export const parseIntegerHeader = (value: string | undefined): number =>
  Number.parseInt(String(value || ''), 10);
