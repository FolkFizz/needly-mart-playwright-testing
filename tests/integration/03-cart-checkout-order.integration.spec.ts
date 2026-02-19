import { accounts } from '@data/accounts';
import { coupons } from '@data/coupons';
import { checkoutForm, testCards } from '@data/checkout';
import { integrationData } from '@data/integration';
import { test, expect } from '@fixtures/test.base';
import { pickInStockProductId } from '@helpers/integration-flow';

test.describe('ORDERFLOW :: Integration Cart Coupon Checkout Order', () => {
  test.beforeEach(async ({ authApi, cartApi }) => {
    expect((await authApi.login(accounts.primary.username, accounts.primary.password)).status()).toBe(
      integrationData.status.ok
    );
    expect((await cartApi.clear()).status()).toBe(integrationData.status.ok);
  });

  test.describe('negative cases', () => {
    test(
      'ORDERFLOW-N01: order placement without authorized payment token is rejected @integration @regression @safe',
      async ({ cartApi, ordersApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, integrationData.order.quantity.single)).status()).toBe(
          integrationData.status.ok
        );

        const response = await ordersApi.placeMockOrder({
          paymentToken: integrationData.order.missingPaymentToken,
          ...checkoutForm.valid
        });
        expect(response.status()).toBe(integrationData.status.badRequest);

        const body = await response.json();
        expect(body.ok).toBe(false);
      }
    );

    test(
      'ORDERFLOW-N02: declined card stops order flow at authorization step @integration @regression @safe',
      async ({ cartApi, ordersApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, integrationData.order.quantity.single)).status()).toBe(
          integrationData.status.ok
        );

        const response = await ordersApi.authorizeMockPayment(testCards.declined);
        expect(response.status()).toBe(integrationData.status.paymentRequired);

        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(body.status).toBe('declined');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'ORDERFLOW-E01: adding quantity above stock is blocked before order placement @integration @regression @safe',
      async ({ productsApi, cartApi }) => {
        const productId = await pickInStockProductId(productsApi);
        const productResponse = await productsApi.getById(productId);
        expect(productResponse.status()).toBe(integrationData.status.ok);
        const productBody = await productResponse.json();

        const stock = Number(productBody.product.stock || 0);
        const overLimitQuantity = Math.max(integrationData.order.quantity.single, stock + 1);

        const addResponse = await cartApi.add(productId, overLimitQuantity);
        expect(addResponse.status()).toBe(integrationData.status.badRequest);

        const body = await addResponse.json();
        expect(body.ok).toBe(false);
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'ORDERFLOW-P01: full cart coupon checkout order flow succeeds and clears cart @integration @regression @destructive',
      async ({ cartApi, ordersApi, productsApi }) => {
        const productId = await pickInStockProductId(productsApi);
        expect((await cartApi.add(productId, integrationData.order.quantity.bulk)).status()).toBe(
          integrationData.status.ok
        );
        expect((await cartApi.applyCoupon(coupons.valid)).status()).toBe(integrationData.status.ok);

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
        expect(orderBody.ok).toBe(true);
        expect(String(orderBody.orderId || '').trim()).not.toBe('');

        const cartAfterOrder = await cartApi.get();
        expect(cartAfterOrder.status()).toBe(integrationData.status.ok);
        const cartBody = await cartAfterOrder.json();
        expect(Array.isArray(cartBody.cart)).toBe(true);
        expect(cartBody.cart.length).toBe(0);
      }
    );
  });
});
