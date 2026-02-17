import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('AUTH :: Security Baseline', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: login page returns baseline security headers @smoke @security @safe',
      async ({ authApi }) => {
        const response = await authApi.getLoginPage();
        expect(response.status()).toBe(200);

        const headers = response.headers();
        for (const headerName of runtime.security.requiredResponseHeaders) {
          expect(headers[headerName]).toBeTruthy();
        }
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: unauthenticated user cannot access me api @security @regression @safe',
      async ({ authApi }) => {
        await authApi.logout();
        const response = await authApi.me();
        expect(response.status()).toBe(401);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: session cookie contains HttpOnly and SameSite flags @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(runtime.user.username, runtime.user.password);
        expect(response.status()).toBe(200);

        const setCookie = response.headers()['set-cookie'] || '';
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('SameSite=Lax');
      }
    );
  });
});
