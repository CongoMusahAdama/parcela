import type { UpsertLeadResult } from "@/lib/admin-api";

export function adminLeadCredentialSuccessText(
  result: UpsertLeadResult,
  phoneDisplay: string,
  stationLabel: string,
): string {
  if (result.smsSent) {
    return `Login details were sent to ${phoneDisplay}. ${result.lead.displayName} is locked to ${stationLabel}.`;
  }
  if (result.temporaryPin) {
    return `Share this temporary PIN with ${result.lead.displayName} (${phoneDisplay}): ${result.temporaryPin}. They sign in at /portal/login → Branch lead, then set a new PIN.`;
  }
  return `A new PIN was generated for ${result.lead.displayName}, but SMS may be unavailable. Use Send login again or check messaging settings.`;
}
