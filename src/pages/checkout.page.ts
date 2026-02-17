import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export type CheckoutContact = {
  name: string;
  email: string;
  address: string;
};

export type CheckoutCard = {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
};

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async gotoCheckout() {
    await this.page.goto(ROUTE.checkout);
    await expect(this.page.getByTestId(TEST_ID.checkout.page)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.checkout.title)).toBeVisible();
  }

  async fillContact(input: CheckoutContact) {
    await this.page.getByTestId(TEST_ID.checkout.nameInput).fill(input.name);
    await this.page.getByTestId(TEST_ID.checkout.emailInput).fill(input.email);
    await this.page.getByTestId(TEST_ID.checkout.addressInput).fill(input.address);
  }

  async fillCard(input: CheckoutCard) {
    await this.page.getByTestId(TEST_ID.checkout.cardNumberInput).fill(input.cardNumber);
    await this.page.getByTestId(TEST_ID.checkout.expMonthInput).fill(input.expMonth);
    await this.page.getByTestId(TEST_ID.checkout.expYearInput).fill(input.expYear);
    await this.page.getByTestId(TEST_ID.checkout.cvcInput).fill(input.cvv);
  }

  async clickPayNow() {
    await this.page.getByTestId(TEST_ID.checkout.payButton).click();
  }

  async clickPayNowAndWaitForSuccess() {
    await Promise.all([
      this.page.waitForURL(/\/order\/success\?order_id=/),
      this.clickPayNow()
    ]);
  }

  async clearAddress() {
    await this.page.getByTestId(TEST_ID.checkout.addressInput).fill('');
  }

  async clearName() {
    await this.page.getByTestId(TEST_ID.checkout.nameInput).fill('');
  }

  async clearEmail() {
    await this.page.getByTestId(TEST_ID.checkout.emailInput).fill('');
  }

  async assertPayButtonEnabled() {
    await expect(this.page.getByTestId(TEST_ID.checkout.payButton)).toBeEnabled();
  }

  async assertPayButtonDisabled() {
    await expect(this.page.getByTestId(TEST_ID.checkout.payButton)).toBeDisabled();
  }

  async assertPaymentStatusContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.checkout.paymentStatus)).toContainText(message);
  }

  async readPaymentStatusText() {
    return (await this.page.getByTestId(TEST_ID.checkout.paymentStatus).textContent())?.trim() || '';
  }

  async assertCheckoutErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.checkout.error)).toContainText(message);
  }
}
