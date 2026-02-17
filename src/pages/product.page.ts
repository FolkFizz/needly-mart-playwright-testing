import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class ProductPage {
  constructor(private readonly page: Page) {}

  async gotoProduct(productId: number) {
    await this.page.goto(ROUTE.product(productId));
    await expect(this.page.getByTestId(TEST_ID.product.page)).toBeVisible();
  }

  async gotoProductExpectNotFound(productId: number) {
    await this.page.goto(ROUTE.product(productId));
    await expect(this.page.getByTestId(TEST_ID.common.notFoundPage)).toBeVisible();
  }

  async getTitleText() {
    return (await this.page.getByTestId(TEST_ID.product.title).textContent())?.trim() || '';
  }

  async readStockText() {
    return (await this.page.getByTestId(TEST_ID.product.stock).textContent())?.trim() || '';
  }

  async assertTitleEquals(expectedTitle: string) {
    await expect(this.page.getByTestId(TEST_ID.product.title)).toHaveText(expectedTitle);
  }

  async assertOutOfStockVisible() {
    await expect(this.page.getByTestId(TEST_ID.product.outOfStock)).toBeVisible();
  }

  async assertNotFoundMessageContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.common.notFoundMessage)).toContainText(message);
  }

  async setQuantity(quantity: number) {
    await this.page.getByTestId(TEST_ID.product.qtyInput).fill(String(quantity));
  }

  async addToCart() {
    await this.page.getByTestId(TEST_ID.product.addToCartBtn).click();
  }
}
