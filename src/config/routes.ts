export const ROUTE = {
  home: '/home',
  login: '/login',
  forgotPassword: '/forgot-password',
  cart: '/cart',
  checkout: '/order/checkout',
  product: (id: number) => `/product/${id}`
} as const;
