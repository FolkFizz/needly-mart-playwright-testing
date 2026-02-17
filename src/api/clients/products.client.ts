import { APIRequestContext } from '@playwright/test';

export class ProductsApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(params?: { q?: string; category?: string }) {
    return this.request.get('/api/products', {
      params,
      headers: { Accept: 'application/json' }
    });
  }

  async getById(productId: number) {
    return this.request.get(`/api/products/${productId}`, {
      headers: { Accept: 'application/json' }
    });
  }
}
