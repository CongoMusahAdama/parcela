import { restoreLeadSession } from "@/lib/lead-auth";
import { restoreStaffSession } from "@/lib/staff-auth";
import type { StaffRole, StaffSession } from "@/types/staff";
import type { LeadSession } from "@/types/lead";

export const OPERATOR_LOGIN_PATH = "/portal/login";

export type OperatorLoginMode = "staff" | "lead";

export function getOperatorDashboardPath(role: StaffRole): string {
  return role === "station_lead" ? "/lead/dashboard" : "/staff/dashboard";
}

export function getOperatorChangeCredentialPath(role: StaffRole): string {
  return role === "station_lead" ? "/lead/change-pin" : "/staff/change-password";
}

export function getPostLoginPath(session: StaffSession | LeadSession): string {
  if (session.staff.mustChangePassword) {
    return getOperatorChangeCredentialPath(session.staff.role);
  }
  return getOperatorDashboardPath(session.staff.role);
}

export async function restoreOperatorSession(): Promise<StaffSession | LeadSession | null> {
  try {
    const staffSession = await restoreStaffSession();
    if (staffSession) return staffSession;
  } catch {
    // Fall through — may have lead session instead.
  }

  try {
    const leadSession = await restoreLeadSession();
    if (leadSession) return leadSession;
  } catch {
    return null;
  }

  return null;
}
