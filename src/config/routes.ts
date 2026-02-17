export const ROUTE = {
  home: '/home',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: (token: string) => `/reset-password/${token}`,
  cart: '/cart',
  checkout: '/order/checkout',
  product: (id: number) => `/product/${id}`,
  profile: (tab: 'info' | 'orders' | 'claims' = 'info') => `/profile?tab=${tab}`,
  claim: '/claim',
  inbox: '/inbox',
  demoInbox: '/demo-inbox',
  orderSuccess: (orderId: string) => `/order/success?order_id=${encodeURIComponent(orderId)}`,
  invoice: (orderId: string) => `/order/invoice/${orderId}`,
  health: '/health',
  healthDb: '/health/db'
} as const;
