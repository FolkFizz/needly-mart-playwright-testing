import { runtime } from '@config/env';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('AUTHSESSION :: Integration Auth Session Cart Merge', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    await authApi.logout();
    await cartApi.clear();
  });

  test.describe('positive cases', () => {
    test(
      'AUTHSESSION-P01: anonymous cart item is preserved through login and me endpoint confirms authenticated user @integration @regression @safe',
      async ({ cartApi, authApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const beforeLoginCart = await cartApi.get();
        expect(beforeLoginCart.status()).toBe(200);

        const loginResponse = await authApi.login(runtime.user.username, runtime.user.password);
        expect(loginResponse.status()).toBe(200);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(200);
        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(meBody.user.username).toBe(runtime.user.username);

        const afterLoginCart = await cartApi.get();
        expect(afterLoginCart.status()).toBe(200);
        const cartBody = await afterLoginCart.json();
        const item = (cartBody.cart || []).find((row: { id: number }) => Number(row.id) === products.apple.id);
        expect(item).toBeTruthy();
        expect(Number(item.quantity)).toBeGreaterThanOrEqual(1);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHSESSION-N01: invalid login does not create authenticated session @integration @regression @safe',
      async ({ authApi }) => {
        const loginResponse = await authApi.login(runtime.user.username, 'wrong_password_integration_guard');
        expect(loginResponse.status()).toBe(401);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(401);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHSESSION-E01: repeated login and logout cycle keeps session behavior consistent @integration @regression @safe',
      async ({ authApi, cartApi }) => {
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
        expect((await authApi.logout()).status()).toBe(200);
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);

        const cartResponse = await cartApi.get();
        expect(cartResponse.status()).toBe(200);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(200);
      }
    );
  });
});
