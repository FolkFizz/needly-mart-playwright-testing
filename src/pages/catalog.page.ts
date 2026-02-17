import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class CatalogPage {
  constructor(private readonly page: Page) {}

  async gotoCatalog() {
    await this.page.goto(ROUTE.home);
    await expect(this.page.getByTestId(TEST_ID.catalog.page)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.catalog.title)).toBeVisible();
  }

  async search(keyword: string) {
    await this.page.getByTestId(TEST_ID.catalog.filterSearchInput).fill(keyword);
    await this.page.getByTestId(TEST_ID.catalog.applyBtn).click();
  }

  async selectCategory(category: string) {
    await this.page.getByTestId(TEST_ID.catalog.filterCategorySelect).selectOption(category);
    await this.page.getByTestId(TEST_ID.catalog.applyBtn).click();
  }

  async selectSort(sort: string) {
    await this.page.getByTestId(TEST_ID.catalog.filterSortSelect).selectOption(sort);
    await this.page.getByTestId(TEST_ID.catalog.applyBtn).click();
  }

  async resetFilters() {
    await this.page.getByTestId(TEST_ID.catalog.resetBtn).click();
  }

  async openProductDetails(productId: number) {
    await this.page.getByTestId(TEST_ID.catalog.productViewDetails(productId)).click();
  }

  async getProductCardCount(productIds: number[]) {
    let count = 0;
    for (const id of productIds) {
      if (await this.page.getByTestId(TEST_ID.catalog.productCard(id)).count()) {
        count += 1;
      }
    }
    return count;
  }

  async hasProductCard(productId: number) {
    return (await this.page.getByTestId(TEST_ID.catalog.productCard(productId)).count()) > 0;
  }

  async assertProductCardVisible(productId: number) {
    await expect(this.page.getByTestId(TEST_ID.catalog.productCard(productId))).toBeVisible();
  }

  async assertEmptyStateVisible() {
    await expect(this.page.getByTestId(TEST_ID.catalog.emptyState)).toBeVisible();
  }
}
