import { APIRequestContext, expect } from '@playwright/test';

export class AuthApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async getLoginPage() {
    return this.request.get('/login', {
      headers: { Accept: 'text/html' }
    });
  }

  async login(username: string, password: string) {
    return this.request.post('/api/auth/login', {
      data: { username, password },
      headers: { Accept: 'application/json' }
    });
  }

  async register(username: string, email: string, password: string, confirmPassword = password) {
    return this.request.post('/api/auth/register', {
      data: { username, email, password, confirmPassword },
      headers: { Accept: 'application/json' }
    });
  }

  async logout() {
    return this.request.post('/api/auth/logout', {
      headers: { Accept: 'application/json' }
    });
  }

  async forgotPassword(email: string) {
    return this.request.post('/api/auth/forgot-password', {
      data: { email },
      headers: { Accept: 'application/json' }
    });
  }

  async validateResetToken(token: string) {
    return this.request.get(`/api/auth/reset-password/${token}`, {
      headers: { Accept: 'application/json' }
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request.post(`/api/auth/reset-password/${token}`, {
      data: {
        password,
        confirmPassword: password
      },
      headers: { Accept: 'application/json' }
    });
  }

  async me() {
    return this.request.get('/api/users/me', {
      headers: { Accept: 'application/json' }
    });
  }

  async expectOk(responsePromise: Promise<import('@playwright/test').APIResponse>) {
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    return response;
  }
}
