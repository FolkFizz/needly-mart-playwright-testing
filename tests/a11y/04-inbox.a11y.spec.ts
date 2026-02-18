import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';

test.describe('INBOX :: A11y', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoForgotPassword();
    await authPage.submitForgotPassword(runtime.user.email);
    await authPage.assertForgotPasswordSuccessVisible();
  });

  test.describe('positive cases', () => {
    test(
      'INBOXA11Y-P01: private inbox list and detail views have no critical or serious violations @a11y @regression @safe',
      async ({ authPage, inboxPage, a11yAudit }) => {
        await authPage.gotoLogin();
        await authPage.login(runtime.user.username, runtime.user.password);
        await authPage.assertLoggedInUiVisible();

        await inboxPage.gotoInbox();
        await a11yAudit.assertNoCriticalOrSerious();

        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();
        await inboxPage.openEmail(Number(emailId));
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'INBOXA11Y-N01: unauthenticated private inbox access redirects to accessible login page @a11y @regression @safe',
      async ({ authPage, page, a11yAudit }) => {
        await authPage.logoutIfVisible();
        await page.goto('/inbox');
        await authPage.assertLoginPageVisible();
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'INBOXA11Y-E01: demo inbox trash restore and empty-trash states remain accessible @a11y @regression @safe',
      async ({ inboxPage, a11yAudit }) => {
        await inboxPage.gotoDemoInbox();
        await a11yAudit.assertNoCriticalOrSerious();

        const emailId = await inboxPage.readFirstEmailId();
        expect(emailId).not.toBeNull();

        await inboxPage.moveEmailToTrash(Number(emailId));
        await inboxPage.openTrashTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));
        await a11yAudit.assertNoCriticalOrSerious();

        await inboxPage.restoreEmailFromTrash(Number(emailId));
        await inboxPage.openInboxTab();
        await inboxPage.assertEmailItemVisible(Number(emailId));

        await inboxPage.moveEmailToTrash(Number(emailId));
        await inboxPage.openTrashTab();
        await inboxPage.emptyTrash();
        await inboxPage.assertEmptyStateContains('Trash is empty.');
        await a11yAudit.assertNoCriticalOrSerious();
      }
    );
  });
});
