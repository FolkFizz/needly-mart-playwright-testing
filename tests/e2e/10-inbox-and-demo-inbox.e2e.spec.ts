import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';

test.describe('INBOX :: UI Inbox And Demo Inbox', () => {
  test.describe('positive cases', () => {
    test(
      'INBOX-P01: logged-in user can read reset email in inbox @e2e @regression @safe',
      async ({ authPage, inboxPage }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await inboxPage.gotoInbox();
        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();
        await inboxPage.openEmail(Number(emailId));
        await inboxPage.assertDetailBodyContains('/reset-password/');
      }
    );

    test(
      'INBOX-P02: forgot-password success view can open demo inbox link @e2e @regression @safe',
      async ({ authPage, inboxPage }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();
        await authPage.assertForgotPasswordDemoInboxLinkVisible();

        await authPage.openDemoInboxFromForgotPassword();
        await inboxPage.openInboxTab();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'INBOX-N01: unauthenticated user is redirected from private inbox to login @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto('/inbox');
        await authPage.assertLoginPageVisible();
      }
    );

    test(
      'INBOX-N02: unauthenticated user is redirected from private inbox detail to login @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto('/inbox/1');
        await authPage.assertLoginPageVisible();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'INBOX-E01: demo inbox allows trash and restore flow without login @e2e @regression @safe',
      async ({ authPage, inboxPage }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();
        await authPage.logoutIfVisible();

        await inboxPage.gotoDemoInbox();
        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();

        await inboxPage.moveEmailToTrash(Number(emailId));
        await inboxPage.openTrashTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));

        await inboxPage.restoreEmailFromTrash(Number(emailId));
        await inboxPage.openInboxTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));
      }
    );
  });
});
