import { randomInt } from 'crypto';

const DEFAULT_OTP_LENGTH = 6;

/** Fixed HQ password for local development when mNotify SMS is unavailable. */
export const LOCAL_DEV_HQ_PASSWORD = 'P@$$w0rd';

/** Fixed branch-lead PIN for local development (numeric — leads sign in with phone + PIN). */
export const LOCAL_DEV_LEAD_PIN = '123456';

export function useLocalDevCredentials(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/** Short numeric one-time code for temporary logins (SMS-friendly). */
export function generateTemporaryPassword(length = DEFAULT_OTP_LENGTH): string {
  const digits = Math.max(4, Math.min(length, 8));
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  return String(randomInt(min, max));
}

/** HQ admin temporary password — fixed on localhost so devs can sign in without SMS. */
export function generateHqTemporaryPassword(): string {
  if (useLocalDevCredentials()) {
    return LOCAL_DEV_HQ_PASSWORD;
  }
  return generateTemporaryPassword();
}

/** Branch lead temporary PIN — fixed on localhost so devs can sign in without SMS. */
export function generateLeadTemporaryPin(): string {
  if (useLocalDevCredentials()) {
    return LOCAL_DEV_LEAD_PIN;
  }
  return generateTemporaryPassword(6);
}

export function shouldSkipCredentialSms(): boolean {
  return useLocalDevCredentials();
}
