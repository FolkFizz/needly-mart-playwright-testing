import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto(ROUTE.login);
    await expect(this.page.getByTestId(TEST_ID.auth.loginPage)).toBeVisible();
  }

  async gotoForgotPassword() {
    await this.page.goto(ROUTE.forgotPassword);
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordPage)).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.page.getByTestId(TEST_ID.auth.loginUsernameInput).fill(username);
    await this.page.getByTestId(TEST_ID.auth.loginPasswordInput).fill(password);
    await this.page.getByTestId(TEST_ID.auth.loginSubmitBtn).click();
  }

  async openForgotPassword() {
    await this.page.getByTestId(TEST_ID.auth.loginForgotPasswordLink).click();
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordPage)).toBeVisible();
  }

  async submitForgotPassword(email: string) {
    await this.page.getByTestId(TEST_ID.auth.forgotPasswordEmailInput).fill(email);
    await this.page.getByTestId(TEST_ID.auth.forgotPasswordSubmitBtn).click();
  }

  async assertLoggedInUiVisible() {
    await expect(this.page.getByTestId(TEST_ID.nav.profileLink)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.nav.logoutLink)).toBeVisible();
  }

  async assertLoginErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.loginError)).toContainText(message);
  }

  async assertLoginErrorVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.loginError)).toBeVisible();
  }

  async assertForgotPasswordSuccessVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordSuccess)).toBeVisible();
  }

  async logoutIfVisible() {
    const logoutLink = this.page.getByTestId(TEST_ID.nav.logoutLink);
    if (await logoutLink.count()) {
      await logoutLink.click();
    }
  }
}
