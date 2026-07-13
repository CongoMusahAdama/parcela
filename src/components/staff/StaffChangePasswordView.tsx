"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { StaffAuthBrandPanel } from "@/components/staff/StaffAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { changeStaffPasswordApi } from "@/lib/staff-api";
import { restoreStaffSession, saveStaffSession, signOutStaff } from "@/lib/staff-auth";
import { showInfoAlert, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import type { StaffSession } from "@/types/staff";

export function StaffChangePasswordView() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const current = await restoreStaffSession();
      if (cancelled) return;
      if (!current) {
        router.replace("/staff/login");
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
      await signOutStaff();
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
      });
      router.replace("/staff/login");
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;

    if (!currentPassword) {
      await showValidationAlert({
        title: "Current password required",
        text: "Enter your temporary password (or current password).",
      });
      return;
    }

    if (newPassword.length < 8) {
      await showValidationAlert({
        title: "Password too short",
        text: "Choose a new password with at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      await showValidationAlert({
        title: "Passwords do not match",
        text: "Re-enter your new password to confirm it.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeStaffPasswordApi({
        currentPassword,
        newPassword,
      });
      saveStaffSession({
        ...session,
        staff: { ...session.staff, mustChangePassword: false },
      });
      await showSuccessAlert({
        title: "Password updated",
        text: result.message,
        confirmText: "Open counter portal",
      });
      router.replace("/staff/dashboard");
    } catch (err) {
      await showValidationAlert({
        title: "Could not update password",
        text: err instanceof Error ? err.message : "Check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready || !session) {
    return <div className="staff-portal min-h-dvh bg-[#eef2f6]" aria-hidden />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-[960px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.18)] lg:min-h-[620px] lg:flex-row">
        <aside className="hidden lg:block lg:w-[44%] lg:shrink-0">
          <StaffAuthBrandPanel />
        </aside>

        <section className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-6 flex justify-center lg:hidden">
              <Image
                src="/Auth.jpg"
                alt=""
                width={320}
                height={320}
                priority
                className="h-36 w-auto object-contain"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center" />
              <h2 className="font-display mt-5 text-xl font-bold tracking-tight text-foreground">
                Set your password
              </h2>
              <p className="font-body mt-2 text-sm text-muted">
                Signed in as {session.staff.email}. Enter your temporary password, then choose a
                private password for your counter account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <StaffAuthField
                id="change-email"
                label="Staff email"
                type="email"
                value={session.staff.email}
                onChange={() => undefined}
                placeholder="you@parcela.staff"
                icon={Mail}
                autoComplete="username"
                readOnly
              />

              <StaffAuthField
                id="change-current-password"
                label="Temporary password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="From your SMS"
                icon={Lock}
                autoComplete="current-password"
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
                id="change-new-password"
                label="New password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 8 characters"
                icon={Lock}
                autoComplete="new-password"
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
                id="change-confirm-password"
                label="Confirm new password"
                type={showNew ? "text" : "password"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat new password"
                icon={Lock}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="font-display w-full min-h-[52px] rounded-xl bg-[#0D9488] text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#0f766e] disabled:opacity-60"
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </button>
            </form>

            <p className="font-body mt-6 text-center text-sm text-muted">
              Wrong account?{" "}
              <Link href="/staff/login" className="font-semibold text-[#0D9488] hover:underline">
                Sign in again
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
