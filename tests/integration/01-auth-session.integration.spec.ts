import { accounts } from '@data/accounts';
import { integrationData } from '@data/integration';
import { test, expect } from '@fixtures/test.base';
import { pickInStockProductId } from '@helpers/integration-flow';

test.describe('AUTHSESSION :: Integration Auth Session Cart Merge', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    await authApi.logout();
    await cartApi.clear();
  });

  test.describe('positive cases', () => {
    test(
      'AUTHSESSION-P01: anonymous cart item is preserved through login and me endpoint confirms authenticated user @integration @regression @safe',
      async ({ cartApi, authApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, 1)).status()).toBe(integrationData.status.ok);

        const beforeLoginCart = await cartApi.get();
        expect(beforeLoginCart.status()).toBe(integrationData.status.ok);

        const loginResponse = await authApi.login(accounts.primary.username, accounts.primary.password);
        expect(loginResponse.status()).toBe(integrationData.status.ok);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(integrationData.status.ok);
        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(meBody.user.username).toBe(accounts.primary.username);

        const afterLoginCart = await cartApi.get();
        expect(afterLoginCart.status()).toBe(integrationData.status.ok);
        const cartBody = await afterLoginCart.json();
        const item = (cartBody.cart || []).find((row: { id: number }) => Number(row.id) === productId);
        expect(item).toBeTruthy();
        expect(Number(item.quantity)).toBeGreaterThanOrEqual(integrationData.order.quantity.single);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHSESSION-N01: invalid login does not create authenticated session @integration @regression @safe',
      async ({ authApi }) => {
        const loginResponse = await authApi.login(accounts.primary.username, integrationData.auth.invalidPassword);
        expect(loginResponse.status()).toBe(integrationData.status.unauthorized);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(integrationData.status.unauthorized);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHSESSION-E01: repeated login and logout cycle keeps session behavior consistent @integration @regression @safe',
      async ({ authApi, cartApi }) => {
        expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
          integrationData.status.ok
        );
        expect((await authApi.logout()).status()).toBe(integrationData.status.ok);
        expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
          integrationData.status.ok
        );

        const cartResponse = await cartApi.get();
        expect(cartResponse.status()).toBe(integrationData.status.ok);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(integrationData.status.ok);
      }
    );
  });
});
