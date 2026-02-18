import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

test.describe('INBOX :: UI Inbox Lifecycle', () => {
  test.describe('positive cases', () => {
    test(
      'INBOX-P01: user can request password reset and read reset email in private inbox @e2e @regression @safe',
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
        await inboxPage.assertDetailSubjectContains('[RESET]');
        await inboxPage.assertDetailBodyContains('/reset-password/');
      }
    );

    test(
      'INBOX-P02: forgot-password success screen can open demo inbox directly @e2e @regression @safe',
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
      'INBOX-N01: unauthenticated user is redirected from private inbox page to login @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto('/inbox');
        await authPage.assertLoginPageVisible();
      }
    );

    test(
      'INBOX-N02: unauthenticated user is redirected from private inbox detail page to login @e2e @regression @safe',
      async ({ authPage, page }) => {
        await page.goto('/inbox/1');
        await authPage.assertLoginPageVisible();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'INBOX-E01: demo inbox supports trash restore and empty-trash flow without login @e2e @regression @safe',
      async ({ authPage, inboxPage }) => {
        await authPage.gotoForgotPassword();
        await authPage.submitForgotPassword(runtime.user.email);
        await authPage.assertForgotPasswordSuccessVisible();

        await inboxPage.gotoDemoInbox();
        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();

        await inboxPage.moveEmailToTrash(Number(emailId));
        await inboxPage.openTrashTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));

        await inboxPage.restoreEmailFromTrash(Number(emailId));
        await inboxPage.openInboxTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));

        await inboxPage.moveEmailToTrash(Number(emailId));
        await inboxPage.openTrashTab();
        await inboxPage.emptyTrash();
        await inboxPage.assertEmailItemHidden(Number(emailId));
        await inboxPage.assertEmptyStateContains('Trash is empty.');
      }
    );
  });
});
