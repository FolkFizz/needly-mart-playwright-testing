import { accounts } from '@data/accounts';
import { integrationData } from '@data/integration';
import { test, expect } from '@fixtures/test.base';

test.describe('RESETINBOX :: Integration Forgot Reset Demo Inbox', () => {
  test.describe('negative cases', () => {
    test(
      'RESETINBOX-N01: forgot-password requires non-empty email @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword('');
        expect(response.status()).toBe(integrationData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'RESETINBOX-N02: reset-password rejects invalid token @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword(integrationData.reset.invalidToken, accounts.primary.newPassword);
        expect(response.status()).toBe(integrationData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'RESETINBOX-P01: forgot-password creates reset token in demo inbox and allows password reset end-to-end @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        const resetRequestedAtMs = Date.now();
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(integrationData.status.ok);

        const resetToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs: resetRequestedAtMs,
          recipient: {
            username: accounts.primary.username,
            password: accounts.primary.password,
            email: accounts.primary.email
          }
        });
        expect((await authApi.validateResetToken(resetToken)).status()).toBe(integrationData.status.ok);
        expect((await authApi.resetPassword(resetToken, accounts.primary.newPassword)).status()).toBe(
          integrationData.status.ok
        );
        expect((await authApi.login(accounts.primary.username, accounts.primary.newPassword)).status()).toBe(
          integrationData.status.ok
        );

        // Cleanup to keep environment stable for next runs.
        const restoreRequestedAtMs = Date.now();
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(integrationData.status.ok);
        const restoreToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs: restoreRequestedAtMs,
          recipient: {
            username: accounts.primary.username,
            password: accounts.primary.newPassword,
            email: accounts.primary.email
          }
        });
        expect((await authApi.resetPassword(restoreToken, accounts.primary.password)).status()).toBe(
          integrationData.status.ok
        );
      }
    );

    test(
      'RESETINBOX-E01: reset token is single-use and cannot be reused after successful reset @integration @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        const resetRequestedAtMs = Date.now();
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(integrationData.status.ok);
        const token = await demoInboxApi.readLatestResetToken({
          requestedAtMs: resetRequestedAtMs,
          recipient: {
            username: accounts.primary.username,
            password: accounts.primary.password,
            email: accounts.primary.email
          }
        });

        expect((await authApi.resetPassword(token, accounts.primary.newPassword)).status()).toBe(
          integrationData.status.ok
        );

        const secondTry = await authApi.resetPassword(token, accounts.primary.password);
        expect(secondTry.status()).toBe(integrationData.status.badRequest);

        // Cleanup password back to baseline.
        const restoreRequestedAtMs = Date.now();
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(integrationData.status.ok);
        const restoreToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs: restoreRequestedAtMs,
          recipient: {
            username: accounts.primary.username,
            password: accounts.primary.newPassword,
            email: accounts.primary.email
          }
        });
        expect((await authApi.resetPassword(restoreToken, accounts.primary.password)).status()).toBe(
          integrationData.status.ok
        );
      }
    );
  });
});
