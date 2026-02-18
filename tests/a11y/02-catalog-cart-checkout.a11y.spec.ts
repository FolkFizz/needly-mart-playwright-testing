import { runtime } from '@config/env';
import { coupons } from '@data/coupons';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test } from '@fixtures/test.base';

test.describe('SHOP :: A11y Catalog Cart Checkout', () => {
  test.beforeEach(async ({ authPage, cartPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();

    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();
  });

  test.describe('positive cases', () => {
    test(
      'SHOPA11Y-P01: catalog cart and checkout happy-path screens have no critical or serious violations @a11y @smoke @safe',
      async ({ catalogPage, productPage, cartPage, checkoutPage, a11yAudit }) => {
        await catalogPage.gotoCatalog();
        await catalogPage.search(products.apple.name);
        await a11yAudit.assertNoCriticalOrSerious();

        await catalogPage.openProductDetails(products.apple.id);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.assertItemRowVisible(products.apple.id);
        await a11yAudit.assertNoCriticalOrSerious();

        await cartPage.openCheckout();
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'SHOPA11Y-N01: invalid coupon and declined payment states remain accessible @a11y @regression @safe',
      async ({ productPage, cartPage, checkoutPage, a11yAudit }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.applyCoupon(coupons.invalid);
        await cartPage.assertErrorContains('Invalid coupon code');
        await a11yAudit.assertNoCriticalOrSerious();

        await cartPage.openCheckout();
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.declined);
        await checkoutPage.clickPayNow();
        await checkoutPage.assertPaymentStatusContains('Card was declined');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'SHOPA11Y-E01: empty-search catalog state and empty-cart coupon validation state remain accessible @a11y @regression @safe',
      async ({ catalogPage, cartPage, a11yAudit }) => {
        await catalogPage.gotoCatalog();
        await catalogPage.search('no-product-result-for-a11y-edge-check');
        await catalogPage.assertEmptyStateVisible();
        await a11yAudit.assertNoCriticalOrSerious();

        await cartPage.gotoCart();
        await cartPage.clearCartIfNeeded();
        await cartPage.applyCoupon(coupons.valid);
        await cartPage.assertErrorContains('Add items to cart before applying a coupon');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
