import { test, expect } from '@fixtures/test.base';
import { products } from '@data/products';

test.describe('PRODUCT :: UI Product Detail', () => {
  test.beforeEach(async ({ cartPage }) => {
    await cartPage.gotoCart();
    await cartPage.clearCartIfNeeded();
  });

  test.describe('positive cases', () => {
    test(
      'PRODUCT-P01: user can add product to cart from detail page @e2e @regression @safe',
      async ({ productPage, cartPage }) => {
        await productPage.gotoProduct(products.apple.id);
        await productPage.assertTitleEquals(products.apple.name);
        await productPage.setQuantity(1);
        await productPage.addToCart();
        await cartPage.assertItemRowVisible(products.apple.id);
      }
    );

    test(
      'PRODUCT-P02: product detail shows current stock information @e2e @regression @safe',
      async ({ productPage }) => {
        await productPage.gotoProduct(products.apple.id);
        const stockText = await productPage.readStockText();
        expect(stockText).toContain('Stock:');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PRODUCT-N01: non-existing product id shows not-found page @e2e @regression @safe',
      async ({ productPage }) => {
        await productPage.gotoProductExpectNotFound(999_999);
        await productPage.assertNotFoundMessageContains('Product not found');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PRODUCT-E01: adding quantity exactly equal to available stock is allowed @e2e @regression @destructive',
      async ({ productPage, cartPage }) => {
        await productPage.gotoProduct(products.apple.id);
        const stockText = await productPage.readStockText();
        const stockMatch = stockText.match(/(\d+)/);
        expect(stockMatch).toBeTruthy();

        const stock = Number.parseInt(String(stockMatch?.[1] || '1'), 10);
        const boundedStock = Number.isFinite(stock) && stock > 0 ? stock : 1;
        await productPage.setQuantity(boundedStock);
        await productPage.addToCart();
        await cartPage.assertItemRowVisible(products.apple.id);
      }
    );

    test(
      'PRODUCT-E02: adding quantity above stock is blocked with cart error @e2e @regression @safe',
      async ({ productPage, cartPage }) => {
        await productPage.gotoProduct(products.apple.id);
        const stockText = await productPage.readStockText();
        const stockMatch = stockText.match(/(\d+)/);
        const stock = Number.parseInt(String(stockMatch?.[1] || '1'), 10);
        const overLimitQty = (Number.isFinite(stock) ? stock : 1) + 1;

        await productPage.setQuantity(overLimitQty);
        await productPage.addToCart();
        await cartPage.assertErrorContains('Stock limit reached');
      }
    );
  });
});
