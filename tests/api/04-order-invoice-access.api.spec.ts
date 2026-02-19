import { runtime } from '@config/env';
import { checkoutForm, testCards } from '@data/checkout';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('ORDERACCESS :: API Order And Invoice Access', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('negative cases', () => {
    test(
      'ORDERACCESS-N01: unauthenticated invoice request is redirected to login page @api @regression @safe',
      async ({ authApi, request }) => {
        expect((await authApi.logout()).status()).toBe(200);

        const response = await request.get('/order/invoice/ORD-1700000000000-1', {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="login-page"');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ORDERACCESS-E01: invoice request with tampered order id returns not found @api @regression @safe',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const authzResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authzResponse.status()).toBe(200);
        const authzBody = await authzResponse.json();

        const orderResponse = await ordersApi.placeMockOrder({
          paymentToken: String(authzBody.token),
          ...checkoutForm.valid
        });
        expect(orderResponse.status()).toBe(200);

        const orderBody = await orderResponse.json();
        const orderId = String(orderBody.orderId || '');

        const response = await ordersApi.getInvoicePage(`${orderId}-tampered`);
        expect(response.status()).toBe(404);

        const html = await response.text();
        expect(html).toContain('Invoice not found');
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'ORDERACCESS-P01: owner can access invoice page of newly created order @api @regression @destructive',
      async ({ cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const authzResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authzResponse.status()).toBe(200);
        const authzBody = await authzResponse.json();

        const orderResponse = await ordersApi.placeMockOrder({
          paymentToken: String(authzBody.token),
          ...checkoutForm.valid
        });
        expect(orderResponse.status()).toBe(200);

        const orderBody = await orderResponse.json();
        const orderId = String(orderBody.orderId || '');
        expect(orderId.trim()).not.toBe('');

        const invoiceResponse = await ordersApi.getInvoicePage(orderId);
        expect(invoiceResponse.status()).toBe(200);

        const html = await invoiceResponse.text();
        expect(html).toContain(orderId);
      }
    );

    test(
      'ORDERACCESS-N02: different authenticated user cannot access another users invoice @api @regression @destructive',
      async ({ authApi, cartApi, ordersApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const authzResponse = await ordersApi.authorizeMockPayment(testCards.approved);
        expect(authzResponse.status()).toBe(200);
        const authzBody = await authzResponse.json();

        const orderResponse = await ordersApi.placeMockOrder({
          paymentToken: String(authzBody.token),
          ...checkoutForm.valid
        });
        expect(orderResponse.status()).toBe(200);

        const orderBody = await orderResponse.json();
        const ownerOrderId = String(orderBody.orderId || '');
        expect(ownerOrderId.trim()).not.toBe('');

        expect((await authApi.logout()).status()).toBe(200);

        const account = buildUniqueAccount('api_invoice_guard');
        expect((await authApi.register(account.username, account.email, account.password)).status()).toBe(201);
        expect((await authApi.login(account.username, account.password)).status()).toBe(200);

        const forbiddenResponse = await ordersApi.getInvoicePage(ownerOrderId);
        expect(forbiddenResponse.status()).toBe(403);

        const html = await forbiddenResponse.text();
        expect(html).toContain('do not have access');
      }
    );
  });
});
