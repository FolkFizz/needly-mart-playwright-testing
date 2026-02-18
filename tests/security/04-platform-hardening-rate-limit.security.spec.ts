import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

const toInt = (value: string | undefined) => Number.parseInt(String(value || ''), 10);

test.describe('PLATFORMHARDENING :: Security Headers And Rate Limiting', () => {
  test.describe('positive cases', () => {
    test(
      'PLATSEC-P01: home page exposes hardening headers and hides x-powered-by @smoke @security @safe',
      async ({ request }) => {
        const response = await request.get('/home', {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(200);

        const headers = response.headers();
        for (const headerName of runtime.security.requiredResponseHeaders) {
          expect(headers[headerName]).toBeTruthy();
        }
        expect(headers['x-powered-by']).toBeUndefined();
      }
    );

    test(
      'PLATSEC-P02: health endpoint is public and does not create session cookie @security @regression @safe',
      async ({ healthApi }) => {
        const response = await healthApi.liveness();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(response.headers()['set-cookie']).toBeUndefined();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PLATSEC-N01: not found routes still return security headers @security @regression @safe',
      async ({ request }) => {
        const response = await request.get('/route-that-does-not-exist', {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(404);

        const headers = response.headers();
        for (const headerName of runtime.security.requiredResponseHeaders) {
          expect(headers[headerName]).toBeTruthy();
        }
      }
    );

    test(
      'PLATSEC-N02: failed auth requests include rate limit headers @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(runtime.user.username, 'wrong_password_123');
        expect([401, 429]).toContain(response.status());

        const headers = response.headers();
        expect(headers['ratelimit-limit']).toBeTruthy();
        expect(headers['ratelimit-remaining']).toBeTruthy();
        expect(headers['ratelimit-reset']).toBeTruthy();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATSEC-E01: auth limiter is not looser than global limiter policy @security @regression @safe',
      async ({ request, authApi }) => {
        const homeResponse = await request.get('/home', {
          headers: { Accept: 'text/html' }
        });
        expect(homeResponse.status()).toBe(200);

        const authResponse = await authApi.login(runtime.user.username, 'wrong_password_123');
        expect([401, 429]).toContain(authResponse.status());

        const globalLimit = toInt(homeResponse.headers()['ratelimit-limit']);
        const authLimit = toInt(authResponse.headers()['ratelimit-limit']);

        expect(Number.isFinite(globalLimit)).toBe(true);
        expect(Number.isFinite(authLimit)).toBe(true);
        expect(authLimit).toBeLessThanOrEqual(globalLimit);
      }
    );
  });
});
