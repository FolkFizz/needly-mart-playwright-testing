import { runtime } from '@config/env';
import { coupons } from '@data/coupons';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('SHOP :: UI Shopping Lifecycle', () => {
  test.beforeEach(async ({ authPage, cartPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();

    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();
  });

  test.describe('positive cases', () => {
    test(
      'SHOP-P01: user can browse catalog and open product detail from search and category filter @smoke @e2e @regression @safe',
      async ({ catalogPage, productPage }) => {
        await catalogPage.gotoCatalog();
        await catalogPage.search(products.apple.name);
        await catalogPage.assertProductCardVisible(products.apple.id);

        await catalogPage.selectCategory(products.apple.category);
        await catalogPage.assertProductCardVisible(products.apple.id);

        await catalogPage.openProductDetails(products.apple.id);
        await productPage.assertTitleEquals(products.apple.name);
      }
    );

  });

  test.describe('negative cases', () => {
    test(
      'SHOP-N01: invalid coupon code is rejected in cart @e2e @regression @safe',
      async ({ productPage, cartPage }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.applyCoupon(coupons.invalid);
        await cartPage.assertErrorContains('Invalid coupon code');
      }
    );

    test(
      'SHOP-N02: declined card blocks payment and order creation @e2e @regression @safe',
      async ({ productPage, cartPage, checkoutPage }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.openCheckout();

        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.declined);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clickPayNow();
        await checkoutPage.assertPaymentStatusContains('Card was declined');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'SHOP-E01: adding quantity above available stock shows stock limit error @e2e @regression @safe',
      async ({ productPage, cartPage }) => {
        await productPage.gotoProduct(products.apple.id);

        const stockText = await productPage.readStockText();
        const stockMatch = stockText.match(/(\d+)/);
        const stock = Number.parseInt(String(stockMatch?.[1] || '1'), 10);
        const overLimitQuantity = (Number.isFinite(stock) ? stock : 1) + 1;

        await productPage.setQuantity(overLimitQuantity);
        await productPage.addToCart();
        await cartPage.assertErrorContains('Stock limit reached');
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'SHOP-P02: user can checkout with coupon and receive order confirmation email @smoke @e2e @regression @destructive',
      async ({
        productPage,
        cartPage,
        checkoutPage,
        orderSuccessPage,
        invoicePage,
        inboxPage
      }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.setQuantity(1);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.assertItemRowVisible(products.apple.id);
        await cartPage.applyCoupon(coupons.valid);
        await cartPage.assertCouponApplied(coupons.valid);

        await cartPage.openCheckout();
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await checkoutPage.assertPayButtonEnabled();
        await checkoutPage.clickPayNowAndWaitForSuccess();

        await orderSuccessPage.assertPageVisible();
        const orderId = await orderSuccessPage.readOrderId();
        expect(orderId).toContain('ORD-');

        await orderSuccessPage.openInvoice();
        await invoicePage.assertPageVisible();
        await invoicePage.assertOrderIdContains(orderId);

        await inboxPage.gotoInbox();
        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();
        await inboxPage.openEmail(Number(emailId));
        await inboxPage.assertDetailSubjectContains('[ORDER] Confirmation');
        await inboxPage.assertDetailBodyContains(orderId);
      }
    );
  });
});
