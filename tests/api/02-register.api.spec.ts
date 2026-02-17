import { test, expect } from '@fixtures/test.base';
import { accounts } from '@data/accounts';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('REGISTER :: API Account Registration', () => {
  test.describe('positive cases', () => {
    test(
      'REGISTER-P01: api register with unique account succeeds @api @regression @destructive',
      async ({ authApi }) => {
        const account = buildUniqueAccount('api_register');
        const response = await authApi.register(account.username, account.email, account.password);
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.user.username).toBe(account.username);
      }
    );

    test(
      'REGISTER-P02: api register can be followed by login with the new account @api @regression @destructive',
      async ({ authApi }) => {
        const account = buildUniqueAccount('api_register_login');
        expect((await authApi.register(account.username, account.email, account.password)).status()).toBe(201);
        expect((await authApi.login(account.username, account.password)).status()).toBe(200);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'REGISTER-N01: api register with duplicate username or email is rejected @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.register(
          accounts.primary.username,
          accounts.primary.email,
          accounts.primary.password
        );
        expect(response.status()).toBe(409);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'REGISTER-N02: api register with missing required fields is rejected @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.register('', '', '');
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain('All fields are required');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'REGISTER-E01: api register with mismatched confirmPassword returns validation error @api @regression @safe',
      async ({ authApi }) => {
        const account = buildUniqueAccount('api_register_edge');
        const response = await authApi.register(
          account.username,
          account.email,
          account.password,
          `${account.password}_mismatch`
        );
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain('Passwords do not match');
      }
    );
  });
});
