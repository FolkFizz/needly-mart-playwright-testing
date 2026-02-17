import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@fixtures/test.base';
import { accounts } from '@data/accounts';

const assertNoCriticalOrSerious = async (page: import('@playwright/test').Page) => {
  const result = await new AxeBuilder({ page }).analyze();
  const blockers = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
};

test.describe('AUTH :: A11y @a11y @auth', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: login page has no critical or serious accessibility violations @smoke @a11y @safe',
      async ({ page, authPage }) => {
        await authPage.gotoLogin();
        await assertNoCriticalOrSerious(page);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: invalid login state remains accessible @a11y @regression @safe',
      async ({ page, authPage }) => {
        await authPage.gotoLogin();
        await authPage.login(accounts.primary.username, 'invalid_password_!');
        await authPage.assertLoginErrorVisible();
        await assertNoCriticalOrSerious(page);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: forgot-password success state remains accessible on mobile viewport @a11y @regression @mobile @safe',
      async ({ page, authPage }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(accounts.primary.email);
        await authPage.assertForgotPasswordSuccessVisible();
        await assertNoCriticalOrSerious(page);
      }
    );
  });
});
