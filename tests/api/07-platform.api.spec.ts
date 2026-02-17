import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('PLATFORM :: API Health And Test Hooks', () => {
  test.describe('positive cases', () => {
    test(
      'PLATFORM-P01: liveness endpoint returns up status with timestamp @smoke @api @safe',
      async ({ healthApi }) => {
        const response = await healthApi.liveness();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.status).toBe('up');
        expect(String(body.timestamp || '')).not.toBe('');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PLATFORM-N01: test reset endpoint is blocked without test api key @api @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.reset();
        expect(response.status()).toBe(403);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORM-E01: db readiness endpoint returns structured response when db is up or down @api @regression @safe',
      async ({ healthApi }) => {
        const response = await healthApi.readinessDb();
        expect([200, 500]).toContain(response.status());

        const body = await response.json();
        expect(typeof body.ok).toBe('boolean');
        expect(['up', 'down']).toContain(String(body.db));
      }
    );

    test(
      'PLATFORM-E02: test stock endpoint behavior is explicit when api key is provided @api @regression @safe',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const response = await testHooksApi.setStock(1, 5, runtime.testHooks.apiKey);
        expect([200, 403]).toContain(response.status());
      }
    );
  });
});
