import type { AdminAccount } from "@/types/admin";
import type { Operator } from "@/types/parcel";

/** HQ data is always scoped to the admin's configured transport (VIP / STC). */
export function getAdminOperator(admin: AdminAccount): Operator | null {
  if (admin.operator === "VIP" || admin.operator === "STC") {
    return admin.operator;
  }
  return null;
}

export function requireAdminOperator(admin: AdminAccount): Operator {
  const operator = getAdminOperator(admin);
  if (!operator) {
    throw new Error("HQ transport is not configured for this admin session");
  }
  return operator;
}

/** Display name for HQ transport — prefers onboarded legal name over short code. */
export function getAdminOperatorName(admin: AdminAccount): string {
  if (admin.operatorName?.trim()) return admin.operatorName.trim();
  if (admin.operatorConfigured && admin.operator) return `${admin.operator} Transport`;
  return "HQ command center";
}
