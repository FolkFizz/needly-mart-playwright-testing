import { ROUTE } from '@config/routes';
import { accounts } from '@data/accounts';
import { integrationData } from '@data/integration';
import { test, expect } from '@fixtures/test.base';
import { buildInvoiceId } from '@helpers/factories';
import { createApprovedOrder, pickInStockProductId, readFirstClaimIdFromHtml } from '@helpers/integration-flow';

test.describe('POSTPROFILECLAIMS :: Integration Post-Order Profile Claims', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
      integrationData.status.ok
    );
    expect((await cartApi.clear()).status()).toBe(integrationData.status.ok);
  });

  test.describe('negative cases', () => {
    test(
      'POSTPROFILECLAIMS-N01: invoice route redirects unauthenticated request to login page @integration @regression @safe',
      async ({ cartApi, ordersApi, authApi, productsApi, request }) => {
        const productId = await pickInStockProductId(productsApi);
        const orderId = await createApprovedOrder({ cartApi, ordersApi, productId });
        expect((await authApi.logout()).status()).toBe(integrationData.status.ok);

        const response = await request.get(ROUTE.invoice(orderId), {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(integrationData.status.ok);

        const html = await response.text();
        expect(html).toContain(integrationData.selectors.loginPage);
      }
    );

    test(
      'POSTPROFILECLAIMS-N02: claim submit rejects missing description @integration @regression @safe',
      async ({ request }) => {
        const response = await request.post(ROUTE.claim, {
          form: {
            invoice_id: buildInvoiceId(),
            description: ''
          },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(integrationData.status.redirect);

        const location = response.headers().location || '';
        expect(location).toContain(`${ROUTE.claim}?error=`);
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'POSTPROFILECLAIMS-P01: newly created order appears in profile order history and invoice page @integration @regression @destructive',
      async ({ cartApi, ordersApi, productsApi, request }) => {
        const productId = await pickInStockProductId(productsApi);
        const orderId = await createApprovedOrder({ cartApi, ordersApi, productId });

        const profileOrdersResponse = await request.get(integrationData.routes.profileOrders, {
          headers: { Accept: 'text/html' }
        });
        expect(profileOrdersResponse.status()).toBe(integrationData.status.ok);

        const ordersHtml = await profileOrdersResponse.text();
        expect(ordersHtml).toContain(`order-card-${orderId}`);

        const invoiceResponse = await request.get(ROUTE.invoice(orderId), {
          headers: { Accept: 'text/html' }
        });
        expect(invoiceResponse.status()).toBe(integrationData.status.ok);

        const invoiceHtml = await invoiceResponse.text();
        expect(invoiceHtml).toContain(orderId);
      }
    );

    test(
      'POSTPROFILECLAIMS-E01: claim with image evidence can be trashed restored and served as binary evidence @integration @regression @destructive',
      async ({ request }) => {
        const createClaimResponse = await request.post(ROUTE.claim, {
          multipart: {
            invoice_id: buildInvoiceId(),
            description: integrationData.claims.validDescription,
            image: integrationData.claims.evidenceImage
          },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(createClaimResponse.status()).toBe(integrationData.status.redirect);

        const claimsInboxResponse = await request.get(integrationData.routes.profileClaims, {
          headers: { Accept: 'text/html' }
        });
        expect(claimsInboxResponse.status()).toBe(integrationData.status.ok);
        const claimsInboxHtml = await claimsInboxResponse.text();

        const claimId = readFirstClaimIdFromHtml(claimsInboxHtml);
        expect(claimId).not.toBeNull();

        const evidenceResponse = await request.get(ROUTE.claimEvidence(Number(claimId)), {
          headers: { Accept: '*/*' }
        });
        expect(evidenceResponse.status()).toBe(integrationData.status.ok);
        expect(String(evidenceResponse.headers()['content-type'] || '')).toContain(
          integrationData.claims.evidenceImage.mimeType
        );

        const moveToTrashResponse = await request.post(ROUTE.claimDelete(Number(claimId)), {
          form: { claim_box: integrationData.claims.formBox.inbox },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(moveToTrashResponse.status()).toBe(integrationData.status.redirect);

        const trashResponse = await request.get(integrationData.routes.profileClaimsTrash, {
          headers: { Accept: 'text/html' }
        });
        const trashHtml = await trashResponse.text();
        expect(trashHtml).toContain(`claim-card-${claimId}`);

        const restoreResponse = await request.post(ROUTE.claimRestore(Number(claimId)), {
          form: { claim_box: integrationData.claims.formBox.trash },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(restoreResponse.status()).toBe(integrationData.status.redirect);

        const backInboxResponse = await request.get(integrationData.routes.profileClaims, {
          headers: { Accept: 'text/html' }
        });
        const backInboxHtml = await backInboxResponse.text();
        expect(backInboxHtml).toContain(`claim-card-${claimId}`);
      }
    );
  });
});
