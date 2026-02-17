import { test as base, expect } from '@playwright/test';
import { AuthApiClient } from '@api/clients/auth.client';
import { CartApiClient } from '@api/clients/cart.client';
import { DemoInboxApiClient } from '@api/clients/demo-inbox.client';
import { OrdersApiClient } from '@api/clients/orders.client';
import { ProductsApiClient } from '@api/clients/products.client';
import { A11yAudit } from '@helpers/a11y-audit';
import { AuthPage } from '@pages/auth.page';
import { CartPage } from '@pages/cart.page';
import { CatalogPage } from '@pages/catalog.page';
import { CheckoutPage } from '@pages/checkout.page';
import { OrderSuccessPage } from '@pages/order-success.page';
import { ProductPage } from '@pages/product.page';

type Fixtures = {
  authPage: AuthPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderSuccessPage: OrderSuccessPage;
  authApi: AuthApiClient;
  productsApi: ProductsApiClient;
  cartApi: CartApiClient;
  ordersApi: OrdersApiClient;
  demoInboxApi: DemoInboxApiClient;
  a11yAudit: A11yAudit;
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
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  orderSuccessPage: async ({ page }, use) => {
    await use(new OrderSuccessPage(page));
  },
  authApi: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },
  productsApi: async ({ request }, use) => {
    await use(new ProductsApiClient(request));
  },
  cartApi: async ({ request }, use) => {
    await use(new CartApiClient(request));
  },
  ordersApi: async ({ request }, use) => {
    await use(new OrdersApiClient(request));
  },
  demoInboxApi: async ({ request }, use) => {
    await use(new DemoInboxApiClient(request));
  },
  a11yAudit: async ({ page }, use) => {
    await use(new A11yAudit(page));
  }
});

export { expect };
