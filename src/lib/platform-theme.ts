import type { CSSProperties } from "react";

/** Parcela platform admin — deep blue-black command-center theme. */
export const PLATFORM_THEME = {
  orange: "#1e3a5f",
  orangeDark: "#152238",
  orangeDeep: "#0d1525",
  orangeLight: "#64748b",
  orangeMuted: "rgba(30 58 95 / 0.12)",
  orangeSoft: "#eef2f7",
  white: "#ffffff",
  ink: "#1c1917",
  muted: "#78716c",
  border: "#ebebeb",
  canvas: "#fafaf9",
  headerGradient: "linear-gradient(155deg, #1e3a5f 0%, #152238 55%, #0d1525 100%)",
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
