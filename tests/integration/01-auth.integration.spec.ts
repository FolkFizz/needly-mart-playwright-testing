import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { extractFirstEmailId, extractResetToken } from '@helpers/demo-inbox';

const readLatestResetToken = async (request: import('@playwright/test').APIRequestContext) => {
  const inboxList = await request.get('/demo-inbox');
  expect(inboxList.status()).toBe(200);

  const emailId = extractFirstEmailId(await inboxList.text());
  expect(emailId).not.toBeNull();

  const emailDetail = await request.get(`/demo-inbox/${emailId}`);
  expect(emailDetail.status()).toBe(200);

  const resetToken = extractResetToken(await emailDetail.text());
  expect(resetToken).not.toBeNull();
  return String(resetToken);
};

test.describe('AUTH :: Integration (API + Demo Inbox + Reset Token) @integration @auth', () => {
  test.describe('positive cases', () => {
    test(
      'AUTH-P01: forgot-password issues reset token and allows password update @integration @regression @destructive',
      async ({ request, authApi }) => {
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);

        const resetToken = await readLatestResetToken(request);
        expect((await authApi.resetPassword(resetToken, runtime.user.newPassword)).status()).toBe(200);
        expect((await authApi.login(runtime.user.username, runtime.user.newPassword)).status()).toBe(200);

        // Cleanup: restore original password to keep the test deterministic.
        expect((await authApi.forgotPassword(runtime.user.email)).status()).toBe(200);
        const restoreToken = await readLatestResetToken(request);
        expect((await authApi.resetPassword(restoreToken, runtime.user.password)).status()).toBe(200);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTH-N01: reset-password rejects an invalid token @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword('invalid-token-value', runtime.user.newPassword);
        expect(response.status()).toBe(400);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTH-E01: forgot-password hides account existence for unknown email @integration @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword('unknown-user-does-not-exist@needlymart.com');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(String(body.message || '').toLowerCase()).toContain('if the email exists');
      }
    );
  });
});
