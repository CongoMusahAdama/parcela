"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PlatformAuthBrandPanel } from "@/components/platform/PlatformAuthBrandPanel";
import { PlatformAuthField } from "@/components/platform/PlatformAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import {
  PLATFORM_DEMO_EMAIL,
  formatPlatformServerDate,
  getPlatformLoginFailureMessage,
  signInPlatform,
  validatePlatformLoginInput,
} from "@/lib/platform-auth";
import { platformThemeStyle } from "@/lib/platform-theme";
import { showValidationAlert } from "@/lib/sweetalert";

export function PlatformLoginView() {
  const router = useRouter();
  const ready = useClientReady();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch("/platform/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validatePlatformLoginInput(email, password);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInPlatform(email, password);
      router.replace("/platform/dashboard");
    } catch (error) {
      await showValidationAlert({
        title: "Unable to sign in",
        text: getPlatformLoginFailureMessage(error),
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-3 py-4 sm:px-6 sm:py-6"
      style={{ ...platformThemeStyle(), background: "#f5f5f4" }}
    >
      <div className="flex min-h-[720px] w-full max-w-[1040px] flex-row overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_28px_72px_-20px_rgb(28_25_23_/_0.18)]">
        <aside className="w-[48%] shrink-0 border-r border-stone-200 bg-white">
          <PlatformAuthBrandPanel />
        </aside>

        <section className="relative flex min-h-[720px] flex-1 flex-col justify-center overflow-hidden bg-white px-10 py-14 lg:px-14 lg:py-16">
          <div className="relative mx-auto w-full max-w-[400px]">
            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center" />
              <p
                className="font-display mt-4 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--platform-orange)" }}
              >
                Platform access
              </p>
              <h2 className="font-display mt-2 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                Sign in to Parcela
              </h2>
              <p className="font-body mt-2 text-xs text-stone-500 sm:text-sm">
                {ready ? formatPlatformServerDate() : "\u00a0"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <PlatformAuthField
                id="platform-email"
                label="Work email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@parcela.app"
                icon={Mail}
                autoComplete="username"
              />
              <PlatformAuthField
                id="platform-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                icon={Lock}
                autoComplete="current-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:text-stone-900"
                  >
                    {showPassword ? "hide" : "show"}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-display mt-1 w-full min-h-[52px] rounded-xl text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_rgb(253_126_20_/_0.32)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--platform-orange)" }}
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="font-body mt-4 text-center text-xs leading-relaxed text-stone-500">
              Internal Parcela staff only. Configure transport services and hand HQ logins from
              here — not the operator HQ portal.
            </p>

            <p className="font-body mt-4 text-center text-[10px] leading-relaxed text-stone-400">
              © {ready ? new Date().getFullYear() : 2026} Parcela · Platform
            </p>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-3">
                <p className="font-display text-center text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  UI preview
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(PLATFORM_DEMO_EMAIL);
                    const demo = process.env.NEXT_PUBLIC_PLATFORM_DEMO_PASSWORD?.trim() ?? "";
                    if (demo) setPassword(demo);
                  }}
                  className="font-body mt-2 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-left text-[10px] text-stone-600 transition-colors hover:border-[var(--platform-orange)]/40 hover:text-stone-900"
                >
                  <span className="font-semibold text-stone-900">Fill demo email</span>
                  <span className="mt-0.5 block font-mono text-stone-500">
                    {PLATFORM_DEMO_EMAIL}
                    {process.env.NEXT_PUBLIC_PLATFORM_DEMO_PASSWORD
                      ? " · password from env"
                      : " · any 8+ char password works in UI mode"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
