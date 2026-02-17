import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto(ROUTE.login);
    await expect(this.page.getByTestId(TEST_ID.auth.loginPage)).toBeVisible();
  }

  async gotoRegister() {
    await this.page.goto(ROUTE.register);
    await expect(this.page.getByTestId(TEST_ID.auth.registerPage)).toBeVisible();
  }

  async gotoForgotPassword() {
    await this.page.goto(ROUTE.forgotPassword);
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordPage)).toBeVisible();
  }

  async gotoResetPassword(token: string) {
    await this.page.goto(ROUTE.resetPassword(token));
    await expect(this.page.getByTestId(TEST_ID.auth.resetPasswordPage)).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.page.getByTestId(TEST_ID.auth.loginUsernameInput).fill(username);
    await this.page.getByTestId(TEST_ID.auth.loginPasswordInput).fill(password);
    await this.page.getByTestId(TEST_ID.auth.loginSubmitBtn).click();
  }

  async register(username: string, email: string, password: string, confirmPassword = password) {
    await this.page.getByTestId(TEST_ID.auth.registerUsernameInput).fill(username);
    await this.page.getByTestId(TEST_ID.auth.registerEmailInput).fill(email);
    await this.page.getByTestId(TEST_ID.auth.registerPasswordInput).fill(password);
    await this.page.getByTestId(TEST_ID.auth.registerConfirmPasswordInput).fill(confirmPassword);
    await this.page.getByTestId(TEST_ID.auth.registerSubmitBtn).click();
  }

  async openCreateAccount() {
    await this.page.getByTestId(TEST_ID.auth.loginCreateAccountLink).click();
    await expect(this.page.getByTestId(TEST_ID.auth.registerPage)).toBeVisible();
  }

  async openForgotPassword() {
    await this.page.getByTestId(TEST_ID.auth.loginForgotPasswordLink).click();
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordPage)).toBeVisible();
  }

  async submitForgotPassword(email: string) {
    await this.page.getByTestId(TEST_ID.auth.forgotPasswordEmailInput).fill(email);
    await this.page.getByTestId(TEST_ID.auth.forgotPasswordSubmitBtn).click();
  }

  async submitResetPassword(password: string, confirmPassword = password) {
    await this.page.getByTestId(TEST_ID.auth.resetPasswordInput).fill(password);
    await this.page.getByTestId(TEST_ID.auth.resetPasswordConfirmInput).fill(confirmPassword);
    await this.page.getByTestId(TEST_ID.auth.resetPasswordSubmitBtn).click();
  }

  async assertLoggedInUiVisible() {
    await expect(this.page.getByTestId(TEST_ID.nav.profileLink)).toBeVisible();
    await expect(this.page.getByTestId(TEST_ID.nav.logoutLink)).toBeVisible();
  }

  async assertLoginPageVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.loginPage)).toBeVisible();
  }

  async assertLoginSuccessContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.loginSuccess)).toContainText(message);
  }

  async assertLoginErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.loginError)).toContainText(message);
  }

  async assertLoginErrorVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.loginError)).toBeVisible();
  }

  async assertRegisterErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.registerError)).toContainText(message);
  }

  async assertRegisterErrorContainsAny(messages: string[]) {
    const actual = (await this.page.getByTestId(TEST_ID.auth.registerError).textContent()) || '';
    expect(messages.some((message) => actual.includes(message))).toBeTruthy();
  }

  async assertForgotPasswordSuccessVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordSuccess)).toBeVisible();
  }

  async assertForgotPasswordSuccessContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordSuccess)).toContainText(message);
  }

  async assertForgotPasswordErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordError)).toContainText(message);
  }

  async assertForgotPasswordDemoInboxLinkVisible() {
    await expect(this.page.getByTestId(TEST_ID.auth.forgotPasswordDemoInboxLink)).toBeVisible();
  }

  async assertResetPasswordErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.auth.resetPasswordError)).toContainText(message);
  }

  async openDemoInboxFromForgotPassword() {
    await this.page.getByTestId(TEST_ID.auth.forgotPasswordDemoInboxLink).click();
  }

  async logout() {
    await this.page.getByTestId(TEST_ID.nav.logoutLink).click();
  }

  async logoutIfVisible() {
    const logoutLink = this.page.getByTestId(TEST_ID.nav.logoutLink);
    if (await logoutLink.count()) {
      await logoutLink.click();
    }
  }
}
