import { test } from '@fixtures/test.base';
import { accounts } from '@data/accounts';

test.describe('AUTH :: UI Login Flow @e2e @auth', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoLogin();
  });

  test.describe('positive cases', () => {
    test(
      'AUTH-P01: login with valid credentials succeeds @smoke @e2e @safe',
      async ({ authPage }) => {
        await authPage.login(accounts.primary.username, accounts.primary.password);
        await authPage.assertLoggedInUiVisible();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: login with invalid password shows error @e2e @regression @safe',
      async ({ authPage }) => {
        await authPage.login(accounts.invalid.username, accounts.invalid.password);
        await authPage.assertLoginErrorContains('Invalid username or password');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: login trims leading and trailing username spaces @e2e @regression @safe',
      async ({ authPage }) => {
        await authPage.login(accounts.edge.usernameWithSpaces, accounts.primary.password);
        await authPage.assertLoggedInUiVisible();
      }
    );
  });
});
