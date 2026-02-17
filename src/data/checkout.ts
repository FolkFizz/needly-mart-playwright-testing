const now = new Date();
const currentYear = now.getFullYear();
const futureYear2Digits = String((currentYear + 2) % 100).padStart(2, '0');
const pastYear2Digits = String((currentYear - 1) % 100).padStart(2, '0');

export const checkoutForm = {
  valid: {
    name: 'QA Buyer',
    email: 'qa.buyer@example.com',
    address: '123 Test Street, Mock City 10110'
  }
} as const;

export const testCards = {
  approved: {
    cardNumber: '4242 4242 4242 4242',
    expMonth: '12',
    expYear: futureYear2Digits,
    cvv: '123'
  },
  declined: {
    cardNumber: '5555 5555 5555 4444',
    expMonth: '12',
    expYear: futureYear2Digits,
    cvv: '123'
  },
  insufficientFunds: {
    cardNumber: '4000 0000 0000 9995',
    expMonth: '12',
    expYear: futureYear2Digits,
    cvv: '123'
  },
  expired: {
    cardNumber: '4242 4242 4242 4242',
    expMonth: '01',
    expYear: pastYear2Digits,
    cvv: '123'
  }
} as const;
