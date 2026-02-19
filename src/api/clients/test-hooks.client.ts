import { APIRequestContext } from '@playwright/test';

export class TestHooksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private buildTestAccessHeaders(apiKey = '') {
    return {
      Accept: 'application/json',
      ...(apiKey ? { 'x-test-api-key': apiKey } : {})
    };
  }

  private buildStockResetHeaders(stockResetApiKey = '') {
    return {
      Accept: 'application/json',
      ...(stockResetApiKey ? { 'x-stock-reset-key': stockResetApiKey } : {})
    };
  }

  async reset(apiKey = '') {
    return this.request.post('/api/test/reset', {
      headers: this.buildTestAccessHeaders(apiKey)
    });
  }

  async seed(apiKey = '') {
    return this.request.post('/api/test/seed', {
      headers: this.buildTestAccessHeaders(apiKey)
    });
  }

  async setStock(productId: number, stock: number, stockResetApiKey = '') {
    return this.request.post('/api/test/set-stock', {
      data: { productId, stock },
      headers: this.buildStockResetHeaders(stockResetApiKey)
    });
  }

  async resetStock(stock: number, stockResetApiKey = '') {
    return this.request.post('/api/test/reset-stock', {
      data: { stock },
      headers: this.buildStockResetHeaders(stockResetApiKey)
    });
  }
}
