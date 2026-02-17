import { test, expect } from '@fixtures/test.base';
import { products } from '@data/products';

test.describe('CATALOG :: API Product Discovery @api @catalog', () => {
  test.describe('positive cases', () => {
    test(
      'CATALOG-P01: list products by valid category returns results @smoke @api @safe',
      async ({ productsApi }) => {
        const response = await productsApi.list({ category: products.apple.category });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.length).toBeGreaterThan(0);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CATALOG-N01: product detail with non-existing id returns not found @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(999_999);
        expect(response.status()).toBe(404);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CATALOG-E01: search query with extra spaces is handled correctly @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.list({ q: `  ${products.apple.name}  ` });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.some((item: { name: string }) => item.name === products.apple.name)).toBeTruthy();
      }
    );
  });
});
