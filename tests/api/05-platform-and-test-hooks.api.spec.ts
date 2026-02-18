import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

test.describe('PLATFORMHOOKS :: API Platform And Test Hooks', () => {
  test.describe('positive cases', () => {
    test(
      'PLATFORMHOOKS-P01: liveness endpoint returns up status with timestamp @smoke @api @safe',
      async ({ healthApi }) => {
        const response = await healthApi.liveness();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.status).toBe('up');
        expect(String(body.timestamp || '')).not.toBe('');
      }
    );

    test(
      'PLATFORMHOOKS-P02: db readiness endpoint returns structured state payload @api @regression @safe',
      async ({ healthApi }) => {
        const response = await healthApi.readinessDb();
        expect([200, 500]).toContain(response.status());

        const body = await response.json();
        expect(typeof body.ok).toBe('boolean');
        expect(['up', 'down']).toContain(String(body.db));
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PLATFORMHOOKS-N01: reset endpoint is blocked without api key @api @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.reset();
        expect(response.status()).toBe(403);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );

    test(
      'PLATFORMHOOKS-N02: seed endpoint is blocked without api key @api @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.seed();
        expect(response.status()).toBe(403);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORMHOOKS-E01: reset endpoint with configured key returns explicit success or production-blocked response @api @regression @destructive',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const response = await testHooksApi.reset(runtime.testHooks.apiKey);
        expect([200, 403]).toContain(response.status());

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || body.ok || '')).not.toBe('');
      }
    );

    test(
      'PLATFORMHOOKS-E02: stock-reset endpoint with configured key returns explicit behavior @api @regression @safe',
      async ({ request }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const response = await request.post('/api/test/reset-stock', {
          data: { stock: 50 },
          headers: {
            Accept: 'application/json',
            'x-test-api-key': runtime.testHooks.apiKey
          }
        });

        expect([200, 403]).toContain(response.status());

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || body.ok || '')).not.toBe('');
      }
    );
  });
});
