import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { extractFirstEmailId } from '@helpers/demo-inbox';

test.describe('DEMO-INBOX :: Security Exposure Baseline', () => {
  test.describe('positive cases', () => {
    test(
      'DEMOINBOX-P01: demo inbox endpoint is publicly reachable without authentication @security @regression @safe',
      async ({ demoInboxApi }) => {
        const response = await demoInboxApi.list();
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="inbox-page"');
      }
    );

    test(
      'DEMOINBOX-P02: demo inbox detail publicly exposes reset email content @security @regression @safe',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);

        const listResponse = await demoInboxApi.list();
        const emailId = extractFirstEmailId(await listResponse.text());
        expect(emailId).not.toBeNull();

        const detailResponse = await demoInboxApi.detail(Number(emailId));
        expect(detailResponse.status()).toBe(200);
        expect(await detailResponse.text()).toContain('/reset-password/');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'DEMOINBOX-N01: private inbox endpoint does not expose data without login @security @regression @safe',
      async ({ request }) => {
        const response = await request.get('/inbox', {
          headers: { Accept: 'text/html' }
        });
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="login-page"');
      }
    );

    test(
      'DEMOINBOX-N02: private inbox mutation endpoint is blocked without authentication @security @regression @safe',
      async ({ request }) => {
        const response = await request.post('/inbox/trash/empty', {
          headers: { Accept: 'application/json' }
        });
        expect(response.status()).toBe(401);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'DEMOINBOX-E01: public trash action can mutate demo inbox state without auth @security @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);

        const listResponse = await demoInboxApi.list();
        const listHtml = await listResponse.text();
        const emailId = extractFirstEmailId(listHtml);
        expect(emailId).not.toBeNull();

        const mutateResponse = await demoInboxApi.moveToTrash(Number(emailId), 'inbox');
        expect([200, 302]).toContain(mutateResponse.status());

        const trashResponse = await demoInboxApi.list('trash');
        const trashHtml = await trashResponse.text();
        expect(trashHtml).toContain(`inbox-email-item-${emailId}`);
      }
    );
  });
});
