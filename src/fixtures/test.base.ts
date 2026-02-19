import { APIRequestContext, test as base, expect } from '@playwright/test';
import { AuthApiClient } from '@api/clients/auth.client';
import { CartApiClient } from '@api/clients/cart.client';
import { DemoInboxApiClient } from '@api/clients/demo-inbox.client';
import { HealthApiClient } from '@api/clients/health.client';
import { OrdersApiClient } from '@api/clients/orders.client';
import { ProductsApiClient } from '@api/clients/products.client';
import { TestHooksApiClient } from '@api/clients/test-hooks.client';
import { runtime } from '@config/env';
import { A11yAudit } from '@helpers/a11y-audit';
import { AuthPage } from '@pages/auth.page';
import { CartPage } from '@pages/cart.page';
import { CatalogPage } from '@pages/catalog.page';
import { ClaimPage } from '@pages/claim.page';
import { CheckoutPage } from '@pages/checkout.page';
import { InboxPage } from '@pages/inbox.page';
import { InvoicePage } from '@pages/invoice.page';
import { OrderSuccessPage } from '@pages/order-success.page';
import { ProfilePage } from '@pages/profile.page';
import { ProductPage } from '@pages/product.page';

type TestFixtures = {
  authPage: AuthPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderSuccessPage: OrderSuccessPage;
  profilePage: ProfilePage;
  claimPage: ClaimPage;
  inboxPage: InboxPage;
  invoicePage: InvoicePage;
  authApi: AuthApiClient;
  productsApi: ProductsApiClient;
  cartApi: CartApiClient;
  ordersApi: OrdersApiClient;
  demoInboxApi: DemoInboxApiClient;
  healthApi: HealthApiClient;
  testHooksApi: TestHooksApiClient;
  a11yAudit: A11yAudit;
};

type WorkerFixtures = {
  _serviceReady: void;
  _workerUserReady: void;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const containsAlreadyExistsMessage = (raw: unknown): boolean =>
  String(raw ?? '')
    .toLowerCase()
    .includes('already');

const parseMessage = (body: unknown): string => {
  if (!body || typeof body !== 'object') return '';
  const value = (body as Record<string, unknown>).message ?? (body as Record<string, unknown>).error;
  return String(value ?? '');
};
const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error ?? 'unknown error');
};

type ReadinessSnapshot = {
  healthStatus: number | 'error';
  healthReady: boolean;
  healthError: string;
  dbStatus: number | 'error';
  dbReady: boolean;
  dbState: string;
  dbError: string;
};

const parseJsonBody = async (response: import('@playwright/test').APIResponse) =>
  response.json().catch(() => ({} as Record<string, unknown>));

const waitForServiceReadiness = async (request: APIRequestContext): Promise<void> => {
  const maxAttempts = 12;
  const retryDelayMs = 5_000;
  const requestTimeoutMs = 10_000;
  let last: ReadinessSnapshot | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let healthStatus: number | 'error' = 'error';
    let healthReady = false;
    let healthError = '';

    try {
      const healthResponse = await request.get('/health', {
        headers: { Accept: 'application/json' },
        timeout: requestTimeoutMs
      });
      healthStatus = healthResponse.status();
      const healthBody = await parseJsonBody(healthResponse);
      healthReady =
        healthResponse.ok() &&
        (healthBody.ok === true || String(healthBody.status || '').trim().toLowerCase() === 'up');
    } catch (error) {
      healthError = toErrorMessage(error);
    }

    let dbStatus: number | 'error' = 'error';
    let dbReady = false;
    let dbState = '';
    let dbError = '';

    try {
      const dbResponse = await request.get('/health/db', {
        headers: { Accept: 'application/json' },
        timeout: requestTimeoutMs
      });
      dbStatus = dbResponse.status();
      const dbBody = await parseJsonBody(dbResponse);
      dbState = String(dbBody.db || '').trim().toLowerCase();
      dbReady = dbResponse.status() === 200 && dbBody.ok === true && dbState === 'up';
    } catch (error) {
      dbError = toErrorMessage(error);
    }

    last = {
      healthStatus,
      healthReady,
      healthError,
      dbStatus,
      dbReady,
      dbState,
      dbError
    };

    if (healthReady && dbReady) return;

    if (attempt < maxAttempts) {
      await delay(retryDelayMs);
    }
  }

  throw new Error(
    `[readiness] Service not ready after ${maxAttempts} attempts. ` +
      `health(status=${last?.healthStatus ?? 'n/a'}, ready=${last?.healthReady ?? false}, error="${last?.healthError || '-'}"), ` +
      `db(status=${last?.dbStatus ?? 'n/a'}, ready=${last?.dbReady ?? false}, state="${last?.dbState || '-'}", error="${last?.dbError || '-'}").`
  );
};

const ensureWorkerUser = async (request: import('@playwright/test').APIRequestContext): Promise<void> => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const registerResponse = await request.post('/api/auth/register', {
        data: {
          username: runtime.user.username,
          email: runtime.user.email,
          password: runtime.user.password,
          confirmPassword: runtime.user.password
        },
        headers: { Accept: 'application/json' },
        timeout: 15_000
      });

      if (registerResponse.status() === 201) return;

      const registerBody = await registerResponse.json().catch(() => ({}));
      if (
        [400, 409].includes(registerResponse.status()) &&
        containsAlreadyExistsMessage(parseMessage(registerBody))
      ) {
        const loginResponse = await request.post('/api/auth/login', {
          data: {
            username: runtime.user.username,
            password: runtime.user.password
          },
          headers: { Accept: 'application/json' },
          timeout: 15_000
        });

        if (loginResponse.status() === 200) {
          await request.post('/api/auth/logout', { headers: { Accept: 'application/json' } }).catch(() => undefined);
          return;
        }
      }

      if (attempt === maxAttempts) {
        throw new Error(
          `Failed to provision worker test user (${runtime.user.username}). Register status: ${registerResponse.status()}`
        );
      }
    } catch (error) {
      if (attempt === maxAttempts) throw error;
    }

    await delay(1_000 * attempt);
  }
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  _serviceReady: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext({ baseURL: runtime.baseUrl });
      try {
        await waitForServiceReadiness(request);
        await use();
      } finally {
        await request.dispose();
      }
    },
    { scope: 'worker', auto: true, timeout: 120_000 }
  ],
  _workerUserReady: [
    async ({ _serviceReady, playwright }, use) => {
      void _serviceReady;

      if (!runtime.identity.autoProvisionUser) {
        await use();
        return;
      }

      const request = await playwright.request.newContext({ baseURL: runtime.baseUrl });
      try {
        await ensureWorkerUser(request);
        await use();
      } finally {
        await request.dispose();
      }
    },
    { scope: 'worker', auto: true, timeout: 120_000 }
  ],
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
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  claimPage: async ({ page }, use) => {
    await use(new ClaimPage(page));
  },
  inboxPage: async ({ page }, use) => {
    await use(new InboxPage(page));
  },
  invoicePage: async ({ page }, use) => {
    await use(new InvoicePage(page));
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
  healthApi: async ({ request }, use) => {
    await use(new HealthApiClient(request));
  },
  testHooksApi: async ({ request }, use) => {
    await use(new TestHooksApiClient(request));
  },
  a11yAudit: async ({ page }, use) => {
    await use(new A11yAudit(page));
  }
});

export { expect };
