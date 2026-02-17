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
