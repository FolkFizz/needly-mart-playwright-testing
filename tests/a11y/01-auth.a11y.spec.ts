import { test } from '@fixtures/test.base';
import { accounts } from '@data/accounts';

test.describe('AUTH :: A11y', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: login page has no critical or serious accessibility violations @smoke @a11y @safe',
      async ({ authPage, a11yAudit }) => {
        await authPage.gotoLogin();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: invalid login state remains accessible @a11y @regression @safe',
      async ({ authPage, a11yAudit }) => {
        await authPage.gotoLogin();
        await authPage.login(accounts.primary.username, 'invalid_password_!');
        await authPage.assertLoginErrorVisible();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: forgot-password success state remains accessible on mobile viewport @a11y @regression @mobile @safe',
      async ({ authPage, a11yAudit }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(accounts.primary.email);
        await authPage.assertForgotPasswordSuccessVisible();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
