import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

const parseMoney = (value: string): number => {
  const normalized = String(value || '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class CartPage {
  constructor(private readonly page: Page) {}

  async gotoCart() {
    await this.page.goto(ROUTE.cart);
    await expect(this.page.getByTestId(TEST_ID.cart.page)).toBeVisible();
  }

  async clearCartIfNeeded() {
    const clearButton = this.page.getByTestId(TEST_ID.cart.clearBtn);
    if (await clearButton.count()) {
      await clearButton.click();
    }
  }

  async applyCoupon(code: string) {
    await this.page.getByTestId(TEST_ID.cart.couponInput).fill(code);
    await this.page.getByTestId(TEST_ID.cart.applyCouponBtn).click();
  }

  async removeCouponIfVisible() {
    const removeButton = this.page.getByTestId(TEST_ID.cart.removeCouponBtn);
    if (await removeButton.count()) {
      await removeButton.click();
    }
  }

  async assertCouponApplied(code: string) {
    await expect(this.page.getByTestId(TEST_ID.cart.couponCode)).toHaveText(code);
  }

  async assertDiscountVisible() {
    await expect(this.page.getByTestId(TEST_ID.cart.discountRow)).toBeVisible();
  }

  async assertErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.cart.error)).toContainText(message);
  }

  async assertSuccessContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.cart.success)).toContainText(message);
  }

  async assertItemRowVisible(productId: number) {
    await expect(this.page.getByTestId(TEST_ID.cart.row(productId))).toBeVisible();
  }

  async updateItemQuantity(productId: number, quantity: number) {
    await this.page.getByTestId(TEST_ID.cart.qtyInput(productId)).fill(String(quantity));
    await this.page.getByTestId(TEST_ID.cart.qtyInput(productId)).press('Tab');
    await this.page.waitForLoadState('networkidle');
  }

  async assertEmptyStateVisible() {
    await expect(this.page.getByTestId(TEST_ID.cart.emptyState)).toBeVisible();
  }

  async openCheckout() {
    await this.page.getByTestId(TEST_ID.cart.checkoutLink).click();
  }

  async readSubtotal() {
    const text = (await this.page.getByTestId(TEST_ID.cart.subtotal).textContent()) || '';
    return parseMoney(text);
  }

  async readGrandTotal() {
    const text = (await this.page.getByTestId(TEST_ID.cart.grandTotal).textContent()) || '';
    return parseMoney(text);
  }
}
