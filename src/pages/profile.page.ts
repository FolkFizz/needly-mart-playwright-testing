import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class ProfilePage {
  constructor(private readonly page: Page) {}

  async gotoProfile(tab: 'info' | 'orders' | 'claims' = 'info') {
    await this.page.goto(ROUTE.profile(tab));
    await expect(this.page.getByTestId(TEST_ID.profile.page)).toBeVisible();
  }

  async openInfoTab() {
    await this.page.getByTestId(TEST_ID.profile.tabInfo).click();
    await expect(this.page.getByTestId(TEST_ID.profile.infoSection)).toBeVisible();
  }

  async openOrdersTab() {
    await this.page.getByTestId(TEST_ID.profile.tabOrders).click();
    await expect(this.page.getByTestId(TEST_ID.profile.ordersSection)).toBeVisible();
  }

  async openClaimsTab() {
    await this.page.getByTestId(TEST_ID.profile.tabClaims).click();
    await expect(this.page.getByTestId(TEST_ID.profile.claimsSection)).toBeVisible();
  }

  async updateProfile(email: string, address: string, phone: string) {
    await this.page.getByTestId(TEST_ID.profile.emailInput).fill(email);
    await this.page.getByTestId(TEST_ID.profile.addressInput).fill(address);
    await this.page.getByTestId(TEST_ID.profile.phoneInput).fill(phone);
    await this.page.getByTestId(TEST_ID.profile.saveBtn).click();
  }

  async readEmailValue() {
    return this.page.getByTestId(TEST_ID.profile.emailInput).inputValue();
  }

  async assertSuccessContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.profile.success)).toContainText(message);
  }

  async assertErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.profile.error)).toContainText(message);
  }

  async assertOrderCardVisible(orderId: string) {
    await expect(this.page.getByTestId(TEST_ID.profile.orderCard(orderId))).toBeVisible();
  }

  async openInvoiceForOrder(orderId: string) {
    await this.page.getByTestId(TEST_ID.profile.orderInvoiceLink(orderId)).click();
  }

  async moveOrderToTrash(orderId: string) {
    await this.page.getByTestId(TEST_ID.profile.orderTrashBtn(orderId)).click();
  }

  async restoreOrderFromTrash(orderId: string) {
    await this.page.getByTestId(TEST_ID.profile.orderRestoreBtn(orderId)).click();
  }

  async permanentlyDeleteOrderFromTrash(orderId: string) {
    await this.page.getByTestId(TEST_ID.profile.orderDestroyBtn(orderId)).click();
  }

  async openOrderTrashTab() {
    await this.page.getByTestId(TEST_ID.profile.ordersTrashTab).click();
  }

  async openOrderInboxTab() {
    await this.page.getByTestId(TEST_ID.profile.ordersInboxTab).click();
  }

  async openClaimTrashTab() {
    await this.page.getByTestId(TEST_ID.profile.claimsTrashTab).click();
  }

  async openClaimInboxTab() {
    await this.page.getByTestId(TEST_ID.profile.claimsInboxTab).click();
  }

  async openFileNewClaim() {
    await this.page.getByTestId(TEST_ID.profile.claimsFileNewLink).click();
  }

  async readFirstClaimId(): Promise<number | null> {
    const firstCard = this.page.locator('[data-testid^="claim-card-"]').first();
    if (!(await firstCard.count())) return null;

    const testId = await firstCard.getAttribute('data-testid');
    if (!testId) return null;

    const match = testId.match(/claim-card-(\d+)/);
    if (!match) return null;

    const claimId = Number.parseInt(match[1], 10);
    return Number.isFinite(claimId) ? claimId : null;
  }

  async assertClaimCardVisible(claimId: number) {
    await expect(this.page.getByTestId(TEST_ID.profile.claimCard(claimId))).toBeVisible();
  }

  async moveClaimToTrash(claimId: number) {
    await this.page.getByTestId(TEST_ID.profile.claimTrashBtn(claimId)).click();
  }

  async restoreClaimFromTrash(claimId: number) {
    await this.page.getByTestId(TEST_ID.profile.claimRestoreBtn(claimId)).click();
  }

  async permanentlyDeleteClaimFromTrash(claimId: number) {
    await this.page.getByTestId(TEST_ID.profile.claimDestroyBtn(claimId)).click();
  }

  async assertClaimsEmptyStateContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.profile.claimsEmptyState)).toContainText(message);
  }
}
