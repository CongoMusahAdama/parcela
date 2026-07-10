import type { PlatformCredentialResult } from "@/lib/platform-api";

export function platformCredentialSuccessText(result: PlatformCredentialResult): string {
  if (result.smsSent) {
    return `Temporary login details were sent by SMS to the phone on file for ${result.email}. They were reminded not to share the password with anyone.`;
  }
  return `SMS could not be sent. Share this temporary password with ${result.email}: ${result.temporaryPassword}. Tell them not to share it with anyone.`;
}

export function platformOnboardSmsText(
  issueLoginsNow: boolean,
  hqSmsSent: boolean | undefined,
  hqEmail: string,
): string {
  if (!issueLoginsNow) {
    return "Complete setup, then issue HQ logins when ready.";
  }
  if (hqSmsSent) {
    return `HQ login for ${hqEmail} was sent by SMS. They sign in at /admin and finish network setup.`;
  }
  return `HQ login for ${hqEmail} is ready, but SMS could not be sent — issue credentials again from HQ admins once a valid phone is on file.`;
}
