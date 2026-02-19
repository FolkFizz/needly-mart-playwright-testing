import { runtime } from '@config/env';
import { test } from '@fixtures/test.base';

test.describe('AUTH-GUARD :: A11y', () => {
  test.describe('positive cases', () => {
    test(
      'AUTHA11Y-P01: login and register pages have no critical or serious accessibility violations @a11y @smoke @safe',
      async ({ authPage, a11yAudit }) => {
        await authPage.gotoLogin();
        await a11yAudit.assertNoCriticalOrSerious();

        await authPage.openCreateAccount();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHA11Y-N01: invalid login error state and guard redirect remain accessible @a11y @regression @safe',
      async ({ authPage, a11yAudit, page }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, 'invalid_password_a11y_guard_check');
        await authPage.assertLoginErrorVisible();
        await a11yAudit.assertNoCriticalOrSerious();

        await page.goto('/profile?tab=info');
        await authPage.assertLoginPageVisible();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHA11Y-E01: reset-password page rendered from a valid token remains accessible @a11y @regression @safe',
      async ({ authPage, demoInboxApi, a11yAudit }) => {
        const requestedAtMs = Date.now();
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        const token = await demoInboxApi.readLatestResetToken({
          requestedAtMs,
          recipient: {
            username: runtime.user.username,
            password: runtime.user.password,
            email: runtime.user.email
          }
        });
        await authPage.gotoResetPassword(token);
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
