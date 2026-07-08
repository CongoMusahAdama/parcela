import { compareSync, hashSync } from 'bcrypt';

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const ROUNDS = 10;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_PREFIX.test(value);
}

export function hashSecret(plain: string): string {
  return hashSync(plain, ROUNDS);
}

export function verifySecret(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (isBcryptHash(stored)) {
    return compareSync(plain, stored);
  }
  return stored === plain;
}

export function ensureHashedSecret(plainOrHash: string): string {
  return isBcryptHash(plainOrHash) ? plainOrHash : hashSecret(plainOrHash);
}
