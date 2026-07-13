import type { Operator } from "@/types/parcel";
import { isSupportedOperator } from "@/lib/operators";

/** Sender / receiver mobile brand green — shared with STC staff portal */
export const PARCELA_MOBILE_GREEN = {
  accent: "#0D9488",
  accentDark: "#0F766E",
  accentLight: "#14B8A6",
  accentMuted: "rgb(13 148 136 / 0.12)",
  headerGradient: "linear-gradient(145deg, #0D9488 0%, #0F766E 52%, #115E59 100%)",
} as const;

export type OperatorStaffTheme = {
  accent: string;
  accentDark: string;
  accentLight: string;
  accentMuted: string;
  headerGradient: string;
};

export const OPERATOR_STAFF_THEME: Record<Operator, OperatorStaffTheme> = {
  VIP: {
    accent: "#DC2626",
    accentDark: "#B91C1C",
    accentLight: "#EF4444",
    accentMuted: "rgb(220 38 38 / 0.1)",
    headerGradient: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
  },
  STC: {
    accent: PARCELA_MOBILE_GREEN.accent,
    accentDark: PARCELA_MOBILE_GREEN.accentDark,
    accentLight: PARCELA_MOBILE_GREEN.accentLight,
    accentMuted: PARCELA_MOBILE_GREEN.accentMuted,
    headerGradient: PARCELA_MOBILE_GREEN.headerGradient,
  },
};

export function getOperatorStaffTheme(operator: string): OperatorStaffTheme {
  if (isSupportedOperator(operator)) {
    return OPERATOR_STAFF_THEME[operator];
  }
  return PARCELA_MOBILE_GREEN;
}

export function operatorStaffThemeStyle(operator: string): React.CSSProperties {
  const theme = getOperatorStaffTheme(operator);
  return {
    "--staff-accent": theme.accent,
    "--staff-accent-dark": theme.accentDark,
    "--staff-accent-light": theme.accentLight,
    "--staff-accent-muted": theme.accentMuted,
    "--staff-header-gradient": theme.headerGradient,
  } as React.CSSProperties;
}
