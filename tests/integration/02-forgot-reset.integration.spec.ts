import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('PASSWORD RESET :: Integration (Auth API + Demo Inbox)', () => {
  test.describe('positive cases', () => {
    test(
      'RESET-P01: forgot-password creates a token that can be validated @integration @regression @safe',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const token = await demoInboxApi.readLatestResetToken();

        const validateResponse = await authApi.validateResetToken(token);
        expect(validateResponse.status()).toBe(200);

        const body = await validateResponse.json();
        expect(body.ok).toBe(true);
        expect(body.tokenValid).toBe(true);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'RESET-N01: reset-password rejects clearly invalid token @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword('invalid-reset-token', runtime.user.newPassword);
        expect([400, 500]).toContain(response.status());

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'RESET-E01: reset token is single-use and cannot be reused after successful reset @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const token = await demoInboxApi.readLatestResetToken();

        expect((await authApi.resetPassword(token, runtime.user.newPassword)).status()).toBe(200);
        expect((await authApi.login(runtime.user.username, runtime.user.newPassword)).status()).toBe(200);

        const secondTryResponse = await authApi.resetPassword(token, runtime.user.password);
        expect([400, 500]).toContain(secondTryResponse.status());

        // Cleanup: restore initial password with a fresh token.
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const restoreToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.resetPassword(restoreToken, runtime.user.password)).status()).toBe(200);
      }
    );
  });
});
