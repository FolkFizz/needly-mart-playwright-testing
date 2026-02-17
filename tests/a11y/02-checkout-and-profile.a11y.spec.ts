import { test } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { products } from '@data/products';
import { checkoutForm, testCards } from '@data/checkout';

test.describe('CHECKOUT-PROFILE :: A11y', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();
  });

  test.describe('positive cases', () => {
    test(
      'CHECKOUTA11Y-P01: checkout page has no critical or serious violations @a11y @regression @safe',
      async ({ productPage, cartPage, checkoutPage, a11yAudit }) => {
        await cartPage.gotoCart();
        await cartPage.clearCartIfNeeded();
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();
        await cartPage.gotoCart();
        await cartPage.openCheckout();
        await checkoutPage.assertPayButtonDisabled();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CHECKOUTA11Y-N01: checkout payment error state remains accessible @a11y @regression @safe',
      async ({ productPage, cartPage, checkoutPage, a11yAudit }) => {
        await cartPage.gotoCart();
        await cartPage.clearCartIfNeeded();
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();
        await cartPage.gotoCart();
        await cartPage.openCheckout();

        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.declined);
        await checkoutPage.clickPayNow();
        await checkoutPage.assertPaymentStatusContains('declined');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CHECKOUTA11Y-E01: profile claims tab remains accessible on mobile viewport @a11y @regression @mobile @safe',
      async ({ profilePage, a11yAudit }) => {
        await profilePage.gotoProfile('claims');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
