"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AdminAuthBrandPanel } from "@/components/admin/AdminAuthBrandPanel";
import { AdminAuthField } from "@/components/admin/AdminAuthField";
import { Logo } from "@/components/brand/Logo";
import {
  formatAdminServerDate,
  getAdminLoginFailureMessage,
  signInAdmin,
  validateAdminLoginInput,
} from "@/lib/admin-auth";
import { showValidationAlert } from "@/lib/sweetalert";

export function AdminLoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch("/admin/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateAdminLoginInput(email, password);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInAdmin(email, password);
      router.replace("/admin/dashboard");
    } catch (error) {
      await showValidationAlert({
        title: "Unable to sign in",
        text: getAdminLoginFailureMessage(error),
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8ecf1] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex min-h-[720px] w-full max-w-[1040px] flex-row overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_28px_72px_-20px_rgb(15_23_42_/_0.22)]">
        <aside className="w-[48%] shrink-0 border-r border-[#e2e8f0] bg-white">
          <AdminAuthBrandPanel />
        </aside>

        <section
          className="relative flex min-h-[720px] flex-1 flex-col justify-center overflow-hidden px-10 py-14 text-white lg:px-14 lg:py-16"
          style={{
            background:
              "linear-gradient(155deg, #0f172a 0%, #1e293b 48%, #0f172a 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 85% 15%, rgb(255 255 255 / 0.08), transparent 60%)",
            }}
          />

          <div className="relative mx-auto w-full max-w-[400px]">
            <div className="flex flex-col items-center text-center">
              <Logo
                size="lg"
                className="justify-center [&_span]:text-white [&_img]:brightness-0 [&_img]:invert"
              />
              <p className="font-display mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
                Headquarters access
              </p>
              <h2 className="font-display mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Sign in to HQ
              </h2>
              <p className="font-body mt-2 text-xs text-white/65 sm:text-sm">
                {formatAdminServerDate()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <AdminAuthField
                id="admin-email"
                label="Work email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                icon={Mail}
                autoComplete="username"
              />

              <AdminAuthField
                id="admin-password"
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
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
                  >
                    {showPassword ? "hide" : "show"}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-display mt-1 w-full min-h-[52px] rounded-xl bg-white text-sm font-bold uppercase tracking-wider text-[#0f172a] shadow-[0_8px_24px_rgb(0_0_0_/_0.25)] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="font-body mt-4 text-center text-xs leading-relaxed text-white/60">
              Provisioned access only. Configure your transport after sign-in — your dashboard
              adopts your operator branding.
            </p>

            <p className="font-body mt-4 text-center text-[10px] leading-relaxed text-white/45">
              Forgot password? Contact Parcela support.
              <br />© {new Date().getFullYear()} Parcela · HQ dashboard
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
