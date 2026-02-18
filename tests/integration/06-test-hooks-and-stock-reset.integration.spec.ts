import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

test.describe('TESTHOOKS :: Integration Test Hooks And Stock Reset', () => {
  test.describe('positive cases', () => {
    test(
      'TESTHOOKS-P01: reset and seed endpoints with configured key return explicit success or production-blocked response @integration @regression @destructive',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const resetResponse = await testHooksApi.reset(runtime.testHooks.apiKey);
        expect([200, 403]).toContain(resetResponse.status());

        const seedResponse = await testHooksApi.seed(runtime.testHooks.apiKey);
        expect([200, 403]).toContain(seedResponse.status());
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'TESTHOOKS-N01: reset endpoint is forbidden without api key @integration @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.reset();
        expect(response.status()).toBe(403);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );

    test(
      'TESTHOOKS-N02: set-stock endpoint is forbidden without api key @integration @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.setStock(1, 50);
        expect(response.status()).toBe(403);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'TESTHOOKS-E01: set-stock with configured key returns validation or access-control response for unknown product @integration @regression @safe',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const response = await testHooksApi.setStock(999_999, 10, runtime.testHooks.apiKey);
        expect([404, 403]).toContain(response.status());
      }
    );

    test(
      'TESTHOOKS-E02: reset-stock endpoint with stock-reset key returns explicit response for invalid stock payload @integration @regression @safe',
      async ({ request }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const response = await request.post('/api/test/reset-stock', {
          data: { stock: -1 },
          headers: {
            Accept: 'application/json',
            'x-stock-reset-key': runtime.testHooks.apiKey
          }
        });

        expect([400, 403]).toContain(response.status());
      }
    );
  });
});
