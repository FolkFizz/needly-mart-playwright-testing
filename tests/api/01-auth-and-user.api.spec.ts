import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('AUTHUSER :: API Auth And User', () => {
  test.describe('positive cases', () => {
    test(
      'AUTHUSER-P01: login with valid credentials returns user and me endpoint payload @smoke @api @safe',
      async ({ authApi }) => {
        const loginResponse = await authApi.login(runtime.user.username, runtime.user.password);
        expect(loginResponse.status()).toBe(200);

        const loginBody = await loginResponse.json();
        expect(loginBody.ok).toBe(true);
        expect(loginBody.user.username).toBe(runtime.user.username);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(200);

        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(meBody.user.username).toBe(runtime.user.username);
      }
    );

    test(
      'AUTHUSER-P02: register can be followed by logout and login with new account @api @regression @destructive',
      async ({ authApi }) => {
        const account = buildUniqueAccount('api_authuser');

        const registerResponse = await authApi.register(account.username, account.email, account.password);
        expect(registerResponse.status()).toBe(201);

        expect((await authApi.logout()).status()).toBe(200);

        const loginResponse = await authApi.login(account.username, account.password);
        expect(loginResponse.status()).toBe(200);

        const loginBody = await loginResponse.json();
        expect(loginBody.ok).toBe(true);
        expect(loginBody.user.username).toBe(account.username);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHUSER-N01: login with invalid password is rejected with 401 @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(runtime.user.username, 'wrong_password_api_check');
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'AUTHUSER-N02: reset-password rejects clearly invalid token @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword('invalid-reset-token-value', runtime.user.newPassword);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHUSER-E01: forgot-password keeps account enumeration-safe response for unknown email @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword('unknown-user-does-not-exist@needlymart.com');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.message || '').toLowerCase()).toContain('if the email exists');
      }
    );

    test(
      'AUTHUSER-E02: forgot-password accepts email with spaces and uppercase characters @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword(`  ${runtime.user.email.toUpperCase()}  `);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.message || '').toLowerCase()).toContain('if the email exists');
      }
    );
  });
});
