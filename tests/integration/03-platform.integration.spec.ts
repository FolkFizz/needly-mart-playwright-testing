import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { products } from '@data/products';
import { checkoutForm } from '@data/checkout';

test.describe('PLATFORM :: Integration (Auth + Cart + Order + Health)', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'PLATFORM-P01: authenticated user can add cart item and read me profile @integration @regression @safe',
      async ({ authApi, cartApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);
        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(200);

        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(meBody.user.username).toBe(runtime.user.username);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PLATFORM-N01: order placement without authorized payment token is rejected @integration @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);
        const response = await ordersApi.placeMockOrder({
          paymentToken: 'missing-token',
          ...checkoutForm.valid
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORM-E01: liveness endpoint responds quickly even after auth and cart operations @integration @regression @safe',
      async ({ cartApi, healthApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);
        const startedAt = Date.now();
        const response = await healthApi.liveness();
        const elapsedMs = Date.now() - startedAt;

        expect(response.status()).toBe(200);
        expect(elapsedMs).toBeLessThan(2_500);
      }
    );
  });
});
