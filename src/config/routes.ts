export const ROUTE = {
  home: '/home',
  login: '/login',
  forgotPassword: '/forgot-password',
  cart: '/cart',
  product: (id: number) => `/product/${id}`
} as const;
