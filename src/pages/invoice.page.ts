import { Page, expect } from '@playwright/test';
import { TEST_ID } from '@selectors/test-ids';

const parseMoney = (value: string): number => {
  const normalized = String(value || '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class InvoicePage {
  constructor(private readonly page: Page) {}

  async assertPageVisible() {
    await expect(this.page.getByTestId(TEST_ID.invoice.page)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.invoice.title)).toBeVisible();
  }

  async assertOrderIdContains(orderId: string) {
    await expect(this.page.getByTestId(TEST_ID.invoice.orderId)).toContainText(orderId);
  }

  async assertDiscountVisible() {
    await expect(this.page.getByTestId(TEST_ID.invoice.discount)).toBeVisible();
  }

  async assertDiscountHidden() {
    await expect(this.page.getByTestId(TEST_ID.invoice.discount)).toHaveCount(0);
  }

  async readGrandTotal() {
    const text = (await this.page.getByTestId(TEST_ID.invoice.grandTotal).textContent()) || '';
    return parseMoney(text);
  }

  async readSubtotal() {
    const text = (await this.page.getByTestId(TEST_ID.invoice.subtotal).textContent()) || '';
    return parseMoney(text);
  }

  async backToOrderHistory() {
    await this.page.getByTestId(TEST_ID.invoice.backOrderHistoryLink).click();
  }
}
