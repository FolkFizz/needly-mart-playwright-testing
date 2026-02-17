import { APIRequestContext } from '@playwright/test';

export class TestHooksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async reset(apiKey = '') {
    return this.request.post('/api/test/reset', {
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-test-api-key': apiKey } : {})
      }
    });
  }

  async seed(apiKey = '') {
    return this.request.post('/api/test/seed', {
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-test-api-key': apiKey } : {})
      }
    });
  }

  async setStock(productId: number, stock: number, apiKey = '') {
    return this.request.post('/api/test/set-stock', {
      data: { productId, stock },
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-test-api-key': apiKey } : {})
      }
    });
  }
}
