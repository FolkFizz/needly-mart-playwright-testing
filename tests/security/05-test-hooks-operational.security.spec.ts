import { accounts } from '@data/accounts';
import { securityData } from '@data/security';
import { runtime } from '@config/env';
import { extractFirstEmailId } from '@helpers/demo-inbox';
import { test, expect } from '@fixtures/test.base';

test.describe('TESTHOOKSOPS :: Security Test Hooks And Operational Surfaces', () => {
  test.describe('positive cases', () => {
    test(
      'OPERSEC-P01: demo inbox list is publicly reachable without authentication @security @regression @safe',
      async ({ demoInboxApi }) => {
        const response = await demoInboxApi.list();
        expect(response.status()).toBe(securityData.status.ok);
        expect(await response.text()).toContain(securityData.headers.responseMarkers.inboxPage);
      }
    );

    test(
      'OPERSEC-P02: reset email detail can be opened from public demo inbox @security @regression @safe',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(securityData.status.ok);

        const listResponse = await demoInboxApi.list();
        const emailId = extractFirstEmailId(await listResponse.text());
        expect(emailId).not.toBeNull();

        const detailResponse = await demoInboxApi.detail(Number(emailId));
        expect(detailResponse.status()).toBe(securityData.status.ok);
        expect(await detailResponse.text()).toContain(securityData.headers.responseMarkers.resetPasswordPath);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'OPERSEC-N01: reset test-hook endpoint is blocked without api key @security @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.reset();
        expect(response.status()).toBe(securityData.status.forbidden);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );

    test(
      'OPERSEC-N02: stock reset endpoint is blocked without required header @security @regression @safe',
      async ({ testHooksApi }) => {
        const response = await testHooksApi.resetStock(securityData.testHooks.resetStockDefault);
        expect(response.status()).toBe(securityData.status.forbidden);

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || '')).not.toBe('');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'OPERSEC-E02: reset endpoint with configured key returns explicit and controlled result @security @regression @safe',
      async ({ testHooksApi }) => {
        test.skip(!runtime.testHooks.apiKey, 'TEST_API_KEY is not configured in this environment');

        const response = await testHooksApi.reset(runtime.testHooks.apiKey);
        expect([securityData.status.ok, securityData.status.forbidden]).toContain(response.status());

        const body = await response.json().catch(() => ({}));
        expect(String(body.message || body.ok || '')).not.toBe('');
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'OPERSEC-E01: demo inbox allows public trash mutation without login @security @regression @destructive',
      async ({ authApi, demoInboxApi }) => {
        expect((await authApi.forgotPassword(accounts.primary.email)).status()).toBe(securityData.status.ok);

        const listResponse = await demoInboxApi.list();
        const emailId = extractFirstEmailId(await listResponse.text());
        expect(emailId).not.toBeNull();

        const moveResponse = await demoInboxApi.moveToTrash(Number(emailId), securityData.demoInbox.formBox.inbox);
        expect([securityData.status.ok, securityData.status.redirect]).toContain(moveResponse.status());

        const trashResponse = await demoInboxApi.list(securityData.demoInbox.formBox.trash);
        expect(await trashResponse.text()).toContain(`inbox-email-item-${emailId}`);
      }
    );
  });
});
