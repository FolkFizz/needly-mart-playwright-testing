import { test } from '@fixtures/test.base';
import { products } from '@data/products';

test.describe('CATALOG :: UI Browse And Search @e2e @catalog', () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.gotoCatalog();
  });

  test.describe('positive cases', () => {
    test(
      'CATALOG-P01: user can open product details from catalog search @smoke @e2e @safe',
      async ({ catalogPage, productPage }) => {
        await catalogPage.search(products.apple.name);
        await catalogPage.openProductDetails(products.apple.id);
        await productPage.assertTitleEquals(products.apple.name);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CATALOG-N01: no result search shows empty state @e2e @regression @safe',
      async ({ catalogPage }) => {
        await catalogPage.search('product-that-does-not-exist-qa-check');
        await catalogPage.assertEmptyStateVisible();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CATALOG-E01: reset filter restores product listing after empty result @e2e @regression @safe',
      async ({ catalogPage }) => {
        await catalogPage.search('no-such-product-for-reset-check');
        await catalogPage.assertEmptyStateVisible();
        await catalogPage.resetFilters();
        await catalogPage.assertProductCardVisible(products.apple.id);
      }
    );
  });
});
