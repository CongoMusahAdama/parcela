import type { CSSProperties } from "react";
import type { OperatorStaffTheme } from "@/lib/operator-theme";

const DEFAULT_AUTH_ACCENT = "#1e3a5f";

function normalizeHex(hex: string): string | null {
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  return match ? `#${match[1].toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(Math.max(0, Math.min(255, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(...rgb.map((channel) => channel * (1 - amount)) as [number, number, number]);
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    ...rgb.map((channel) => channel + (255 - channel) * amount) as [number, number, number],
  );
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = rgb.map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** Parse #RRGGBB into an RGB tuple for PDF / print accents. */
export function hexToRgbTuple(hex: string): [number, number, number] {
  return hexToRgb(hex) ?? [30, 58, 95];
}

/** Detect PNG vs JPEG for jsPDF addImage (supports data URLs and file paths). */
export function logoImageFormat(src: string): "PNG" | "JPEG" {
  const lower = src.toLowerCase();
  if (
    lower.startsWith("data:image/jpeg") ||
    lower.startsWith("data:image/jpg") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg")
  ) {
    return "JPEG";
  }
  return "PNG";
}

/** Build staff-portal CSS theme tokens from an operator brand hex colour. */
export function brandColorStaffTheme(hex: string): OperatorStaffTheme {
  const accent = normalizeHex(hex) ?? "#fd7e14";
  const accentDark = darken(accent, 0.28);
  const accentLight = lighten(accent, 0.18);
  const rgb = hexToRgb(accent) ?? [253, 126, 20];
  const accentMuted = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / 0.12)`;
  const deepest = darken(accentDark, 0.18);

  return {
    accent,
    accentDark,
    accentLight,
    accentMuted,
    headerGradient: `linear-gradient(155deg, ${accent} 0%, ${accentDark} 52%, ${deepest} 100%)`,
  };
}

export function brandColorHeroGradient(hex: string): string {
  const theme = brandColorStaffTheme(hex);
  return `linear-gradient(135deg, ${theme.accentDark} 0%, ${theme.accent} 45%, ${theme.accentLight} 100%)`;
}

/**
 * Dark brand-tinted panel for auth shells — keeps white text readable
 * while still showing the operator colour (not a muddy brown wash).
 */
export function brandColorAuthPanelGradient(hex: string): string {
  const accent = normalizeHex(hex) ?? DEFAULT_AUTH_ACCENT;
  const mid = darken(accent, 0.2);
  const deep = darken(accent, 0.4);
  const deepest = darken(accent, 0.58);
  return `linear-gradient(155deg, ${mid} 0%, ${deep} 52%, ${deepest} 100%)`;
}

/**
 * Exact configured transport brand colour (or Parcela default).
 * Title, links, and buttons all use this same hex so left-side accents match.
 */
export function brandColorAuthAccent(hex: string | null | undefined): string {
  const raw = hex?.trim() ? normalizeHex(hex) : null;
  return raw ?? DEFAULT_AUTH_ACCENT;
}

/** Fill colour for primary CTAs — same as accent unless too light for white text. */
function brandColorAuthButtonFill(hex?: string | null): string {
  const accent = brandColorAuthAccent(hex);
  // Only nudge very light brands so white button labels stay readable.
  return relativeLuminance(accent) > 0.62 ? darken(accent, 0.18) : accent;
}

/** Primary CTA button fill from configured transport brand. */
export function brandColorAuthButtonStyle(hex?: string | null): CSSProperties {
  const fill = brandColorAuthButtonFill(hex);
  const tip = lighten(fill, 0.04);
  const rgb = hexToRgb(fill) ?? [30, 58, 95];
  return {
    background: `linear-gradient(180deg, ${tip} 0%, ${fill} 55%, ${fill} 100%)`,
    boxShadow: `0 12px 28px rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / 0.32)`,
  };
}

/** Headline uses the same solid brand colour as the primary button. */
export function brandColorAuthTitleStyle(hex?: string | null): CSSProperties {
  return {
    color: brandColorAuthButtonFill(hex),
  };
}

