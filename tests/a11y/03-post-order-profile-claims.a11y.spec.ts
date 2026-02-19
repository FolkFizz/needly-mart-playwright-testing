import { runtime } from '@config/env';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';
import { buildInvoiceId } from '@helpers/factories';

test.describe('POSTORDER-PROFILE-CLAIMS :: A11y', () => {
  test.beforeEach(async ({ authPage, cartPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();

    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();
  });

  test.describe('negative cases', () => {
    test(
      'POSTA11Y-N01: claim form validation errors remain accessible when required fields are missing @a11y @regression @safe',
      async ({ claimPage, a11yAudit }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), '');
        await claimPage.assertErrorContains('Invoice ID and description are required');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'POSTA11Y-P01: order success invoice and profile order-history views have no critical or serious violations @a11y @regression @destructive',
      async ({ productPage, cartPage, checkoutPage, orderSuccessPage, invoicePage, profilePage, a11yAudit }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.openCheckout();
        await checkoutPage.fillContact(checkoutForm.valid);
        await checkoutPage.fillCard(testCards.approved);
        await checkoutPage.clickPayNowAndWaitForSuccess();

        await orderSuccessPage.assertPageVisible();
        await a11yAudit.assertNoCriticalOrSerious();

        const orderId = await orderSuccessPage.readOrderId();
        expect(orderId).not.toBe('');

        await orderSuccessPage.openInvoice();
        await invoicePage.assertPageVisible();
        await a11yAudit.assertNoCriticalOrSerious();

        await invoicePage.backToOrderHistory();
        await profilePage.assertOrderCardVisible(orderId);
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );

    test(
      'POSTA11Y-E01: profile claims and claim-trash tabs remain accessible after claim trash and restore flow @a11y @regression @destructive',
      async ({ claimPage, profilePage, a11yAudit }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), 'A11y edge claim for trash and restore workflow.');

        await profilePage.openClaimsTab();
        await a11yAudit.assertNoCriticalOrSerious();

        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();

        await profilePage.moveClaimToTrash(Number(claimId));
        await profilePage.openClaimTrashTab();
        await profilePage.assertClaimCardVisible(Number(claimId));
        await a11yAudit.assertNoCriticalOrSerious();

        await profilePage.restoreClaimFromTrash(Number(claimId));
        await profilePage.openClaimInboxTab();
        await profilePage.assertClaimCardVisible(Number(claimId));
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
