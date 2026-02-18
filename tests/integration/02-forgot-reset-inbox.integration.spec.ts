import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

test.describe('RESETINBOX :: Integration Forgot Reset Demo Inbox', () => {
  test.describe('positive cases', () => {
    test(
      'RESETINBOX-P01: forgot-password creates reset token in demo inbox and allows password reset end-to-end @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);

        const resetToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.validateResetToken(resetToken)).status()).toBe(200);
        expect((await authApi.resetPassword(resetToken, runtime.user.newPassword)).status()).toBe(200);
        expect((await authApi.login(runtime.user.username, runtime.user.newPassword)).status()).toBe(200);

        // Cleanup to keep environment stable for next runs.
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const restoreToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.resetPassword(restoreToken, runtime.user.password)).status()).toBe(200);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'RESETINBOX-N01: forgot-password requires non-empty email @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword('');
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'RESETINBOX-N02: reset-password rejects invalid token @integration @regression @safe',
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
      'RESETINBOX-E01: reset token is single-use and cannot be reused after successful reset @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const token = await demoInboxApi.readLatestResetToken();

        expect((await authApi.resetPassword(token, runtime.user.newPassword)).status()).toBe(200);

        const secondTry = await authApi.resetPassword(token, runtime.user.password);
        expect(secondTry.status()).toBe(400);

        // Cleanup password back to baseline.
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const restoreToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.resetPassword(restoreToken, runtime.user.password)).status()).toBe(200);
      }
    );
  });
});
