import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class InboxPage {
  constructor(private readonly page: Page) {}

  async gotoInbox() {
    await this.page.goto(ROUTE.inbox);
    await expect(this.page.getByTestId(TEST_ID.inbox.page)).toBeVisible();
  }

  async gotoDemoInbox() {
    await this.page.goto(ROUTE.demoInbox);
    await expect(this.page.getByTestId(TEST_ID.inbox.page)).toBeVisible();
  }

  async openInboxTab() {
    await this.page.getByTestId(TEST_ID.inbox.tabInbox).click();
  }

  async openTrashTab() {
    await this.page.getByTestId(TEST_ID.inbox.tabTrash).click();
  }

  async readFirstEmailId(): Promise<number | null> {
    const firstItem = this.page.locator('[data-testid^="inbox-email-item-"]').first();
    if (!(await firstItem.count())) return null;

    const testId = await firstItem.getAttribute('data-testid');
    if (!testId) return null;

    const match = testId.match(/inbox-email-item-(\d+)/);
    if (!match) return null;

    const emailId = Number.parseInt(match[1], 10);
    return Number.isFinite(emailId) ? emailId : null;
  }

  async openEmail(emailId: number) {
    await this.page.getByTestId(TEST_ID.inbox.emailLink(emailId)).click();
  }

  async assertEmailItemVisible(emailId: number) {
    await expect(this.page.getByTestId(TEST_ID.inbox.emailItem(emailId))).toBeVisible();
  }

  async assertEmailItemHidden(emailId: number) {
    await expect(this.page.getByTestId(TEST_ID.inbox.emailItem(emailId))).toHaveCount(0);
  }

  async moveEmailToTrash(emailId: number) {
    await this.page.getByTestId(TEST_ID.inbox.trashBtn(emailId)).click();
  }

  async restoreEmailFromTrash(emailId: number) {
    await this.page.getByTestId(TEST_ID.inbox.restoreBtn(emailId)).click();
  }

  async permanentlyDeleteEmailFromTrash(emailId: number) {
    await this.page.getByTestId(TEST_ID.inbox.destroyBtn(emailId)).click();
  }

  async emptyTrash() {
    await this.page.getByTestId(TEST_ID.inbox.emptyTrashBtn).click();
  }

  async assertDetailSubjectContains(text: string) {
    await expect(this.page.getByTestId(TEST_ID.inbox.detailSubject)).toContainText(text);
  }

  async assertDetailBodyContains(text: string) {
    await expect(this.page.getByTestId(TEST_ID.inbox.detailBody)).toContainText(text);
  }

  async assertDetailEmptyVisible() {
    await expect(this.page.getByTestId(TEST_ID.inbox.detailEmpty)).toBeVisible();
  }

  async assertEmptyStateContains(text: string) {
    await expect(this.page.getByTestId(TEST_ID.inbox.emptyState)).toContainText(text);
  }
}
