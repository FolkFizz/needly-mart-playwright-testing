import { test, expect } from '@fixtures/test.base';
import { products } from '@data/products';

test.describe('PRODUCT :: API Product Detail', () => {
  test.describe('positive cases', () => {
    test(
      'PRODUCT-P01: api product detail returns valid payload for existing id @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(products.apple.id);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.product.id).toBe(products.apple.id);
        expect(body.product.name).toBe(products.apple.name);
      }
    );

    test(
      'PRODUCT-P02: api product detail works for another valid product id @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(products.bambooSpatula.id);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.product.id).toBe(products.bambooSpatula.id);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PRODUCT-N01: api product detail rejects non-numeric id @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getByRawId('abc');
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'PRODUCT-N02: api product detail with very large id returns not found @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(2_147_483_000);
        expect(response.status()).toBe(404);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PRODUCT-E01: api product detail with id zero returns not found @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(0);
        expect(response.status()).toBe(404);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });
});
