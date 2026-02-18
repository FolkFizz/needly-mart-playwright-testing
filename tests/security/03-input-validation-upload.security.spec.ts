import { buildInvoiceId } from '@helpers/factories';
import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

const pickInStockProductId = async (
  productsApi: { list: () => Promise<import('@playwright/test').APIResponse> }
) => {
  const response = await productsApi.list();
  expect(response.status()).toBe(200);

  const body = await response.json();
  const products: Array<{ id: number; stock: number }> = Array.isArray(body.products)
    ? body.products
    : [];
  const candidate = products.find((product) => Number(product.stock) > 0);

  if (!candidate) {
    throw new Error('No in-stock product found for validation tests');
  }

  return Number(candidate.id);
};

test.describe('INPUTVALIDATION :: Security Input Validation And Upload Hardening', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(runtime.user.username, runtime.user.password)).status()).toBe(200);
    expect((await cartApi.clear()).status()).toBe(200);
  });

  test.describe('positive cases', () => {
    test(
      'INPUTSEC-P01: claim endpoint accepts valid png evidence upload @security @regression @safe',
      async ({ request }) => {
        const response = await request.post('/claim', {
          maxRedirects: 0,
          headers: { Accept: 'text/html' },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: 'Valid image upload from security suite',
            image: {
              name: 'security-proof.png',
              mimeType: 'image/png',
              buffer: Buffer.from('89504E470D0A1A0A', 'hex')
            }
          }
        });

        expect(response.status()).toBe(302);
        expect(String(response.headers().location || '')).toContain('/profile?tab=claims');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'INPUTSEC-N01: cart add api rejects invalid product id format @security @regression @safe',
      async ({ request }) => {
        const response = await request.post('/api/cart/add', {
          data: { productId: 'not-a-number', quantity: 1 },
          headers: { Accept: 'application/json' }
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'INPUTSEC-N02: cart item patch rejects non-positive quantity @security @regression @safe',
      async ({ cartApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, 1)).status()).toBe(200);

        const response = await cartApi.updateItem(productId, 0);
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'INPUTSEC-E01: claim upload rejects non-image evidence payload @security @regression @safe',
      async ({ request }) => {
        const response = await request.post('/claim', {
          maxRedirects: 0,
          headers: { Accept: 'text/html' },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: 'Upload text file should fail',
            image: {
              name: 'invalid.txt',
              mimeType: 'text/plain',
              buffer: Buffer.from('not-an-image')
            }
          }
        });

        expect(response.status()).toBe(302);
        expect(String(response.headers().location || '')).toContain('/claim?error=');
      }
    );

    test(
      'INPUTSEC-E02: claim upload rejects files larger than 5mb @security @regression @safe',
      async ({ request }) => {
        const response = await request.post('/claim', {
          maxRedirects: 0,
          headers: { Accept: 'text/html' },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: 'Oversized upload should be blocked',
            image: {
              name: 'too-large.png',
              mimeType: 'image/png',
              buffer: Buffer.alloc(6 * 1024 * 1024, 1)
            }
          }
        });

        expect(response.status()).toBe(302);
        expect(String(response.headers().location || '')).toContain('/claim?error=');
      }
    );
  });
});
