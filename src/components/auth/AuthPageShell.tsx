"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export type AuthPageVariant = "hq" | "operator";

type AuthPageShellProps = {
  variant: AuthPageVariant;
  /** Logo / company mark — pinned top-left, clear of illustration faces. */
  brandMark?: ReactNode;
  /** Headline and feature copy — anchored toward the bottom. */
  hero: ReactNode;
  children?: ReactNode;
  banner?: ReactNode;
  loading?: boolean;
  heroAccentColor?: string | null;
};

function heroOverlayStyle(variant: AuthPageVariant, accentColor?: string | null): string {
  const base =
    variant === "hq"
      ? "linear-gradient(160deg, rgb(15 23 42 / 0.88) 0%, rgb(15 23 42 / 0.72) 42%, rgb(15 23 42 / 0.45) 62%, rgb(15 23 42 / 0.78) 100%)"
      : "linear-gradient(160deg, rgb(13 148 136 / 0.9) 0%, rgb(15 118 110 / 0.75) 42%, rgb(13 148 136 / 0.4) 62%, rgb(15 118 110 / 0.82) 100%)";

  if (accentColor?.trim()) {
    const rgb = accentColor.trim();
    return `linear-gradient(160deg, color-mix(in srgb, ${rgb} 92%, black) 0%, color-mix(in srgb, ${rgb} 70%, black) 45%, color-mix(in srgb, ${rgb} 38%, black) 62%, color-mix(in srgb, ${rgb} 82%, black) 100%)`;
  }
  return base;
}

function AuthHeroSide({
  variant,
  brandMark,
  hero,
  heroAccentColor,
}: {
  variant: AuthPageVariant;
  brandMark?: ReactNode;
  hero: ReactNode;
  heroAccentColor?: string | null;
}) {
  return (
    <aside className="auth-hero-panel relative flex min-h-[280px] flex-col overflow-hidden sm:min-h-[340px] lg:absolute lg:inset-y-0 lg:left-0 lg:min-h-dvh lg:w-[58vw]">
      <Image
        src="/sender.png"
        alt=""
        fill
        priority
        unoptimized
        className="auth-hero-bg object-cover"
        sizes="(max-width: 1024px) 100vw, 58vw"
      />
      <div
        className="absolute inset-0"
        style={{ background: heroOverlayStyle(variant, heroAccentColor) }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-full flex-1 flex-col px-6 py-6 sm:px-10 sm:py-8 lg:min-h-dvh lg:px-12 lg:py-10 xl:px-16 xl:py-12">
        {brandMark ? (
          <div className="auth-enter-brand shrink-0 self-start">{brandMark}</div>
        ) : null}

        {/* Keep illustration faces visible in the middle band */}
        <div
          className="pointer-events-none min-h-[5.5rem] flex-1 sm:min-h-[7rem] lg:min-h-[11rem]"
          aria-hidden
        />

        <div className="auth-enter-copy mt-auto w-full max-w-xl pb-1">{hero}</div>
      </div>
    </aside>
  );
}

function AuthFormSide({
  banner,
  children,
  loading = false,
}: {
  banner?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
}) {
  return (
    <main className="auth-form-panel auth-enter-form relative z-10 flex flex-1 flex-col bg-white lg:absolute lg:inset-y-0 lg:right-0 lg:min-h-dvh">
      {banner ? (
        <div className="border-b border-[#e2e8f0] px-6 py-4 sm:px-10">{banner}</div>
      ) : null}

      <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
        {loading ? (
          <p className="font-body text-sm text-[#64748b]">Checking session…</p>
        ) : (
          <div className="auth-enter-form-inner w-full max-w-[420px]">{children}</div>
        )}
      </div>
    </main>
  );
}

export function AuthPageShell({
  variant,
  brandMark,
  hero,
  children,
  banner,
  loading = false,
  heroAccentColor,
}: AuthPageShellProps) {
  return (
    <div className="auth-split relative flex min-h-dvh flex-col bg-white lg:block lg:overflow-hidden">
      <AuthHeroSide
        variant={variant}
        brandMark={brandMark}
        hero={hero}
        heroAccentColor={heroAccentColor}
      />
      <AuthFormSide banner={banner} loading={loading}>
        {children}
      </AuthFormSide>
    </div>
  );
}
