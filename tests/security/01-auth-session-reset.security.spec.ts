import { accounts } from '@data/accounts';
import { securityData } from '@data/security';
import { runtime } from '@config/env';
import { buildUnknownEmail } from '@helpers/security-flow';
import { test, expect } from '@fixtures/test.base';

test.describe('AUTHSESSIONRESET :: Security Auth Session And Password Reset', () => {
  test.describe('positive cases', () => {
    test(
      'AUTHSEC-P01: valid login creates session and allows me endpoint @smoke @security @safe',
      async ({ authApi }) => {
        const loginResponse = await authApi.login(accounts.primary.username, accounts.primary.password);
        expect(loginResponse.status()).toBe(securityData.status.ok);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(securityData.status.ok);

        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(String(meBody.user?.username || '')).toBe(accounts.primary.username);
      }
    );

    test(
      'AUTHSEC-P02: forgot password returns generic success for existing email @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword(accounts.primary.email);
        expect(response.status()).toBe(securityData.status.ok);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.message || '')).toContain(securityData.messages.ifEmailExists);
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHSEC-N01: login rejects invalid credentials with 401 and generic message @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.primary.username, accounts.invalid.password);
        expect(response.status()).toBe(securityData.status.unauthorized);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain(securityData.messages.invalidCredentials);
      }
    );

    test(
      'AUTHSEC-N02: reset password api rejects invalid token @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword(securityData.auth.invalidResetToken, accounts.primary.newPassword);
        expect(response.status()).toBe(securityData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain(securityData.messages.invalidOrExpiredToken);
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHSEC-E01: forgot password response remains identical for existing and unknown email @security @regression @safe',
      async ({ authApi }) => {
        const existingResponse = await authApi.forgotPassword(accounts.primary.email);
        const unknownResponse = await authApi.forgotPassword(buildUnknownEmail());
        expect(existingResponse.status()).toBe(securityData.status.ok);
        expect(unknownResponse.status()).toBe(securityData.status.ok);

        const existingBody = await existingResponse.json();
        const unknownBody = await unknownResponse.json();
        expect(String(existingBody.message || '')).toBe(String(unknownBody.message || ''));
      }
    );

    test(
      'AUTHSEC-E02: session cookie carries secure flags after login @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(accounts.primary.username, accounts.primary.password);
        expect(response.status()).toBe(securityData.status.ok);

        const setCookie = String(response.headers()['set-cookie'] || '');
        expect(setCookie).toContain(securityData.headers.setCookie.httpOnly);
        expect(setCookie).toContain(securityData.headers.setCookie.sameSiteLax);

        if (runtime.baseUrl.startsWith('https://')) {
          expect(setCookie).toContain(securityData.headers.setCookie.secure);
        }
      }
    );
  });
});
