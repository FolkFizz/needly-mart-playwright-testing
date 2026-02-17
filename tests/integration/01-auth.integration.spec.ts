import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('AUTH :: Integration (API + Demo Inbox + Reset Token)', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: forgot-password issues reset token and allows password update @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);

        const resetToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.resetPassword(resetToken, runtime.user.newPassword)).status()).toBe(200);
        expect((await authApi.login(runtime.user.username, runtime.user.newPassword)).status()).toBe(200);

        // Cleanup: restore original password to keep the test deterministic.
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const restoreToken = await demoInboxApi.readLatestResetToken();
        expect((await authApi.resetPassword(restoreToken, runtime.user.password)).status()).toBe(200);
      }
    );

    test(
      'AUTH-P02: reset token from forgot-password can be validated before use @integration @regression @safe',
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
      'AUTH-N01: reset-password rejects an invalid token @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword('invalid-token-value', runtime.user.newPassword);
        expect([400, 500]).toContain(response.status());
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: forgot-password hides account existence for unknown email @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword('unknown-user-does-not-exist@needlymart.com');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(String(body.message || '').toLowerCase()).toContain('if the email exists');
      }
    );

    test(
      'AUTH-E02: forgot-password accepts normalized email input with spaces and uppercase @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword(`  ${runtime.user.email.toUpperCase()}  `);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(String(body.message || '').toLowerCase()).toContain('if the email exists');
      }
    );
  });
});
