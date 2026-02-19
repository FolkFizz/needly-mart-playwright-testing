import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';
import { buildUniqueAccount } from '@helpers/factories';

test.describe('PROFILE :: UI Profile Lifecycle', () => {
  test.beforeEach(async ({ authPage, profilePage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();
    await profilePage.gotoProfile('info');
  });

  test.describe('negative cases', () => {
    test(
      'PROFILE-N01: updating profile with duplicate email is rejected @e2e @regression @safe',
      async ({ profilePage, authApi }) => {
        const duplicateAccount = buildUniqueAccount('ui_profile_duplicate');
        expect(
          (
            await authApi.register(
              duplicateAccount.username,
              duplicateAccount.email,
              duplicateAccount.password
            )
          ).status()
        ).toBe(201);

        await profilePage.updateProfile(duplicateAccount.email, 'Duplicate Email Validation', '0811111111');
        await profilePage.assertErrorContains('Email is already in use');
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'PROFILE-P01: user can update profile and navigate all profile tabs @e2e @regression @destructive',
      async ({ profilePage }) => {
        await profilePage.updateProfile(
          runtime.user.email,
          `QA Address ${Date.now()}`,
          `08${Math.floor(10000000 + Math.random() * 89999999)}`
        );
        await profilePage.assertSuccessContains('Profile updated');

        await profilePage.openOrdersTab();
        await profilePage.openClaimsTab();
        await profilePage.openInfoTab();
      }
    );

    test(
      'PROFILE-E01: profile email is normalized to lowercase and trimmed after save @e2e @regression @destructive',
      async ({ profilePage }) => {
        await profilePage.updateProfile(
          `  ${runtime.user.email.toUpperCase()}  `,
          'Normalize Email Edge Case',
          '0822222222'
        );
        await profilePage.assertSuccessContains('Profile updated');
        expect(await profilePage.readEmailValue()).toBe(runtime.user.email.toLowerCase());
      }
    );
  });
});
