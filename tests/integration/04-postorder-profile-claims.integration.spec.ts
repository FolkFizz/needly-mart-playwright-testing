import { runtime } from '@config/env';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';
import { buildInvoiceId } from '@helpers/factories';

const readOrderId = (body: unknown): string => {
  const orderId = String((body as { orderId?: string }).orderId || '');
  return orderId;
};

const readFirstClaimIdFromHtml = (html: string): number | null => {
  const match = html.match(/claim-card-(\d+)/);
  if (!match) return null;
  const claimId = Number.parseInt(match[1], 10);
  return Number.isFinite(claimId) ? claimId : null;
};

test.describe('POSTPROFILECLAIMS :: Integration Post-Order Profile Claims', () => {
  const createOrder = async (
    cartApi: { add: (id: number, qty?: number) => Promise<{ status: () => number }>; clear: () => Promise<{ status: () => number }> },
    ordersApi: {
      authorizeMockPayment: (input: { cardNumber: string; expMonth: string; expYear: string; cvv: string }) => Promise<{ status: () => number; json: () => Promise<{ token?: string }> }>;
      placeMockOrder: (input: { paymentToken: string; name: string; email: string; address: string }) => Promise<{ status: () => number; json: () => Promise<unknown> }>;
    }
  ) => {
    expect((await cartApi.clear()).status()).toBe(200);
    expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

    const authorizeResponse = await ordersApi.authorizeMockPayment(testCards.approved);
    expect(authorizeResponse.status()).toBe(200);
    const authorizeBody = await authorizeResponse.json();

    const placeOrderResponse = await ordersApi.placeMockOrder({
      paymentToken: String(authorizeBody.token || ''),
      ...checkoutForm.valid
    });
    expect(placeOrderResponse.status()).toBe(200);
    const orderBody = await placeOrderResponse.json();

    const orderId = readOrderId(orderBody);
    expect(orderId).toContain('ORD-');
    return orderId;
  };

  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'POSTPROFILECLAIMS-P01: newly created order appears in profile order history and invoice page @integration @regression @destructive',
      async ({ cartApi, ordersApi, request }) => {
        const orderId = await createOrder(cartApi, ordersApi);

        const profileOrdersResponse = await request.get('/profile?tab=orders', {
          headers: { Accept: 'text/html' }
        });
        expect(profileOrdersResponse.status()).toBe(200);

        const ordersHtml = await profileOrdersResponse.text();
        expect(ordersHtml).toContain(`order-card-${orderId}`);

        const invoiceResponse = await request.get(`/order/invoice/${orderId}`, {
          headers: { Accept: 'text/html' }
        });
        expect(invoiceResponse.status()).toBe(200);

        const invoiceHtml = await invoiceResponse.text();
        expect(invoiceHtml).toContain(orderId);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'POSTPROFILECLAIMS-N01: invoice route redirects unauthenticated request to login page @integration @regression @safe',
      async ({ cartApi, ordersApi, authApi, request }) => {
        const orderId = await createOrder(cartApi, ordersApi);
        expect((await authApi.logout()).status()).toBe(200);

        const response = await request.get(`/order/invoice/${orderId}`, {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="login-page"');
      }
    );

    test(
      'POSTPROFILECLAIMS-N02: claim submit rejects missing description @integration @regression @safe',
      async ({ request }) => {
        const response = await request.post('/claim', {
          form: {
            invoice_id: buildInvoiceId(),
            description: ''
          },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(302);

        const location = response.headers().location || '';
        expect(location).toContain('/claim?error=');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'POSTPROFILECLAIMS-E01: claim with image evidence can be trashed restored and served as binary evidence @integration @regression @destructive',
      async ({ request }) => {
        const createClaimResponse = await request.post('/claim', {
          multipart: {
            invoice_id: buildInvoiceId(),
            description: 'Integration claim with binary evidence lifecycle check.',
            image: {
              name: 'claim-proof.png',
              mimeType: 'image/png',
              buffer: Buffer.from('89504E470D0A1A0A', 'hex')
            }
          },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(createClaimResponse.status()).toBe(302);

        const claimsInboxResponse = await request.get('/profile?tab=claims', {
          headers: { Accept: 'text/html' }
        });
        expect(claimsInboxResponse.status()).toBe(200);
        const claimsInboxHtml = await claimsInboxResponse.text();

        const claimId = readFirstClaimIdFromHtml(claimsInboxHtml);
        expect(claimId).not.toBeNull();

        const evidenceResponse = await request.get(`/profile/claims/${claimId}/evidence`, {
          headers: { Accept: '*/*' }
        });
        expect(evidenceResponse.status()).toBe(200);
        expect(String(evidenceResponse.headers()['content-type'] || '')).toContain('image/png');

        const moveToTrashResponse = await request.post(`/profile/claims/${claimId}/delete`, {
          form: { claim_box: 'inbox' },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(moveToTrashResponse.status()).toBe(302);

        const trashResponse = await request.get('/profile?tab=claims&claim_box=trash', {
          headers: { Accept: 'text/html' }
        });
        const trashHtml = await trashResponse.text();
        expect(trashHtml).toContain(`claim-card-${claimId}`);

        const restoreResponse = await request.post(`/profile/claims/${claimId}/restore`, {
          form: { claim_box: 'trash' },
          maxRedirects: 0,
          headers: { Accept: 'text/html' }
        });
        expect(restoreResponse.status()).toBe(302);

        const backInboxResponse = await request.get('/profile?tab=claims', {
          headers: { Accept: 'text/html' }
        });
        const backInboxHtml = await backInboxResponse.text();
        expect(backInboxHtml).toContain(`claim-card-${claimId}`);
      }
    );
  });
});
