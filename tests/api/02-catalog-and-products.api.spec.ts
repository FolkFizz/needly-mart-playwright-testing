import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('CATALOGAPI :: API Catalog And Product Discovery', () => {
  test.describe('positive cases', () => {
    test(
      'CATALOGAPI-P01: list products by valid category returns matching results @smoke @api @safe',
      async ({ productsApi }) => {
        const response = await productsApi.list({ category: products.apple.category });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.length).toBeGreaterThan(0);
      }
    );

    test(
      'CATALOGAPI-P02: product detail by id returns expected payload fields @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getById(products.apple.id);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(body.product.id).toBe(products.apple.id);
        expect(body.product.name).toBe(products.apple.name);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CATALOGAPI-N01: product detail with non-numeric id is rejected @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.getByRawId('abc');
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'CATALOGAPI-N02: product detail with unknown id returns not found @api @regression @safe',
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
      'CATALOGAPI-E01: search query with extra spaces still returns known product @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.list({ q: `  ${products.apple.name}  ` });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.some((item: { name: string }) => item.name === products.apple.name)).toBeTruthy();
      }
    );

    test(
      'CATALOGAPI-E02: unknown category returns empty list with successful response @api @regression @safe',
      async ({ productsApi }) => {
        const response = await productsApi.list({ category: 'qa-no-such-category' });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.length).toBe(0);
      }
    );
  });
});
