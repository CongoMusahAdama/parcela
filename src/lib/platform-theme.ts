import type { CSSProperties } from "react";

/** Parcela platform admin — Brand Blue Theme. */
export const PLATFORM_THEME = {
  orange: "#10367D",
  orangeDark: "#0c285d",
  orangeDeep: "#081d43",
  orangeLight: "#a5ce00",
  orangeMuted: "rgba(165, 206, 0, 0.15)",
  orangeSoft: "#f4f8e6",
  white: "#ffffff",
  ink: "#1c1917",
  muted: "#78716c",
  border: "#ebebeb",
  canvas: "#fafaf9",
  headerGradient: "linear-gradient(155deg, #10367D 0%, #0c285d 55%, #081d43 100%)",
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
