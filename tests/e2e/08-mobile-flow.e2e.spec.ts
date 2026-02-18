import { runtime } from '@config/env';
import { products } from '@data/products';
import { test } from '@fixtures/test.base';
import { assertNoHorizontalOverflow } from '@helpers/mobile-layout-audit';

test.describe('MOBILE :: UI Mobile Flow', () => {
  test.describe('positive cases', () => {
    test(
      'MOBILE-P01: mobile user can login add product to cart and open checkout without layout break @smoke @e2e @regression @mobile @safe',
      async ({ authPage, catalogPage, productPage, cartPage, checkoutPage, page }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await catalogPage.gotoCatalog();
        await catalogPage.assertProductCardVisible(products.apple.id);
        await catalogPage.openProductDetails(products.apple.id);

        await productPage.addToCart();

        await cartPage.gotoCart();
        await cartPage.assertItemRowVisible(products.apple.id);
        await cartPage.openCheckout();
        await checkoutPage.assertPayButtonDisabled();
        await assertNoHorizontalOverflow(page);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'MOBILE-N01: invalid login error state remains usable on mobile viewport @e2e @regression @mobile @safe',
      async ({ authPage, page }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, 'invalid_password_mobile_guard');
        await authPage.assertLoginErrorVisible();
        await assertNoHorizontalOverflow(page);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'MOBILE-E01: profile tabs remain usable with no horizontal overflow on mobile @e2e @regression @mobile @safe',
      async ({ authPage, profilePage, page }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await profilePage.gotoProfile('info');
        await profilePage.openOrdersTab();
        await assertNoHorizontalOverflow(page);

        await profilePage.openClaimsTab();
        await assertNoHorizontalOverflow(page);

        await profilePage.openInfoTab();
        await assertNoHorizontalOverflow(page);
      }
    );
  });
});
