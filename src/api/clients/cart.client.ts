import { APIRequestContext } from '@playwright/test';

export class CartApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get() {
    return this.request.get('/api/cart', {
      headers: { Accept: 'application/json' }
    });
  }

  async add(productId: number, quantity = 1) {
    return this.request.post('/api/cart/add', {
      data: { productId, quantity },
      headers: { Accept: 'application/json' }
    });
  }

  async applyCoupon(code: string) {
    return this.request.post('/api/cart/coupon', {
      data: { code },
      headers: { Accept: 'application/json' }
    });
  }

  async updateItem(productId: number, quantity: number) {
    return this.request.patch(`/api/cart/items/${productId}`, {
      data: { quantity },
      headers: { Accept: 'application/json' }
    });
  }

  async removeItem(productId: number) {
    return this.request.delete(`/api/cart/items/${productId}`, {
      headers: { Accept: 'application/json' }
    });
  }

  async removeCoupon() {
    return this.request.delete('/api/cart/coupon', {
      headers: { Accept: 'application/json' }
    });
  }

  async clear() {
    return this.request.delete('/api/cart', {
      headers: { Accept: 'application/json' }
    });
  }
}
