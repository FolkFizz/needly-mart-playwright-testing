import { runtime } from '@config/env';
import { ROUTE } from '@config/routes';
import { test, expect } from '@fixtures/test.base';

test.describe('GUARD :: UI Access Control And Route Guards', () => {
  test.describe('positive cases', () => {
    test(
      'GUARD-P01: unauthenticated user is redirected from profile checkout and claim routes @smoke @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto(ROUTE.profile('info'));
        await authPage.assertLoginPageVisible();

        await page.goto(ROUTE.checkout);
        await authPage.assertLoginPageVisible();

        await page.goto('/claim');
        await authPage.assertLoginPageVisible();
      }
    );

    test(
      'GUARD-P02: unauthenticated user is redirected from private inbox and invoice routes @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto('/inbox');
        await authPage.assertLoginPageVisible();

        await page.goto(ROUTE.invoice('ORD-1700000000000-1'));
        await authPage.assertLoginPageVisible();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'GUARD-N01: cart api blocks unauthenticated add-item requests with 401 @e2e @regression @safe',
      async ({ request }) => {
        const response = await request.post('/api/cart/add', {
          data: { productId: 1, quantity: 1 },
          headers: { Accept: 'application/json' }
        });
        expect(response.status()).toBe(401);
      }
    );

    test(
      'GUARD-N02: private inbox mutation endpoint is blocked without authentication @e2e @regression @safe',
      async ({ request }) => {
        const response = await request.post('/inbox/trash/empty', {
          headers: { Accept: 'application/json' }
        });
        expect(response.status()).toBe(401);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'GUARD-E01: after logout user cannot re-open protected profile route @e2e @regression @safe',
      async ({ authPage, page }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await page.goto(ROUTE.profile('info'));
        await authPage.logout();

        await page.goto(ROUTE.profile('info'));
        await authPage.assertLoginPageVisible();
      }
    );
  });
});
