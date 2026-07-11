import { OPERATOR_ACCENT, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import type { AdminAccount } from "@/types/admin";
import type { Operator } from "@/types/parcel";

export function isLegacyOperator(code: string): code is Operator {
  return code === "VIP" || code === "STC";
}

/** Operator code from HQ session (any onboarded transport). */
export function getAdminOperator(admin: AdminAccount | null | undefined): string | null {
  const code = admin?.operator?.trim();
  return code ? code.toUpperCase() : null;
}

export function requireAdminOperator(admin: AdminAccount): string {
  const operator = getAdminOperator(admin);
  if (!operator) {
    throw new Error("HQ transport is not configured for this admin session");
  }
  return operator;
}

/** Display name for HQ transport — prefers onboarded legal name over short code. */
export function getAdminOperatorName(admin: AdminAccount): string {
  if (admin.operatorName?.trim()) return admin.operatorName.trim();
  const code = getAdminOperator(admin);
  if (code && isLegacyOperator(code)) return OPERATOR_REPORT_BRAND[code].companyName;
  if (code) return `${code} Transport`;
  return "HQ command center";
}

/** Accent colour for HQ UI — platform brand colour or VIP/STC fallback. */
export function getAdminAccentColor(admin: AdminAccount): string {
  if (admin.brandColor?.trim()) return admin.brandColor.trim();
  const code = getAdminOperator(admin);
  if (code && isLegacyOperator(code)) return OPERATOR_ACCENT[code];
  return "#334155";
}
