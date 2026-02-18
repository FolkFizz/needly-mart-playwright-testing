import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

const buildUnknownEmail = () => `unknown_${Date.now()}_${Math.floor(Math.random() * 10_000)}@needlymart.com`;

test.describe('AUTHSESSIONRESET :: Security Auth Session And Password Reset', () => {
  test.describe('positive cases', () => {
    test(
      'AUTHSEC-P01: valid login creates session and allows me endpoint @smoke @security @safe',
      async ({ authApi }) => {
        const loginResponse = await authApi.login(runtime.user.username, runtime.user.password);
        expect(loginResponse.status()).toBe(200);

        const meResponse = await authApi.me();
        expect(meResponse.status()).toBe(200);

        const meBody = await meResponse.json();
        expect(meBody.ok).toBe(true);
        expect(String(meBody.user?.username || '')).toBe(runtime.user.username);
      }
    );

    test(
      'AUTHSEC-P02: forgot password returns generic success for existing email @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.forgotPassword(runtime.user.email);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.ok).toBe(true);
        expect(String(body.message || '')).toContain('If the email exists');
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'AUTHSEC-N01: login rejects invalid credentials with 401 and generic message @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(runtime.user.username, 'wrong_password_123');
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain('Invalid username or password');
      }
    );

    test(
      'AUTHSEC-N02: reset password api rejects invalid token @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.resetPassword('invalid_reset_token', 'NewPass123!');
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(String(body.message || '')).toContain('invalid or expired');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'AUTHSEC-E01: forgot password response remains identical for existing and unknown email @security @regression @safe',
      async ({ authApi }) => {
        const existingResponse = await authApi.forgotPassword(runtime.user.email);
        const unknownResponse = await authApi.forgotPassword(buildUnknownEmail());
        expect(existingResponse.status()).toBe(200);
        expect(unknownResponse.status()).toBe(200);

        const existingBody = await existingResponse.json();
        const unknownBody = await unknownResponse.json();
        expect(String(existingBody.message || '')).toBe(String(unknownBody.message || ''));
      }
    );

    test(
      'AUTHSEC-E02: session cookie carries secure flags after login @security @regression @safe',
      async ({ authApi }) => {
        const response = await authApi.login(runtime.user.username, runtime.user.password);
        expect(response.status()).toBe(200);

        const setCookie = String(response.headers()['set-cookie'] || '');
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('SameSite=Lax');

        if (runtime.baseUrl.startsWith('https://')) {
          expect(setCookie).toContain('Secure');
        }
      }
    );
  });
});
