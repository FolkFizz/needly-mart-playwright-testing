import { runtime } from '@config/env';
import { integrationData } from '@data/integration';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('TESTHOOKS :: Integration Test Hooks And Stock Reset', () => {
  test.describe('negative cases', () => {
    test(
      'TESTHOOKS-N01: reset endpoint is forbidden without api key @integration @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.reset();
        expect(response.status()).toBe(integrationData.status.forbidden);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );

    test(
      'TESTHOOKS-N02: set-stock endpoint is forbidden without required stock-reset key @integration @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.setStock(products.apple.id, integrationData.testHooks.defaultStock);
        expect(response.status()).toBe(integrationData.status.forbidden);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'TESTHOOKS-E01: set-stock with configured key returns validation or access-control response for unknown product @integration @regression @safe',
      async ({ testHooksApi }) => {
        test.skip(
          !runtime.testHooks.stockResetApiKey,
          'STOCK_RESET_API_KEY is not configured for this environment'
        );

        const response = await testHooksApi.setStock(
          integrationData.testHooks.invalidProductId,
          integrationData.order.quantity.single,
          runtime.testHooks.stockResetApiKey
        );
        expect([integrationData.status.notFound, integrationData.status.forbidden]).toContain(response.status());
      }
    );

    test(
      'TESTHOOKS-E02: reset-stock endpoint with stock-reset key returns explicit response for invalid stock payload @integration @regression @safe',
      async ({ testHooksApi }) => {
        test.skip(
          !runtime.testHooks.stockResetApiKey,
          'STOCK_RESET_API_KEY is not configured for this environment'
        );

        const response = await testHooksApi.resetStock(
          integrationData.testHooks.invalidStock,
          runtime.testHooks.stockResetApiKey
        );

        expect([integrationData.status.badRequest, integrationData.status.forbidden]).toContain(response.status());
      }
    );
  });

  test.describe('destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'TESTHOOKS-D01: reset and seed endpoints with configured key return explicit success or production-blocked response @integration @regression @destructive @serial',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured for this environment');

        const resetResponse = await testHooksApi.reset(runtime.testHooks.apiKey);
        expect([integrationData.status.ok, integrationData.status.forbidden]).toContain(resetResponse.status());

        const seedResponse = await testHooksApi.seed(runtime.testHooks.apiKey);
        expect([integrationData.status.ok, integrationData.status.forbidden]).toContain(seedResponse.status());
      }
    );

    test(
      'TESTHOOKS-D02: set-stock with configured stock-reset key updates product state or returns production-blocked response @integration @regression @destructive @serial',
      async ({ testHooksApi, productsApi }) => {
        test.skip(
          !runtime.testHooks.stockResetApiKey,
          'STOCK_RESET_API_KEY is not configured for this environment'
        );

        const targetStock = integrationData.testHooks.updatedStock;
        const response = await testHooksApi.setStock(
          products.apple.id,
          targetStock,
          runtime.testHooks.stockResetApiKey
        );
        expect([integrationData.status.ok, integrationData.status.forbidden]).toContain(response.status());

        const body = await response.json().catch(() => ({}));
        if (response.status() === integrationData.status.ok) {
          expect(body.ok).toBe(true);
          expect(Number(body.productId)).toBe(products.apple.id);
          expect(Number(body.stock)).toBe(targetStock);

          const productResponse = await productsApi.getById(products.apple.id);
          expect(productResponse.status()).toBe(integrationData.status.ok);

          const productBody = await productResponse.json().catch(() => ({}));
          expect(productBody.ok).toBe(true);
          expect(Number(productBody.product?.stock)).toBe(targetStock);
          return;
        }

        expect(String(body.message || '')).not.toBe('');
      }
    );

    test(
      'TESTHOOKS-D03: reset-stock with configured stock-reset key restores default stock or returns production-blocked response @integration @regression @destructive @serial',
      async ({ testHooksApi, productsApi }) => {
        test.skip(
          !runtime.testHooks.stockResetApiKey,
          'STOCK_RESET_API_KEY is not configured for this environment'
        );

        const response = await testHooksApi.resetStock(
          integrationData.testHooks.defaultStock,
          runtime.testHooks.stockResetApiKey
        );
        expect([integrationData.status.ok, integrationData.status.forbidden]).toContain(response.status());

        const body = await response.json().catch(() => ({}));
        if (response.status() === integrationData.status.ok) {
          expect(body.ok).toBe(true);
          expect(Number(body.stock)).toBe(integrationData.testHooks.defaultStock);
          expect(Number(body.updatedProducts || 0)).toBeGreaterThan(0);

          const productResponse = await productsApi.getById(products.apple.id);
          expect(productResponse.status()).toBe(integrationData.status.ok);

          const productBody = await productResponse.json().catch(() => ({}));
          expect(productBody.ok).toBe(true);
          expect(Number(productBody.product?.stock)).toBe(integrationData.testHooks.defaultStock);
          return;
        }

        expect(String(body.message || '')).not.toBe('');
      }
    );
  });
});


