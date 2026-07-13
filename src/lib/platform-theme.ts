import type { CSSProperties } from "react";

/** Parcela platform admin — black command-center theme. */
export const PLATFORM_THEME = {
  orange: "#0a0a0a",
  orangeDark: "#000000",
  orangeDeep: "#000000",
  orangeLight: "#525252",
  orangeMuted: "rgba(10 10 10 / 0.1)",
  orangeSoft: "#f5f5f5",
  white: "#ffffff",
  ink: "#1c1917",
  muted: "#78716c",
  border: "#ebebeb",
  canvas: "#fafaf9",
  headerGradient: "linear-gradient(155deg, #0a0a0a 0%, #171717 55%, #000000 100%)",
} as const;

export function platformThemeStyle(): CSSProperties {
  return {
    "--platform-orange": PLATFORM_THEME.orange,
    "--platform-orange-dark": PLATFORM_THEME.orangeDark,
    "--platform-orange-deep": PLATFORM_THEME.orangeDeep,
    "--platform-orange-light": PLATFORM_THEME.orangeLight,
    "--platform-orange-muted": PLATFORM_THEME.orangeMuted,
    "--platform-orange-soft": PLATFORM_THEME.orangeSoft,
    "--platform-ink": PLATFORM_THEME.ink,
    "--platform-muted": PLATFORM_THEME.muted,
    "--platform-border": PLATFORM_THEME.border,
    "--platform-canvas": PLATFORM_THEME.canvas,
    "--platform-header-gradient": PLATFORM_THEME.headerGradient,
    "--staff-accent": PLATFORM_THEME.orange,
    "--staff-accent-dark": PLATFORM_THEME.orangeDark,
    "--staff-accent-light": PLATFORM_THEME.orangeLight,
    "--staff-accent-muted": PLATFORM_THEME.orangeMuted,
    "--staff-header-gradient": PLATFORM_THEME.headerGradient,
  } as CSSProperties;
}
