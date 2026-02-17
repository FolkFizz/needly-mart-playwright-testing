import { test } from '@fixtures/test.base';
import { products } from '@data/products';
import { coupons } from '@data/coupons';

test.describe('CART :: UI Cart And Coupon', () => {
  test.beforeEach(async ({ cartPage }) => {
    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();
  });

  test.describe('positive cases', () => {
    test(
      'CART-P01: user can add item and apply valid coupon in cart @smoke @e2e @safe',
      async ({ cartPage, productPage }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.setQuantity(2);
        await productPage.addToCart();

        await cartPage.assertItemRowVisible(products.apple.id);
        await cartPage.applyCoupon(coupons.valid);
        await cartPage.assertCouponApplied(coupons.valid);
        await cartPage.assertDiscountVisible();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CART-N01: invalid coupon code shows error message @e2e @regression @safe',
      async ({ cartPage, productPage }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();

        await cartPage.applyCoupon(coupons.invalid);
        await cartPage.assertErrorContains('Invalid coupon code');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CART-E01: applying coupon on empty cart is blocked @e2e @regression @safe',
      async ({ cartPage }) => {
        await cartPage.applyCoupon(coupons.valid);
        await cartPage.assertErrorContains('Add items to cart before applying a coupon');
      }
    );
  });
});
