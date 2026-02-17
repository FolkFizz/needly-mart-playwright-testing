import { test as base, expect } from '@playwright/test';
import { AuthApiClient } from '@api/clients/auth.client';
import { CartApiClient } from '@api/clients/cart.client';
import { ProductsApiClient } from '@api/clients/products.client';
import { AuthPage } from '@pages/auth.page';
import { CartPage } from '@pages/cart.page';
import { CatalogPage } from '@pages/catalog.page';
import { ProductPage } from '@pages/product.page';

type Fixtures = {
  authPage: AuthPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  authApi: AuthApiClient;
  productsApi: ProductsApiClient;
  cartApi: CartApiClient;
};

export const test = base.extend<Fixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  authApi: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },
  productsApi: async ({ request }, use) => {
    await use(new ProductsApiClient(request));
  },
  cartApi: async ({ request }, use) => {
    await use(new CartApiClient(request));
  }
});

export { expect };
