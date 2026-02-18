import { accounts } from '@data/accounts';
import { integrationData } from '@data/integration';
import { test, expect } from '@fixtures/test.base';
import { pickInStockProductId } from '@helpers/integration-flow';

test.describe('PLATFORMGUARDS :: Integration Platform Health And Guards', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
      integrationData.status.ok
    );
    expect((await cartApi.clear()).status()).toBe(integrationData.status.ok);
  });

  test.describe('positive cases', () => {
    test(
      'PLATFORMGUARDS-P01: health endpoints return structured payload after authenticated cart activity @integration @regression @safe',
      async ({ cartApi, healthApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, integrationData.order.quantity.single)).status()).toBe(
          integrationData.status.ok
        );

        const livenessResponse = await healthApi.liveness();
        expect(livenessResponse.status()).toBe(integrationData.status.ok);
        const livenessBody = await livenessResponse.json();
        expect(livenessBody.ok).toBe(true);
        expect(livenessBody.status).toBe('up');

        const dbResponse = await healthApi.readinessDb();
        expect([integrationData.status.ok, integrationData.status.internalServerError]).toContain(dbResponse.status());
        const dbBody = await dbResponse.json();
        expect(typeof dbBody.ok).toBe('boolean');
        expect(['up', 'down']).toContain(String(dbBody.db));
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'PLATFORMGUARDS-N01: protected html routes redirect to login when session is missing @integration @regression @safe',
      async ({ authApi, request }) => {
        expect((await authApi.logout()).status()).toBe(integrationData.status.ok);

        for (const route of integrationData.routes.protectedHtmlGuards) {
          const response = await request.get(route, {
            headers: { Accept: 'text/html' }
          });
          expect(response.status()).toBe(integrationData.status.ok);
          const html = await response.text();
          expect(html).toContain(integrationData.selectors.loginPage);
        }
      }
    );

    test(
      'PLATFORMGUARDS-N02: protected me endpoint returns 401 after logout @integration @regression @safe',
      async ({ authApi }) => {
        expect((await authApi.logout()).status()).toBe(integrationData.status.ok);
        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(integrationData.status.unauthorized);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORMGUARDS-E01: liveness endpoint remains responsive under repeated checks @integration @regression @safe',
      async ({ healthApi }) => {
        const startedAt = Date.now();
        for (let index = 0; index < integrationData.performance.healthChecksAttempts; index += 1) {
          const response = await healthApi.liveness();
          expect(response.status()).toBe(integrationData.status.ok);
        }
        const elapsedMs = Date.now() - startedAt;
        expect(elapsedMs).toBeLessThan(integrationData.performance.healthChecksMaxElapsedMs);
      }
    );
  });
});
