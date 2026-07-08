import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTemporaryPassword(length = 10): string {
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += CHARSET[bytes[i] % CHARSET.length];
  }
  return password;
}
