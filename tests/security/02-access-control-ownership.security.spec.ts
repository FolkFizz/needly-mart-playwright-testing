import { accounts } from '@data/accounts';
import { securityData } from '@data/security';
import { test, expect } from '@fixtures/test.base';
import { createApprovedOrder, pickInStockProductId } from '@helpers/integration-flow';

test.describe('ACCESSCONTROL :: Security Access Control And Ownership', () => {
  test.describe('positive cases', () => {
    test(
      'ACCESSSEC-P01: authenticated user can access me endpoint @smoke @security @safe',
      async ({ authApi }) => {
        expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
          securityData.status.ok
        );

        const response = await authApi.me();
        expect(response.status()).toBe(securityData.status.ok);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.user?.username || '')).toBe(accounts.primary.username);
      }
    );

    test(
      'ACCESSSEC-P02: authenticated user can open own invoice page @security @regression @safe',
      async ({ authApi, cartApi, productsApi, ordersApi }) => {
        expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
          securityData.status.ok
        );
        const productId = await pickInStockProductId(productsApi);
        const orderId = await createApprovedOrder({ cartApi, ordersApi, productId });

        const invoiceResponse = await ordersApi.getInvoicePage(orderId);
        expect(invoiceResponse.status()).toBe(securityData.status.ok);
        expect(await invoiceResponse.text()).toContain(securityData.headers.responseMarkers.invoicePage);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'ACCESSSEC-N01: unauthenticated user cannot access me endpoint @security @regression @safe',
      async ({ authApi }) => {
        await authApi.logout();
        const response = await authApi.me();
        expect(response.status()).toBe(securityData.status.unauthorized);
      }
    );

    test(
      'ACCESSSEC-N02: unauthenticated user is redirected from protected html routes @security @regression @safe',
      async ({ authApi, request }) => {
        await authApi.logout();

        for (const route of securityData.routes.protectedHtmlGuards) {
          const response = await request.get(route, {
            headers: { Accept: securityData.headers.accept.html }
          });

          expect(response.status()).toBe(securityData.status.ok);
          expect(await response.text()).toContain(securityData.headers.responseMarkers.loginPage);
        }
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ACCESSSEC-E01: authenticated requests for non-owned resources return not-found style response @security @regression @safe',
      async ({ authApi, request }) => {
        expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
          securityData.status.ok
        );

        const invoiceResponse = await request.get(securityData.routes.unknownInvoice, {
          headers: { Accept: securityData.headers.accept.html }
        });
        expect(invoiceResponse.status()).toBe(securityData.status.notFound);
        expect(await invoiceResponse.text()).toContain(securityData.headers.responseMarkers.notFoundPage);

        const evidenceResponse = await request.get(securityData.routes.unknownClaimEvidence, {
          headers: { Accept: securityData.headers.accept.html }
        });
        expect(evidenceResponse.status()).toBe(securityData.status.notFound);
        expect(await evidenceResponse.text()).toContain(securityData.headers.responseMarkers.notFoundPage);
      }
    );
  });
});
