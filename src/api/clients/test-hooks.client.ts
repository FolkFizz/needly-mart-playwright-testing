import { APIRequestContext, APIResponse } from '@playwright/test';

type TestHookAccess = 'test-access' | 'stock-reset';

type TestHookRequest = {
  path: string;
  access: TestHookAccess;
  apiKey?: string;
  data?: Record<string, unknown>;
  operation: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableStatus = (status: number): boolean => status === 408 || status === 429 || status >= 500;

const toErrorMessage = (raw: unknown): string => {
  if (raw instanceof Error) return raw.message;
  return String(raw ?? 'unknown error');
};

export class TestHooksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private buildHeaders(access: TestHookAccess, apiKey = '') {
    const authHeader = access === 'test-access' ? 'x-test-api-key' : 'x-stock-reset-key';
    return {
      Accept: 'application/json',
      ...(apiKey ? { [authHeader]: apiKey } : {})
    };
  }

  private async postWithPolicy(input: TestHookRequest): Promise<APIResponse> {
    let lastStatus: number | null = null;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.request.post(input.path, {
          data: input.data,
          headers: this.buildHeaders(input.access, input.apiKey || ''),
          timeout: DEFAULT_TIMEOUT_MS
        });

        if (!isRetriableStatus(response.status()) || attempt === MAX_ATTEMPTS) {
          return response;
        }

        lastStatus = response.status();
      } catch (error) {
        lastError = error;
        if (attempt === MAX_ATTEMPTS) {
          break;
        }
      }

      await delay(RETRY_DELAY_MS * attempt);
    }

    if (lastError) {
      throw new Error(
        `[test-hooks] ${input.operation} failed after ${MAX_ATTEMPTS} attempts: ${toErrorMessage(lastError)}`
      );
    }

    throw new Error(
      `[test-hooks] ${input.operation} returned retriable status ${lastStatus ?? 'unknown'} for all ${MAX_ATTEMPTS} attempts`
    );
  }

  async reset(apiKey = '') {
    return this.postWithPolicy({
      path: '/api/test/reset',
      access: 'test-access',
      apiKey,
      operation: 'reset'
    });
  }

  async seed(apiKey = '') {
    return this.postWithPolicy({
      path: '/api/test/seed',
      access: 'test-access',
      apiKey,
      operation: 'seed'
    });
  }

  async setStock(productId: number, stock: number, stockResetApiKey = '') {
    return this.postWithPolicy({
      path: '/api/test/set-stock',
      access: 'stock-reset',
      apiKey: stockResetApiKey,
      operation: 'set-stock',
      data: { productId, stock },
    });
  }

  async resetStock(stock: number, stockResetApiKey = '') {
    return this.postWithPolicy({
      path: '/api/test/reset-stock',
      access: 'stock-reset',
      apiKey: stockResetApiKey,
      operation: 'reset-stock',
      data: { stock },
    });
  }
}
