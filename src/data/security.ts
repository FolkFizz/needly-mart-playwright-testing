import { ROUTE } from '@config/routes';

const evidenceImageHex = '89504E470D0A1A0A';

export const securityData = {
  status: {
    ok: 200,
    redirect: 302,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    tooManyRequests: 429
  },
  routes: {
    claim: ROUTE.claim,
    apiCartAdd: '/api/cart/add',
    home: ROUTE.home,
    notFound: '/route-that-does-not-exist',
    unknownInvoice: ROUTE.invoice('ORD-9999999999999-999'),
    unknownClaimEvidence: ROUTE.claimEvidence(99_999_999),
    testResetStock: ROUTE.testResetStock,
    protectedHtmlGuards: [ROUTE.profile('info'), ROUTE.checkout, ROUTE.inbox, ROUTE.claim]
  },
  auth: {
    invalidResetToken: 'invalid_reset_token'
  },
  headers: {
    accept: {
      html: 'text/html',
      json: 'application/json',
      any: '*/*'
    },
    setCookie: {
      httpOnly: 'HttpOnly',
      sameSiteLax: 'SameSite=Lax',
      secure: 'Secure'
    },
    rateLimit: ['ratelimit-limit', 'ratelimit-remaining', 'ratelimit-reset'],
    responseMarkers: {
      loginPage: 'data-testid="login-page"',
      invoicePage: 'data-testid="invoice-page"',
      notFoundPage: 'data-testid="not-found-page"',
      inboxPage: 'data-testid="inbox-page"',
      resetPasswordPath: '/reset-password/'
    }
  },
  messages: {
    ifEmailExists: 'If the email exists',
    invalidCredentials: 'Invalid username or password',
    invalidOrExpiredToken: 'invalid or expired'
  },
  testHooks: {
    resetStockDefault: 50
  },
  demoInbox: {
    formBox: {
      inbox: 'inbox',
      trash: 'trash'
    }
  },
  claims: {
    validUploadDescription: 'Valid image upload from security suite',
    invalidUploadDescription: 'Upload text file should fail',
    oversizedUploadDescription: 'Oversized upload should be blocked',
    validUpload: {
      name: 'security-proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from(evidenceImageHex, 'hex')
    },
    invalidUpload: {
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not-an-image')
    },
    oversizedUpload: {
      name: 'too-large.png',
      mimeType: 'image/png',
      sizeBytes: 6 * 1024 * 1024
    }
  },
  numbers: {
    zero: 0,
    one: 1
  },
  invalid: {
    productIdText: 'not-a-number'
  }
} as const;
