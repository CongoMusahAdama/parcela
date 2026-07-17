import type { PlatformCredentialResult } from "@/lib/platform-api";

export function platformCredentialSuccessText(result: PlatformCredentialResult): string {
  if (result.smsSent) {
    return `Temporary login details were sent by SMS to ${result.phone}. They were reminded not to share the code with anyone.`;
  }
  return `SMS could not be sent. Share this temporary code with ${result.phone}: ${result.temporaryPassword}. They sign in at /admin/login with their phone number, then set a new password. Tell them not to share the code with anyone.`;
}

export function platformOnboardSmsText(
  issueLoginsNow: boolean,
  hqSmsSent: boolean | undefined,
  hqPhone: string,
  hqTemporaryPassword?: string,
): string {
  if (!issueLoginsNow) {
    return "Complete setup, then issue HQ logins when ready.";
  }
  if (hqSmsSent) {
    return `HQ login for ${hqPhone} was sent by SMS. They sign in at /admin/login with that phone number and finish network setup.`;
  }
  if (hqTemporaryPassword) {
    return `HQ login for ${hqPhone} is ready. Share this temporary code: ${hqTemporaryPassword}. They sign in at /admin/login with their phone number and set a new password on first sign-in.`;
  }
  return `HQ login is ready, but SMS could not be sent — issue credentials again from HQ admins once a valid phone is on file.`;
}
