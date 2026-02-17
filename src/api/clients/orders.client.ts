import { APIRequestContext } from '@playwright/test';

export type AuthorizePaymentInput = {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
};

export type PlaceOrderInput = {
  paymentToken: string;
  name: string;
  email: string;
  address: string;
};

export class OrdersApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async authorizeMockPayment(input: AuthorizePaymentInput) {
    return this.request.post('/order/mock-provider/authorize', {
      data: input,
      headers: { Accept: 'application/json' }
    });
  }

  async placeMockOrder(input: PlaceOrderInput) {
    return this.request.post('/order/api/orders/mock-pay', {
      data: input,
      headers: { Accept: 'application/json' }
    });
  }

  async getInvoicePage(orderId: string) {
    return this.request.get(`/order/invoice/${orderId}`, {
      headers: { Accept: 'text/html' }
    });
  }
}
