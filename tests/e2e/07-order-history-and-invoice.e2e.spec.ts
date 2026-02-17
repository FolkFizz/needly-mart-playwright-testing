import { test, expect } from '@fixtures/test.base';
import { products } from '@data/products';
import { checkoutForm, testCards } from '@data/checkout';
import { runtime } from '@config/env';
import { ROUTE } from '@config/routes';

test.describe('ORDER :: UI Order History And Invoice', () => {
  let orderId = '';

  test.beforeEach(async ({ authPage, productPage, cartPage, checkoutPage, orderSuccessPage }) => {
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
      'ORDER-P01: user can open invoice from order success and see totals @e2e @regression @destructive',
      async ({ orderSuccessPage, invoicePage }) => {
        await orderSuccessPage.openInvoice();
        await invoicePage.assertPageVisible();
        await invoicePage.assertOrderIdContains(orderId);
        expect(await invoicePage.readGrandTotal()).toBeGreaterThan(0);
      }
    );

    test(
      'ORDER-P02: user can open invoice from profile order history tab @e2e @regression @destructive',
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
      'ORDER-N01: invoice page redirects to login after logout @e2e @regression @safe',
      async ({ authPage, page }) => {
        await authPage.logout();
        await page.goto(ROUTE.invoice(orderId));
        await authPage.assertLoginPageVisible();
      }
    );

    test(
      'ORDER-N02: profile order history is inaccessible after logout @e2e @regression @safe',
      async ({ authPage, page }) => {
        await authPage.logout();
        await page.goto('/profile?tab=orders');
        await authPage.assertLoginPageVisible();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ORDER-E01: user can move order to trash and restore it back @e2e @regression @destructive',
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
