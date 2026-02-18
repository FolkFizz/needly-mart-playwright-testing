import { runtime } from '@config/env';

const timestamp = Date.now();
const nonce = Math.floor(Math.random() * 100_000);
const unique = `${timestamp}${nonce}`;

export const accounts = {
  primary: {
    username: runtime.user.username,
    password: runtime.user.password,
    email: runtime.user.email,
    newPassword: runtime.user.newPassword
  },
  invalid: {
    username: runtime.user.username,
    password: 'wrong_password_123'
  },
  register: {
    username: `qauser_${unique}`,
    email: `qauser_${unique}@needlymart.com`,
    password: 'qauser123'
  },
  weak: {
    password: '123'
  },
  edge: {
    usernameWithSpaces: `  ${runtime.user.username}  `
  }
};
