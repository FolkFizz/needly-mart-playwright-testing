import { runtime } from '@config/env';

export const accounts = {
  primary: {
    username: runtime.user.username,
    password: runtime.user.password,
    email: runtime.user.email
  },
  invalid: {
    username: runtime.user.username,
    password: 'wrong_password_123'
  },
  edge: {
    usernameWithSpaces: `  ${runtime.user.username}  `
  }
};
