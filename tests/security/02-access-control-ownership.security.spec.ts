import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

const pickInStockProductId = async (
  productsApi: { list: () => Promise<import('@playwright/test').APIResponse> }
) => {
  const response = await productsApi.list();
  expect(response.status()).toBe(200);

  const body = await response.json();
  const products: Array<{ id: number; stock: number }> = Array.isArray(body.products)
    ? body.products
    : [];
  const candidate = products.find((product) => Number(product.stock) > 0);

  if (!candidate) {
    throw new Error('No in-stock product found for security order flow');
  }

  return Number(candidate.id);
};

const createOrderForInvoice = async ({
  cartApi,
  productsApi,
  ordersApi
}: {
  cartApi: {
    clear: () => Promise<import('@playwright/test').APIResponse>;
    add: (productId: number, quantity?: number) => Promise<import('@playwright/test').APIResponse>;
  };
  productsApi: { list: () => Promise<import('@playwright/test').APIResponse> };
  ordersApi: {
    authorizeMockPayment: (input: {
      cardNumber: string;
      expMonth: string;
      expYear: string;
      cvv: string;
    }) => Promise<import('@playwright/test').APIResponse>;
    placeMockOrder: (input: {
      paymentToken: string;
      name: string;
      email: string;
      address: string;
    }) => Promise<import('@playwright/test').APIResponse>;
  };
}) => {
  expect((await cartApi.clear()).status()).toBe(200);

  const productId = await pickInStockProductId(productsApi);
  expect((await cartApi.add(productId, 1)).status()).toBe(200);

  const authorizeResponse = await ordersApi.authorizeMockPayment({
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: '35',
    cvv: '123'
  });
  expect(authorizeResponse.status()).toBe(200);
  const authorizeBody = await authorizeResponse.json();
  expect(authorizeBody.ok).toBe(true);
  expect(String(authorizeBody.token || '')).not.toBe('');

  const placeResponse = await ordersApi.placeMockOrder({
    paymentToken: String(authorizeBody.token),
    name: runtime.user.username,
    email: runtime.user.email,
    address: 'QA Security Street'
  });
  expect(placeResponse.status()).toBe(200);

  const placeBody = await placeResponse.json();
  expect(placeBody.ok).toBe(true);
  expect(String(placeBody.orderId || '')).toContain('ORD-');
  return String(placeBody.orderId);
};

test.describe('ACCESSCONTROL :: Security Access Control And Ownership', () => {
  test.describe('positive cases', () => {
    test(
      'ACCESSSEC-P01: authenticated user can access me endpoint @smoke @security @safe',
      async ({ authApi }) => {
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);

        const response = await authApi.me();
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.user?.username || '')).toBe(runtime.user.username);
      }
    );

    test(
      'ACCESSSEC-P02: authenticated user can open own invoice page @security @regression @safe',
      async ({ authApi, cartApi, productsApi, ordersApi }) => {
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
        const orderId = await createOrderForInvoice({ cartApi, productsApi, ordersApi });

        const invoiceResponse = await ordersApi.getInvoicePage(orderId);
        expect(invoiceResponse.status()).toBe(200);
        expect(await invoiceResponse.text()).toContain('data-testid="invoice-page"');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'ACCESSSEC-N01: unauthenticated user cannot access me endpoint @security @regression @safe',
      async ({ authApi }) => {
        await authApi.logout();
        const response = await authApi.me();
        expect(response.status()).toBe(401);
      }
    );

    test(
      'ACCESSSEC-N02: unauthenticated user is redirected from protected html routes @security @regression @safe',
      async ({ authApi, request }) => {
        await authApi.logout();

        const protectedRoutes = ['/profile?tab=info', '/order/checkout', '/inbox', '/claim'];
        for (const route of protectedRoutes) {
          const response = await request.get(route, {
            headers: { Accept: 'text/html' }
          });

          expect(response.status()).toBe(200);
          expect(await response.text()).toContain('data-testid="login-page"');
        }
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ACCESSSEC-E01: authenticated requests for non-owned resources return not-found style response @security @regression @safe',
      async ({ authApi, request }) => {
        expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);

        const invoiceResponse = await request.get('/order/invoice/ORD-9999999999999-999', {
          headers: { Accept: 'text/html' }
        });
        expect(invoiceResponse.status()).toBe(404);
        expect(await invoiceResponse.text()).toContain('data-testid="not-found-page"');

        const evidenceResponse = await request.get('/profile/claims/99999999/evidence', {
          headers: { Accept: 'text/html' }
        });
        expect(evidenceResponse.status()).toBe(404);
        expect(await evidenceResponse.text()).toContain('data-testid="not-found-page"');
      }
    );
  });
});
