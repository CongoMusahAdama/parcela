import type { Operator } from "@/types/parcel";
import { operatorStaffThemeStyle } from "@/lib/operator-theme";

/** Neutral HQ theme before transport setup is complete. */
export const ADMIN_NEUTRAL_THEME = {
  accent: "#334155",
  accentDark: "#0f172a",
  accentLight: "#64748b",
  accentMuted: "rgb(15 23 42 / 0.08)",
  headerGradient: "linear-gradient(155deg, #0f172a 0%, #1e293b 48%, #0f172a 100%)",
} as const;

export function adminThemeStyle(
  operator: Operator | null,
  operatorConfigured: boolean,
): React.CSSProperties {
  if (operatorConfigured && operator) {
    return operatorStaffThemeStyle(operator);
  }

  return {
    "--staff-accent": ADMIN_NEUTRAL_THEME.accent,
    "--staff-accent-dark": ADMIN_NEUTRAL_THEME.accentDark,
    "--staff-accent-light": ADMIN_NEUTRAL_THEME.accentLight,
    "--staff-accent-muted": ADMIN_NEUTRAL_THEME.accentMuted,
    "--staff-header-gradient": ADMIN_NEUTRAL_THEME.headerGradient,
  } as React.CSSProperties;
}
