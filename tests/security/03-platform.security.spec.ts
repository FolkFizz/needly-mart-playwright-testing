import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('PLATFORM :: Security Behavior', () => {
  test.describe('positive cases', () => {
    test(
      'PLATFORM-P01: home page returns baseline hardening headers @security @regression @safe',
      async ({ request }) => {
        const response = await request.get('/home', {
          headers: { Accept: 'text/html' }
        });
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
      'PLATFORM-N01: checkout route is inaccessible without authenticated session @security @regression @safe',
      async ({ request }) => {
        const response = await request.get('/order/checkout', {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="login-page"');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORM-E01: logout api endpoint accepts request without csrf token in session context @security @regression @safe',
      async ({ authApi }) => {
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
        const response = await authApi.logout();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
      }
    );
  });
});
