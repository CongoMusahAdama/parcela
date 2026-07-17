"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Logo } from "@/components/brand/Logo";
import { StaffAuthBrandPanel } from "@/components/staff/StaffAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { Button } from "@/components/ui/Button";
import {
  formatStaffServerDate,
  getStaffLoginFailureMessage,
  signInStaff,
  validateStaffLoginInput,
} from "@/lib/staff-auth";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { StaffSession } from "@/types/staff";

export function StaffLoginView() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function completeSignIn(session: StaffSession) {
    if (session.staff.mustChangePassword) {
      await showSuccessAlert({
        title: "Temporary password active",
        text: "Please set a new password before using the counter portal.",
        confirmText: "Set password",
      });
      router.push("/staff/change-password");
      return;
    }

    await showSuccessAlert({
      title: "Signed in successfully",
      text: `Welcome, ${session.staff.displayName}. You are signed in to ${session.staff.stationName}.`,
      confirmText: "Go to dashboard",
    });
    router.push("/staff/dashboard");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateStaffLoginInput(phone, password);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signInStaff(phone.trim(), password);
      await completeSignIn(session);
    } catch (err) {
      await showValidationAlert({
        title: "Unable to sign in",
        text: getStaffLoginFailureMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.18)] lg:flex-row">
        <aside className="hidden lg:block lg:w-[42%] lg:shrink-0">
          <StaffAuthBrandPanel />
        </aside>

        <section className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-10 sm:py-7 lg:px-12 lg:py-8">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-4 flex justify-center bg-transparent lg:hidden">
              <AuthIllustration
                priority
                className="w-full max-w-[200px] [&_img]:max-h-[120px]"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center" />
              <h2 className="font-display mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Login into account
              </h2>
              <p className="font-body mt-1 text-xs text-muted sm:text-sm">
                Server date:{" "}
                <span className="font-semibold text-primary">{formatStaffServerDate()}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <StaffAuthField
                id="staff-phone"
                label="Phone number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="0531878243"
                icon={Phone}
                autoComplete="tel"
              />

              <StaffAuthField
                id="staff-password"
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
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
                  >
                    {showPassword ? "hide" : "show"}
                  </button>
                }
              />

              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                variant="primary"
                className="!min-h-[48px] !rounded-xl !bg-[#0D9488] !font-display !text-sm font-bold uppercase tracking-wider hover:!bg-[#0f766e]"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>

              <p className="font-body text-center text-xs sm:text-sm">
                <Link href="/staff/change-password" className="font-semibold text-[#0D9488] hover:underline">
                  Set or change your password
                </Link>
              </p>
            </form>

            <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
              <p className="font-body text-[11px] leading-relaxed text-muted sm:text-xs">
                <span className="font-semibold text-foreground">Station-scoped access.</span> You
                will only see parcels for your assigned terminal.{" "}
                <a
                  href="mailto:support@parcela.app"
                  className="font-semibold text-[#0D9488] hover:underline"
                >
                  Contact support
                </a>
              </p>
            </div>

            <p className="font-body mt-4 text-center text-[10px] leading-relaxed text-muted">
              © {new Date().getFullYear()} Parcela · Staff operations dashboard
              <br />
              support@parcela.app
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
