export const buildUniqueAccount = (prefix = 'qa') => {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 100_000)}`;
  return {
    username: `${prefix}_${stamp}`,
    email: `${prefix}_${stamp}@needlymart.com`,
    password: 'qauser123'
  };
};

export const buildInvoiceId = () => `ORD-QA-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
