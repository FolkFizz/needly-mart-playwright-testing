import { test } from '@fixtures/test.base';
import { accounts } from '@data/accounts';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('REGISTER :: UI Account Registration', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoRegister();
  });

  test.describe('positive cases', () => {
    test(
      'REGISTER-P01: user can create a new account with valid data @e2e @regression @destructive',
      async ({ authPage }) => {
        const account = buildUniqueAccount('ui_register');
        await authPage.register(account.username, account.email, account.password);
        await authPage.assertLoginPageVisible();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'REGISTER-N01: duplicate username or email is rejected @e2e @regression @safe',
      async ({ authPage }) => {
        await authPage.register(accounts.primary.username, accounts.primary.email, accounts.primary.password);
        await authPage.assertRegisterErrorContainsAny([
          'Username or email already exists',
          'Unable to register now'
        ]);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'REGISTER-E01: mismatched confirm password shows validation error @e2e @regression @safe',
      async ({ authPage }) => {
        const account = buildUniqueAccount('ui_register_edge');
        await authPage.register(account.username, account.email, account.password, `${account.password}_mismatch`);
        await authPage.assertRegisterErrorContains('Passwords do not match');
      }
    );
  });
});
