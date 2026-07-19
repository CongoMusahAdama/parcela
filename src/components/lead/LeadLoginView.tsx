"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Phone } from "lucide-react";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Logo } from "@/components/brand/Logo";
import { LeadAuthBrandPanel } from "@/components/lead/LeadAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import { formatStaffServerDate } from "@/lib/staff-auth";
import { getLeadLoginFailureMessage, signInLead, validateLeadLoginInput } from "@/lib/lead-auth";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { LeadSession } from "@/types/lead";

export function LeadLoginView() {
  const router = useRouter();
  const ready = useClientReady();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function completeSignIn(session: LeadSession) {
    if (session.staff.mustChangePassword) {
      await showSuccessAlert({
        title: "Temporary PIN active",
        text: "Please set a new PIN before using the branch lead portal.",
        confirmText: "Set PIN",
      });
      router.push("/lead/change-pin");
      return;
    }

    await showSuccessAlert({
      title: "Signed in successfully",
      text: `Welcome, ${session.staff.displayName}. You are leading ${session.staff.stationName}.`,
      confirmText: "Go to dashboard",
    });
    router.push("/lead/dashboard");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateLeadLoginInput(phone, pin);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signInLead(phone, pin);
      await completeSignIn(session);
    } catch (err) {
      await showValidationAlert({
        title: "Unable to sign in",
        text: getLeadLoginFailureMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.18)] lg:flex-row">
        <aside className="hidden border-r border-border/60 bg-white lg:block lg:w-[42%] lg:shrink-0">
          <LeadAuthBrandPanel />
        </aside>

        <section className="flex flex-1 flex-col justify-center bg-[#0D9488] px-5 py-6 text-white sm:px-10 sm:py-7 lg:px-12 lg:py-8">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-4 flex justify-center bg-transparent lg:hidden">
              <AuthIllustration
                priority
                className="w-full max-w-[200px] [&_img]:max-h-[120px]"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center [&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
              <h2 className="font-display mt-3 text-lg font-bold tracking-tight text-white sm:text-xl">
                Login into account
              </h2>
              <p className="font-body mt-1 text-xs text-white/85 sm:text-sm">
                Server date:{" "}
                <span className="font-semibold text-white">
                  {ready ? formatStaffServerDate() : "\u00a0"}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <StaffAuthField
                id="lead-phone"
                label="Phone number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="0531878243"
                icon={Phone}
                autoComplete="tel"
                variant="onAccent"
              />

              <StaffAuthField
                id="lead-pin"
                label="PIN"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={setPin}
                placeholder="Enter your PIN"
                icon={KeyRound}
                autoComplete="current-password"
                variant="onAccent"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
                  >
                    {showPin ? "hide" : "show"}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-display w-full min-h-[48px] rounded-xl border border-white/80 bg-white text-sm font-bold uppercase tracking-wider text-[#0D9488] shadow-[0_6px_20px_rgb(0_0_0_/_0.15)] transition-colors hover:bg-[#f8fffe] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="font-body mt-3 text-center text-xs text-white/80">
              Access is limited to your assigned branch. HQ-created leads use the phone and PIN from
              Branch leads → Send login.
            </p>

            <p className="font-body mt-4 text-center text-[10px] leading-relaxed text-white/70">
              © {ready ? new Date().getFullYear() : 2026} Parcela · Branch lead dashboard
              <br />
              support@parcela.app
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
