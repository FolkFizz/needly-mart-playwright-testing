import { ROUTE } from '@config/routes';

const claimEvidenceImageHex = '89504E470D0A1A0A';

export const integrationData = {
  status: {
    ok: 200,
    redirect: 302,
    badRequest: 400,
    unauthorized: 401,
    paymentRequired: 402,
    forbidden: 403,
    notFound: 404,
    internalServerError: 500
  },
  auth: {
    invalidPassword: 'wrong_password_integration_guard'
  },
  reset: {
    invalidToken: 'invalid-reset-token-value'
  },
  order: {
    idPrefix: 'ORD-',
    missingPaymentToken: 'missing-token',
    quantity: {
      single: 1,
      bulk: 2
    }
  },
  claims: {
    validDescription: 'Integration claim with binary evidence lifecycle check.',
    evidenceImage: {
      name: 'claim-proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from(claimEvidenceImageHex, 'hex')
    },
    formBox: {
      inbox: 'inbox',
      trash: 'trash'
    }
  },
  testHooks: {
    invalidProductId: 999_999,
    defaultStock: 50,
    invalidStock: -1
  },
  selectors: {
    loginPage: 'data-testid="login-page"'
  },
  performance: {
    healthChecksMaxElapsedMs: 4_000,
    healthChecksAttempts: 3
  },
  routes: {
    profileOrders: ROUTE.profile('orders'),
    profileClaims: ROUTE.profile('claims'),
    profileClaimsTrash: `${ROUTE.profile('claims')}&claim_box=trash`,
    protectedHtmlGuards: [ROUTE.profile('info'), ROUTE.checkout, ROUTE.inbox]
  }
} as const;
