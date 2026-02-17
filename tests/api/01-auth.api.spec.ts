import { test, expect } from '@fixtures/test.base';
import { accounts } from '@data/accounts';

test.describe('AUTH :: API Login Flow @api @auth', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: api login with valid credentials returns user payload @smoke @api @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.primary.username, accounts.primary.password);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.user.username).toBe(accounts.primary.username);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: api login with invalid password is rejected @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.invalid.username, accounts.invalid.password);
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: api login trims username whitespace @api @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.edge.usernameWithSpaces, accounts.primary.password);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.user.username).toBe(accounts.primary.username);
      }
    );
  });
});
