import { runtime } from '@config/env';
import { products } from '@data/products';
import { test, expect } from '@fixtures/test.base';

test.describe('PLATFORMGUARDS :: Integration Platform Health And Guards', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'PLATFORMGUARDS-P01: health endpoints return structured payload after authenticated cart activity @integration @regression @safe',
      async ({ cartApi, healthApi }) => {
        expect((await cartApi.add(products.apple.id, 1)).status()).toBe(200);

        const livenessResponse = await healthApi.liveness();
        expect(livenessResponse.status()).toBe(200);
        const livenessBody = await livenessResponse.json();
        expect(livenessBody.ok).toBe(true);
        expect(livenessBody.status).toBe('up');

        const dbResponse = await healthApi.readinessDb();
        expect([200, 500]).toContain(dbResponse.status());
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
        expect((await authApi.logout()).status()).toBe(200);

        const routes = ['/profile?tab=info', '/order/checkout', '/inbox'];
        for (const route of routes) {
          const response = await request.get(route, {
            headers: { Accept: 'text/html' }
          });
          expect(response.status()).toBe(200);
          const html = await response.text();
          expect(html).toContain('data-testid="login-page"');
        }
      }
    );

    test(
      'PLATFORMGUARDS-N02: protected me endpoint returns 401 after logout @integration @regression @safe',
      async ({ authApi }) => {
        expect((await authApi.logout()).status()).toBe(200);
        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(401);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'PLATFORMGUARDS-E01: liveness endpoint remains responsive under repeated checks @integration @regression @safe',
      async ({ healthApi }) => {
        const startedAt = Date.now();
        for (let index = 0; index < 3; index += 1) {
          const response = await healthApi.liveness();
          expect(response.status()).toBe(200);
        }
        const elapsedMs = Date.now() - startedAt;
        expect(elapsedMs).toBeLessThan(4_000);
      }
    );
  });
});
