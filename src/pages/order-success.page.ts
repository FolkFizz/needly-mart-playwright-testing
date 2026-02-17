import { Page, expect } from '@playwright/test';
import { TEST_ID } from '@selectors/test-ids';

export class OrderSuccessPage {
  constructor(private readonly page: Page) {}

  async assertPageVisible() {
    await expect(this.page.getByTestId(TEST_ID.orderSuccess.page)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.orderSuccess.title)).toBeVisible();
  }

  async readOrderId() {
    const rawText = (await this.page.getByTestId(TEST_ID.orderSuccess.orderId).textContent()) || '';
    const match = rawText.match(/ORD-\d+-\d+/);
    return match ? match[0] : '';
  }

  async assertOrderIdVisible() {
    await expect(this.page.getByTestId(TEST_ID.orderSuccess.orderId)).toContainText('ORD-');
  }
}
