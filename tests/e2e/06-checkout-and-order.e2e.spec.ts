import { test } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { products } from '@data/products';
import { checkoutForm, testCards } from '@data/checkout';

test.describe('CHECKOUT :: UI Checkout And Order Placement', () => {
  test.beforeEach(async ({ authPage, productPage, cartPage, checkoutPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();

    await productPage.gotoProduct(products.apple.id);
    await productPage.setQuantity(1);
    await productPage.addToCart();

    await cartPage.gotoCart();
    await cartPage.assertItemRowVisible(products.apple.id);
    await cartPage.openCheckout();

    await checkoutPage.assertPayButtonDisabled();
  });

  test.describe('positive cases', () => {
    test(
      'CHECKOUT-P01: user can place order after successful payment authorization @e2e @regression @destructive',
      async ({ checkoutPage, orderSuccessPage }) => {
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clickPayNowAndWaitForSuccess();

        await orderSuccessPage.assertPageVisible();
        await orderSuccessPage.assertOrderIdVisible();
      }
    );

  });

  test.describe('negative cases', () => {
    test(
      'CHECKOUT-N01: declined card prevents order placement and shows payment error @e2e @regression @safe',
      async ({ checkoutPage }) => {
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.declined);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clickPayNow();
        await checkoutPage.assertPaymentStatusContains('Card was declined');
      }
    );

    test(
      'CHECKOUT-N02: insufficient-funds card prevents order placement @e2e @regression @safe',
      async ({ checkoutPage }) => {
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.insufficientFunds);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clickPayNow();
        await checkoutPage.assertPaymentStatusContains('Insufficient funds');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CHECKOUT-E01: pay button stays disabled when required contact field is missing @e2e @regression @safe',
      async ({ checkoutPage }) => {
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clearAddress();
        await checkoutPage.assertPayButtonDisabled();
      }
    );

    test(
      'CHECKOUT-E02: pay button stays disabled when email field becomes empty @e2e @regression @safe',
      async ({ checkoutPage }) => {
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clearEmail();
        await checkoutPage.assertPayButtonDisabled();
      }
    );
  });
});
