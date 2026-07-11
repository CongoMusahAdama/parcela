import { randomInt } from 'crypto';

const DEFAULT_OTP_LENGTH = 6;

/** Short numeric one-time code for temporary logins (SMS-friendly). */
export function generateTemporaryPassword(length = DEFAULT_OTP_LENGTH): string {
  const digits = Math.max(4, Math.min(length, 8));
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  return String(randomInt(min, max));
}
