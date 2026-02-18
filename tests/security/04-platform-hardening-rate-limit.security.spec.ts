import { accounts } from '@data/accounts';
import { securityData } from '@data/security';
import { ROUTE } from '@config/routes';
import { runtime } from '@config/env';
import { parseIntegerHeader } from '@helpers/security-flow';
import { test, expect } from '@fixtures/test.base';

test.describe('PLATFORMHARDENING :: Security Headers And Rate Limiting', () => {
  test.describe('positive cases', () => {
    test(
      'PLATSEC-P01: home page exposes hardening headers and hides x-powered-by @smoke @security @safe',
      async ({ request }) => {
        const response = await request.get(ROUTE.home, {
          headers: { Accept: securityData.headers.accept.html }
        });
        expect(response.status()).toBe(securityData.status.ok);

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
        expect(response.status()).toBe(securityData.status.ok);

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
        const response = await request.get(securityData.routes.notFound, {
          headers: { Accept: securityData.headers.accept.html }
        });
        expect(response.status()).toBe(securityData.status.notFound);

        const headers = response.headers();
        for (const headerName of runtime.security.requiredResponseHeaders) {
          expect(headers[headerName]).toBeTruthy();
        }
      }
    );

    test(
      'PLATSEC-N02: failed auth requests include rate limit headers @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.primary.username, accounts.invalid.password);
        expect([securityData.status.unauthorized, securityData.status.tooManyRequests]).toContain(response.status());

        const headers = response.headers();
        for (const headerName of securityData.headers.rateLimit) {
          expect(headers[headerName]).toBeTruthy();
        }
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATSEC-E01: auth limiter is not looser than global limiter policy @security @regression @safe',
      async ({ request, authApi }) => {
        const homeResponse = await request.get(ROUTE.home, {
          headers: { Accept: securityData.headers.accept.html }
        });
        expect(homeResponse.status()).toBe(securityData.status.ok);

        const authResponse = await authApi.login(accounts.primary.username, accounts.invalid.password);
        expect([securityData.status.unauthorized, securityData.status.tooManyRequests]).toContain(
          authResponse.status()
        );

        const globalLimit = parseIntegerHeader(homeResponse.headers()['ratelimit-limit']);
        const authLimit = parseIntegerHeader(authResponse.headers()['ratelimit-limit']);

        expect(Number.isFinite(globalLimit)).toBe(true);
        expect(Number.isFinite(authLimit)).toBe(true);
        expect(authLimit).toBeLessThanOrEqual(globalLimit);
      }
    );
  });
});
