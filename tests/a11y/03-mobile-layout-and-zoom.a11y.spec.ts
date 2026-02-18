import { runtime } from '@config/env';
import { products } from '@data/products';
import { test } from '@fixtures/test.base';
import { assertNoHorizontalOverflow, setTextZoom } from '@helpers/mobile-layout-audit';

test.describe('MOBILE :: A11y Layout And Zoom', () => {
  test.describe('positive cases', () => {
    test(
      'MOBILEA11Y-P01: catalog page has no critical or serious violations on mobile viewport @a11y @regression @mobile @safe',
      async ({ catalogPage, a11yAudit }) => {
        await catalogPage.gotoCatalog();
        await catalogPage.assertProductCardVisible(products.apple.id);
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'MOBILEA11Y-N01: invalid login state remains accessible on mobile viewport @a11y @regression @mobile @safe',
      async ({ authPage, a11yAudit }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, 'invalid_password_mobile_a11y_check');
        await authPage.assertLoginErrorVisible();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'MOBILEA11Y-E01: profile tabs remain accessible with 200 percent text zoom on mobile viewport @a11y @regression @mobile @safe',
      async ({ authPage, profilePage, page, a11yAudit }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await profilePage.gotoProfile('info');
        await setTextZoom(page, 200);
        await a11yAudit.assertNoCriticalOrSerious();
        await assertNoHorizontalOverflow(page);

        await profilePage.openOrdersTab();
        await a11yAudit.assertNoCriticalOrSerious();
        await assertNoHorizontalOverflow(page);

        await profilePage.openClaimsTab();
        await a11yAudit.assertNoCriticalOrSerious();
        await assertNoHorizontalOverflow(page);
      }
    );
  });
});
