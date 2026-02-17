import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { products } from '@data/products';
import { checkoutForm, testCards } from '@data/checkout';

test.describe('CHECKOUT :: API Payment Authorization And Order Placement', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
    expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'CHECKOUT-P01: authorized payment token allows successful order placement @api @regression @destructive',
      async ({ cartApi, ordersApi }) => {
        const authorizeResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authorizeResponse.status()).toBe(200);

        const authorizeBody = await authorizeResponse.json();
        expect(authorizeBody.ok).toBe(true);
        expect(authorizeBody.status).toBe('approved');
        expect(String(authorizeBody.token || '')).not.toBe('');

        const orderResponse = await ordersApi.placeMockOrder({
          paymentToken: String(authorizeBody.token),
          ...checkoutForm.valid
        });
        expect(orderResponse.status()).toBe(200);

        const orderBody = await orderResponse.json();
        expect(orderBody.ok).toBe(true);
        expect(String(orderBody.orderId || '')).toContain('ORD-');
        expect(Number(orderBody.total)).toBeGreaterThan(0);

        const cartResponse = await cartApi.get();
        expect(cartResponse.status()).toBe(200);
        const cartBody = await cartResponse.json();
        expect(Array.isArray(cartBody.cart)).toBe(true);
        expect(cartBody.cart.length).toBe(0);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CHECKOUT-N01: placing order without valid payment token is rejected @api @regression @safe',
      async ({ ordersApi }) => {
        const response = await ordersApi.placeMockOrder({
          paymentToken: 'invalid-payment-token',
          ...checkoutForm.valid
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain('Payment is not authorized');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CHECKOUT-E01: expired card is rejected at authorization step @api @regression @safe',
      async ({ ordersApi }) => {
        const response = await ordersApi.authorizeMockPayment(testCards.expired);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(body.status).toBe('invalid_expiry');
        expect(String(body.message || '')).toContain('expired');
      }
    );
  });
});
