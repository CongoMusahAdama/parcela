import type { OperatorStaffTheme } from "@/lib/operator-theme";

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
