import { APIRequestContext } from '@playwright/test';

export class ProductsApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(params?: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: string;
  }) {
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

  async getByRawId(rawId: string) {
    return this.request.get(`/api/products/${rawId}`, {
      headers: { Accept: 'application/json' }
    });
  }
}
