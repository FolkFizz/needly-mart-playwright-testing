export const TEST_ID = {
  nav: {
    profileLink: 'nav-profile-link',
    logoutLink: 'nav-logout-link',
    loginLink: 'nav-login-link'
  },
  auth: {
    loginPage: 'login-page',
    loginUsernameInput: 'login-username-input',
    loginPasswordInput: 'login-password-input',
    loginSubmitBtn: 'login-submit-btn',
    loginError: 'login-error',
    loginForgotPasswordLink: 'login-forgot-password-link',
    forgotPasswordPage: 'forgot-password-page',
    forgotPasswordEmailInput: 'forgot-password-email-input',
    forgotPasswordSubmitBtn: 'forgot-password-submit-btn',
    forgotPasswordSuccess: 'forgot-password-success'
  },
  catalog: {
    page: 'catalog-page',
    title: 'catalog-title',
    emptyState: 'catalog-empty-state',
    productsGrid: 'catalog-products-grid',
    filterSearchInput: 'filter-search-input',
    filterCategorySelect: 'filter-category-select',
    filterSortSelect: 'filter-sort-select',
    applyBtn: 'catalog-apply-btn',
    resetBtn: 'catalog-reset-btn',
    productCard: (id: number) => `product-card-${id}`,
    productViewDetails: (id: number) => `product-view-details-${id}`
  },
  product: {
    page: 'product-page',
    title: 'product-title',
    qtyInput: 'product-qty',
    addToCartBtn: 'product-add-to-cart'
  },
  cart: {
    page: 'cart-page',
    title: 'cart-title',
    emptyState: 'cart-empty-state',
    success: 'cart-success',
    error: 'cart-error',
    checkoutLink: 'cart-checkout-link',
    row: (id: number) => `cart-row-${id}`,
    clearBtn: 'cart-clear-btn',
    couponInput: 'cart-coupon-input',
    applyCouponBtn: 'cart-apply-coupon-btn',
    removeCouponBtn: 'cart-remove-coupon-btn',
    couponCode: 'cart-coupon-code',
    discountRow: 'cart-discount-row',
    subtotal: 'cart-subtotal',
    grandTotal: 'cart-grand-total'
  },
  checkout: {
    page: 'checkout-page',
    title: 'checkout-title',
    error: 'checkout-error',
    success: 'checkout-success',
    nameInput: 'checkout-name-input',
    emailInput: 'checkout-email-input',
    addressInput: 'checkout-address-input',
    cardNumberInput: 'checkout-card-number-input',
    expMonthInput: 'checkout-exp-month-input',
    expYearInput: 'checkout-exp-year-input',
    cvcInput: 'checkout-cvc-input',
    paymentStatus: 'checkout-payment-status',
    payButton: 'mock-pay-btn'
  },
  orderSuccess: {
    page: 'order-success-page',
    title: 'order-success-title',
    orderId: 'order-success-order-id',
    invoiceLink: 'order-success-view-invoice-link'
  }
} as const;
