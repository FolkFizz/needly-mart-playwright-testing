import { test, expect } from '@fixtures/test.base';
import { products } from '@data/products';
import { coupons } from '@data/coupons';

test.describe('CART :: API Cart And Coupon', () => {
  test.beforeEach(async ({ cartApi }) => {
    await cartApi.clear();
  });

  test.describe('positive cases', () => {
    test(
      'CART-P01: add item and apply valid coupon updates totals @smoke @api @safe',
      async ({ cartApi }) => {
        const addResponse = await cartApi.add(products.apple.id, 2);
        expect(addResponse.status()).toBe(200);

        const couponResponse = await cartApi.applyCoupon(coupons.valid);
        expect(couponResponse.status()).toBe(200);

        const cartResponse = await cartApi.get();
        expect(cartResponse.status()).toBe(200);
        const body = await cartResponse.json();
        expect(body.ok).toBe(true);
        expect(body.couponCode).toBe(coupons.valid);
        expect(Number(body.discountPercent)).toBe(20);
      }
    );

    test(
      'CART-P02: update item quantity reflects in cart payload @api @regression @safe',
      async ({ cartApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);
        const updateResponse = await cartApi.updateItem(products.apple.id, 3);
        expect(updateResponse.status()).toBe(200);

        const cartResponse = await cartApi.get();
        const body = await cartResponse.json();
        const item = (body.cart || []).find((row: { id: number }) => Number(row.id) === products.apple.id);
        expect(item).toBeTruthy();
        expect(Number(item.quantity)).toBe(3);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CART-N01: invalid coupon code is rejected @api @regression @safe',
      async ({ cartApi }) => {
        await cartApi.add(products.apple.id, 1);

        const response = await cartApi.applyCoupon(coupons.invalid);
        expect(response.status()).toBe(404);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'CART-N02: expired coupon code is rejected @api @regression @safe',
      async ({ cartApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const response = await cartApi.applyCoupon(coupons.expired);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CART-E01: coupon cannot be applied when cart is empty @api @regression @safe',
      async ({ cartApi }) => {
        const response = await cartApi.applyCoupon(coupons.valid);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });
});
