import { Page, expect } from '@playwright/test';
import { TEST_ID } from '@selectors/test-ids';

const normalizeOrderId = (value: string): string =>
  String(value || '')
    .trim()
    .replace(/^order\s*id\s*:\s*/i, '')
    .trim();

const decodeSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export class OrderSuccessPage {
  constructor(private readonly page: Page) {}

  async assertPageVisible() {
    await expect(this.page.getByTestId(TEST_ID.orderSuccess.page)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.orderSuccess.title)).toBeVisible();
  }

  private readOrderIdFromCurrentUrl(): string {
    try {
      const url = new URL(this.page.url());
      const raw = url.searchParams.get('order_id');
      return raw ? normalizeOrderId(decodeSafe(raw)) : '';
    } catch {
      return '';
    }
  }

  private async readOrderIdFromInvoiceLink(): Promise<string> {
    const href = await this.page.getByTestId(TEST_ID.orderSuccess.invoiceLink).getAttribute('href');
    if (!href) return '';

    const match = href.match(/\/order\/invoice\/([^/?#]+)/i);
    if (!match) return '';
    return normalizeOrderId(decodeSafe(match[1]));
  }

  private async readOrderIdFromLabelText(): Promise<string> {
    const rawText = (await this.page.getByTestId(TEST_ID.orderSuccess.orderId).textContent()) || '';
    return normalizeOrderId(rawText);
  }

  async readOrderId() {
    const fromUrl = this.readOrderIdFromCurrentUrl();
    if (fromUrl) return fromUrl;

    const fromInvoiceLink = await this.readOrderIdFromInvoiceLink();
    if (fromInvoiceLink) return fromInvoiceLink;

    return this.readOrderIdFromLabelText();
  }

  async assertOrderIdVisible() {
    const orderId = await this.readOrderId();
    expect(orderId).not.toBe('');
  }

  async openInvoice() {
    await this.page.getByTestId(TEST_ID.orderSuccess.invoiceLink).click();
  }
}
