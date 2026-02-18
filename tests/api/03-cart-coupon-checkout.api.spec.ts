import { runtime } from '@config/env';
import { coupons } from '@data/coupons';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('CARTCHECKOUT :: API Cart Coupon Checkout', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'CARTCHECKOUT-P01: add item and apply valid coupon updates cart payload totals @smoke @api @safe',
      async ({ cartApi }) => {
        expect((await cartApi.add(products.apple.id, 2)).status()).toBe(200);
        expect((await cartApi.applyCoupon(coupons.valid)).status()).toBe(200);

        const cartResponse = await cartApi.get();
        expect(cartResponse.status()).toBe(200);

        const body = await cartResponse.json();
        expect(body.ok).toBe(true);
        expect(body.couponCode).toBe(coupons.valid);
        expect(Number(body.discountPercent)).toBe(20);
      }
    );

    test(
      'CARTCHECKOUT-P02: authorized payment token allows successful mock order placement @api @regression @destructive',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

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
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CARTCHECKOUT-N01: applying coupon on empty cart is rejected @api @regression @safe',
      async ({ cartApi }) => {
        const response = await cartApi.applyCoupon(coupons.valid);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'CARTCHECKOUT-N02: order placement without authorized payment token is rejected @api @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const response = await ordersApi.placeMockOrder({
          paymentToken: 'invalid-payment-token',
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
      'CARTCHECKOUT-E01: expired test card is rejected during payment authorization @api @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const response = await ordersApi.authorizeMockPayment(testCards.expired);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(body.status).toBe('invalid_expiry');
      }
    );

    test(
      'CARTCHECKOUT-E02: valid payment token cannot place order when address is missing @api @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const authorizeResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authorizeResponse.status()).toBe(200);
        const authorizeBody = await authorizeResponse.json();

        const response = await ordersApi.placeMockOrder({
          paymentToken: String(authorizeBody.token),
          name: checkoutForm.valid.name,
          email: checkoutForm.valid.email,
          address: ''
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });
});
