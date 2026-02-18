import { runtime } from '@config/env';
import { ROUTE } from '@config/routes';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('POSTORDER :: UI Post-Order Lifecycle', () => {
  let orderId = '';

  test.beforeEach(async ({ authPage, cartPage, productPage, checkoutPage, orderSuccessPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();

    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();

    await productPage.gotoProduct(products.apple.id);
    await productPage.setQuantity(1);
    await productPage.addToCart();

    await cartPage.gotoCart();
    await cartPage.openCheckout();
    await checkoutPage.fillContact(checkoutForm.valid);
    await checkoutPage.fillCard(testCards.approved);
    await checkoutPage.clickPayNowAndWaitForSuccess();

    await orderSuccessPage.assertPageVisible();
    orderId = await orderSuccessPage.readOrderId();
    expect(orderId).toContain('ORD-');
  });

  test.describe('positive cases', () => {
    test(
      'POSTORDER-P01: user can open invoice from order history after purchase @e2e @regression @destructive',
      async ({ profilePage, invoicePage }) => {
        await profilePage.gotoProfile('orders');
        await profilePage.assertOrderCardVisible(orderId);

        await profilePage.openInvoiceForOrder(orderId);
        await invoicePage.assertPageVisible();
        await invoicePage.assertOrderIdContains(orderId);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'POSTORDER-N01: tampered invoice id shows not-found page @e2e @regression @safe',
      async ({ page, productPage }) => {
        await page.goto(ROUTE.invoice(`${orderId}-tampered`));
        await productPage.assertNotFoundMessageContains('Invoice not found');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'POSTORDER-E01: order can be moved to trash and restored back to inbox @e2e @regression @destructive',
      async ({ profilePage }) => {
        await profilePage.gotoProfile('orders');
        await profilePage.assertOrderCardVisible(orderId);

        await profilePage.moveOrderToTrash(orderId);
        await profilePage.openOrderTrashTab();
        await profilePage.assertOrderCardVisible(orderId);

        await profilePage.restoreOrderFromTrash(orderId);
        await profilePage.openOrderInboxTab();
        await profilePage.assertOrderCardVisible(orderId);
      }
    );
  });
});
