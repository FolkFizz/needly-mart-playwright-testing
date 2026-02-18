import { accounts } from '@data/accounts';
import { securityData } from '@data/security';
import { ROUTE } from '@config/routes';
import { buildInvoiceId } from '@helpers/factories';
import { pickInStockProductId } from '@helpers/integration-flow';
import { test, expect } from '@fixtures/test.base';

test.describe('INPUTVALIDATION :: Security Input Validation And Upload Hardening', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
      securityData.status.ok
    );
    expect((await cartApi.clear()).status()).toBe(securityData.status.ok);
  });

  test.describe('positive cases', () => {
    test(
      'INPUTSEC-P01: claim endpoint accepts valid png evidence upload @security @regression @safe',
      async ({ request }) => {
        const response = await request.post(securityData.routes.claim, {
          maxRedirects: securityData.numbers.zero,
          headers: { Accept: securityData.headers.accept.html },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: securityData.claims.validUploadDescription,
            image: securityData.claims.validUpload
          }
        });

        expect(response.status()).toBe(securityData.status.redirect);
        expect(String(response.headers().location || '')).toContain(ROUTE.profile('claims'));
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'INPUTSEC-N01: cart add api rejects invalid product id format @security @regression @safe',
      async ({ request }) => {
        const response = await request.post(securityData.routes.apiCartAdd, {
          data: { productId: securityData.invalid.productIdText, quantity: securityData.numbers.one },
          headers: { Accept: securityData.headers.accept.json }
        });
        expect(response.status()).toBe(securityData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'INPUTSEC-N02: cart item patch rejects non-positive quantity @security @regression @safe',
      async ({ cartApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, securityData.numbers.one)).status()).toBe(securityData.status.ok);

        const response = await cartApi.updateItem(productId, securityData.numbers.zero);
        expect(response.status()).toBe(securityData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'INPUTSEC-E01: claim upload rejects non-image evidence payload @security @regression @safe',
      async ({ request }) => {
        const response = await request.post(securityData.routes.claim, {
          maxRedirects: securityData.numbers.zero,
          headers: { Accept: securityData.headers.accept.html },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: securityData.claims.invalidUploadDescription,
            image: securityData.claims.invalidUpload
          }
        });

        expect(response.status()).toBe(securityData.status.redirect);
        expect(String(response.headers().location || '')).toContain(`${securityData.routes.claim}?error=`);
      }
    );

    test(
      'INPUTSEC-E02: claim upload rejects files larger than 5mb @security @regression @safe',
      async ({ request }) => {
        const response = await request.post(securityData.routes.claim, {
          maxRedirects: securityData.numbers.zero,
          headers: { Accept: securityData.headers.accept.html },
          multipart: {
            invoice_id: buildInvoiceId(),
            description: securityData.claims.oversizedUploadDescription,
            image: {
              name: securityData.claims.oversizedUpload.name,
              mimeType: securityData.claims.oversizedUpload.mimeType,
              buffer: Buffer.alloc(securityData.claims.oversizedUpload.sizeBytes, securityData.numbers.one)
            }
          }
        });

        expect(response.status()).toBe(securityData.status.redirect);
        expect(String(response.headers().location || '')).toContain(`${securityData.routes.claim}?error=`);
      }
    );
  });
});
