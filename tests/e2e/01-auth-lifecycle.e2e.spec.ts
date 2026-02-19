import { runtime } from '@config/env';
import { accounts } from '@data/accounts';
import { test, expect } from '@fixtures/test.base';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('AUTH :: UI Auth Lifecycle', () => {
  test.describe('negative cases', () => {
    test(
      'AUTH-N01: login with invalid password shows authentication error @e2e @regression @safe',
      async ({ authPage }) => {
        await authPage.gotoLogin();
        await authPage.login(accounts.invalid.username, accounts.invalid.password);
        await authPage.assertLoginErrorContains('Invalid username or password');
      }
    );

    test(
      'AUTH-N02: reset-password rejects mismatched confirmation password @e2e @regression @safe',
      async ({ authPage, demoInboxApi }) => {
        const requestedAtMs = Date.now();
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        const resetToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs,
          recipient: {
            username: runtime.user.username,
            password: runtime.user.password,
            email: runtime.user.email
          }
        });
        await authPage.gotoResetPassword(resetToken);
        await authPage.submitResetPassword(runtime.user.newPassword, `${runtime.user.newPassword}_mismatch`);
        await authPage.assertResetPasswordErrorContains('Passwords do not match');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: login trims leading and trailing spaces in username input @e2e @regression @safe',
      async ({ authPage }) => {
        await authPage.gotoLogin();
        await authPage.login(accounts.edge.usernameWithSpaces, runtime.user.password);
        await authPage.assertLoggedInUiVisible();
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'AUTH-P01: user can register a new account then login and logout successfully @smoke @e2e @regression @destructive',
      async ({ authPage }) => {
        const account = buildUniqueAccount('ui_auth_lifecycle');

        await authPage.gotoRegister();
        await authPage.register(account.username, account.email, account.password);
        await authPage.assertLoginPageVisible();

        await authPage.login(account.username, account.password);
        await authPage.assertLoggedInUiVisible();

        await authPage.logout();
        await authPage.assertLoginPageVisible();
      }
    );

    test(
      'AUTH-P02: forgot-password and reset-password flow works end-to-end @e2e @regression @destructive',
      async ({ authPage, demoInboxApi }) => {
        const firstRequestedAtMs = Date.now();
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        const resetToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs: firstRequestedAtMs,
          recipient: {
            username: runtime.user.username,
            password: runtime.user.password,
            email: runtime.user.email
          }
        });
        expect(resetToken).not.toBe('');

        await authPage.gotoResetPassword(resetToken);
        await authPage.submitResetPassword(runtime.user.newPassword);

        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.newPassword);
        await authPage.assertLoggedInUiVisible();

        const restoreRequestedAtMs = Date.now();
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        const restoreToken = await demoInboxApi.readLatestResetToken({
          requestedAtMs: restoreRequestedAtMs,
          recipient: {
            username: runtime.user.username,
            password: runtime.user.newPassword,
            email: runtime.user.email
          }
        });
        expect(restoreToken).not.toBe('');

        await authPage.gotoResetPassword(restoreToken);
        await authPage.submitResetPassword(runtime.user.password);

        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();
      }
    );
  });
});
