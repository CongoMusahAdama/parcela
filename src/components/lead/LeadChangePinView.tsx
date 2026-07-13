"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LeadAuthBrandPanel } from "@/components/lead/LeadAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { changeLeadPinApi } from "@/lib/lead-api";
import { restoreLeadSession, saveLeadSession, signOutLead } from "@/lib/lead-auth";
import { showInfoAlert, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import type { LeadSession } from "@/types/lead";

export function LeadChangePinView() {
  const router = useRouter();
  const [session, setSession] = useState<LeadSession | null>(null);
  const [ready, setReady] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const current = await restoreLeadSession();
      if (cancelled) return;
      if (!current) {
        router.replace("/lead/login");
        return;
      }
      setSession(current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useInactivityLogout({
    enabled: ready && Boolean(session),
    onIdle: async () => {
      await signOutLead();
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
      });
      router.replace("/lead/login");
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;

    if (!currentPin.trim()) {
      await showValidationAlert({
        title: "Temporary PIN required",
        text: "Enter the PIN from your SMS.",
      });
      return;
    }

    if (newPin.trim().length < 4) {
      await showValidationAlert({
        title: "PIN too short",
        text: "Choose a new PIN with at least 4 characters.",
      });
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      await showValidationAlert({
        title: "PINs do not match",
        text: "Re-enter your new PIN to confirm it.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeLeadPinApi({
        currentPin: currentPin.trim(),
        newPin: newPin.trim(),
      });
      saveLeadSession({
        ...session,
        staff: { ...session.staff, mustChangePassword: false },
      });
      await showSuccessAlert({
        title: "PIN updated",
        text: result.message,
        confirmText: "Open dashboard",
      });
      router.replace("/lead/dashboard");
    } catch (err) {
      await showValidationAlert({
        title: "Could not update PIN",
        text: err instanceof Error ? err.message : "Check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready || !session) {
    return <div className="lead-portal min-h-dvh bg-[#eef2f6]" aria-hidden />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.18)] lg:flex-row">
        <aside className="hidden border-r border-border/60 bg-white lg:block lg:w-[42%] lg:shrink-0">
          <LeadAuthBrandPanel />
        </aside>

        <section className="flex flex-1 flex-col justify-center bg-[#0D9488] px-5 py-6 text-white sm:px-10 sm:py-7 lg:px-12 lg:py-8">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center [&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
              <h2 className="font-display mt-3 text-lg font-bold tracking-tight text-white sm:text-xl">
                Set your PIN
              </h2>
              <p className="font-body mt-1 text-xs text-white/85 sm:text-sm">
                Signed in as {session.staff.displayName} · {session.staff.stationName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <StaffAuthField
                id="lead-change-phone"
                label="Phone number"
                type="tel"
                value={session.staff.phone ?? ""}
                onChange={() => undefined}
                placeholder="0531878243"
                icon={Phone}
                autoComplete="tel"
                readOnly
                variant="onAccent"
              />

              <StaffAuthField
                id="lead-change-current-pin"
                label="Temporary PIN"
                type={showCurrent ? "text" : "password"}
                value={currentPin}
                onChange={setCurrentPin}
                placeholder="From your SMS"
                icon={KeyRound}
                autoComplete="current-password"
                variant="onAccent"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
                  >
                    {showCurrent ? "hide" : "show"}
                  </button>
                }
              />

              <StaffAuthField
                id="lead-change-new-pin"
                label="New PIN"
                type={showNew ? "text" : "password"}
                value={newPin}
                onChange={setNewPin}
                placeholder="At least 4 characters"
                icon={KeyRound}
                autoComplete="new-password"
                variant="onAccent"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
                  >
                    {showNew ? "hide" : "show"}
                  </button>
                }
              />

              <StaffAuthField
                id="lead-change-confirm-pin"
                label="Confirm new PIN"
                type={showNew ? "text" : "password"}
                value={confirmPin}
                onChange={setConfirmPin}
                placeholder="Repeat new PIN"
                icon={KeyRound}
                autoComplete="new-password"
                variant="onAccent"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-display w-full min-h-[48px] rounded-xl border border-white/80 bg-white text-sm font-bold uppercase tracking-wider text-[#0D9488] shadow-[0_6px_20px_rgb(0_0_0_/_0.15)] transition-colors hover:bg-[#f8fffe] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Updating…" : "Update PIN"}
              </button>
            </form>

            <p className="font-body mt-4 text-center text-sm text-white/80">
              Wrong account?{" "}
              <Link href="/lead/login" className="font-semibold text-white hover:underline">
                Sign in again
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
