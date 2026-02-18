import { expect } from '@playwright/test';
import { CartApiClient } from '@api/clients/cart.client';
import { OrdersApiClient } from '@api/clients/orders.client';
import { ProductsApiClient } from '@api/clients/products.client';
import { checkoutForm, testCards } from '@data/checkout';
import { integrationData } from '@data/integration';

export const readOrderId = (body: unknown): string => {
  const row = body as { orderId?: unknown };
  return String(row.orderId || '');
};

export const readFirstClaimIdFromHtml = (html: string): number | null => {
  const match = html.match(/claim-card-(\d+)/);
  if (!match) return null;
  const claimId = Number.parseInt(match[1], 10);
  return Number.isFinite(claimId) ? claimId : null;
};

export const pickInStockProductId = async (productsApi: ProductsApiClient): Promise<number> => {
  const productResponse = await productsApi.list();
  expect(productResponse.status()).toBe(integrationData.status.ok);
  const productBody = await productResponse.json();

  const products = Array.isArray(productBody.products)
    ? (productBody.products as Array<{ id: number; stock: number }>)
    : [];

  const candidate = products.find((product) => Number(product.stock) > 0);
  if (!candidate) {
    throw new Error('No in-stock product available for integration flow');
  }

  return Number(candidate.id);
};

export const createApprovedOrder = async (params: {
  cartApi: CartApiClient;
  ordersApi: OrdersApiClient;
  productId: number;
}): Promise<string> => {
  const { cartApi, ordersApi, productId } = params;

  expect((await cartApi.clear()).status()).toBe(integrationData.status.ok);
  expect((await cartApi.add(productId, 1)).status()).toBe(integrationData.status.ok);

  const authorizeResponse = await ordersApi.authorizeMockPayment(testCards.approved);
  expect(authorizeResponse.status()).toBe(integrationData.status.ok);
  const authorizeBody = await authorizeResponse.json();
  const paymentToken = String(authorizeBody.token || '');
  expect(paymentToken).not.toBe('');

  const placeOrderResponse = await ordersApi.placeMockOrder({
    paymentToken,
    ...checkoutForm.valid
  });
  expect(placeOrderResponse.status()).toBe(integrationData.status.ok);
  const orderBody = await placeOrderResponse.json();

  const orderId = readOrderId(orderBody);
  expect(orderId).toContain(integrationData.order.idPrefix);
  return orderId;
};
