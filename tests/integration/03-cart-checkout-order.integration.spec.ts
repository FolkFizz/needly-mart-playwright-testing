import { runtime } from '@config/env';
import { coupons } from '@data/coupons';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('ORDERFLOW :: Integration Cart Coupon Checkout Order', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'ORDERFLOW-P01: full cart coupon checkout order flow succeeds and clears cart @integration @regression @destructive',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 2)).status()).toBe(200);
        expect((await cartApi.applyCoupon(coupons.valid)).status()).toBe(200);

        const authorizeResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authorizeResponse.status()).toBe(200);
        const authorizeBody = await authorizeResponse.json();
        const paymentToken = String(authorizeBody.token || '');
        expect(paymentToken).not.toBe('');

        const placeOrderResponse = await ordersApi.placeMockOrder({
          paymentToken,
          ...checkoutForm.valid
        });
        expect(placeOrderResponse.status()).toBe(200);

        const orderBody = await placeOrderResponse.json();
        expect(orderBody.ok).toBe(true);
        expect(String(orderBody.orderId || '')).toContain('ORD-');

        const cartAfterOrder = await cartApi.get();
        expect(cartAfterOrder.status()).toBe(200);
        const cartBody = await cartAfterOrder.json();
        expect(Array.isArray(cartBody.cart)).toBe(true);
        expect(cartBody.cart.length).toBe(0);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'ORDERFLOW-N01: order placement without authorized payment token is rejected @integration @regression @safe',
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

    test(
      'ORDERFLOW-N02: declined card stops order flow at authorization step @integration @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const response = await ordersApi.authorizeMockPayment(testCards.declined);
        expect(response.status()).toBe(402);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(body.status).toBe('declined');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ORDERFLOW-E01: adding quantity above stock is blocked before order placement @integration @regression @safe',
      async ({ productsApi, cartApi }) => {
        const productResponse = await productsApi.getById(products.apple.id);
        expect(productResponse.status()).toBe(200);
        const productBody = await productResponse.json();

        const stock = Number(productBody.product.stock || 0);
        const overLimitQuantity = Math.max(1, stock + 1);

        const addResponse = await cartApi.add(products.apple.id, overLimitQuantity);
        expect(addResponse.status()).toBe(400);

        const body = await addResponse.json();
        expect(body.ok).toBe(false);
      }
    );
  });
});
