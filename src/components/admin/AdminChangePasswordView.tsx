"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AdminAuthBrandPanel } from "@/components/admin/AdminAuthBrandPanel";
import { AdminAuthField } from "@/components/admin/AdminAuthField";
import { Logo } from "@/components/brand/Logo";
import { changeAdminPasswordApi } from "@/lib/admin-api";
import { restoreAdminSession, saveAdminSession, signOutAdmin } from "@/lib/admin-auth";
import { queuePortalWelcome } from "@/lib/operator-portal-welcome";
import { showInfoAlert, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import type { AdminSession } from "@/types/admin";

export function AdminChangePasswordView() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
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
      const current = await restoreAdminSession();
      if (cancelled) return;
      if (!current) {
        router.replace("/admin/login");
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
      await signOutAdmin();
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
      });
      router.replace("/admin/login");
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;

    if (!currentPassword) {
      await showValidationAlert({
        title: "Current password required",
        text: "Enter your temporary password from Parcela.",
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
      const result = await changeAdminPasswordApi({
        currentPassword,
        newPassword,
      });
      saveAdminSession({
        ...session,
        admin: { ...session.admin, ...result.admin, mustChangePassword: false },
      });
      queuePortalWelcome("admin", session.admin.id);
      await showSuccessAlert({
        title: "Password updated",
        text: result.message,
        confirmText: "Open HQ dashboard",
      });
      router.replace("/admin/dashboard");
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
    return <div className="admin-portal min-h-dvh bg-[#e8ecf1]" aria-hidden />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e8ecf1] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex min-h-[720px] w-full max-w-[1040px] flex-row overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_28px_72px_-20px_rgb(15_23_42_/_0.22)]">
        <aside className="hidden w-[48%] shrink-0 border-r border-[#e2e8f0] bg-white lg:block">
          <AdminAuthBrandPanel />
        </aside>

        <section
          className="relative flex min-h-[720px] flex-1 flex-col justify-center overflow-hidden px-10 py-14 text-white lg:px-14 lg:py-16"
          style={{
            background: "linear-gradient(155deg, #0f172a 0%, #1e293b 48%, #0f172a 100%)",
          }}
        >
          <div className="relative mx-auto w-full max-w-[400px]">
            <div className="flex flex-col items-center text-center">
              <Logo
                size="lg"
                className="justify-center [&_span]:text-white [&_img]:brightness-0 [&_img]:invert"
              />
              <h2 className="font-display mt-5 text-xl font-bold tracking-tight text-white">
                Set your password
              </h2>
              <p className="font-body mt-2 text-sm text-white/80">
                Signed in as {session.admin.displayName}. Replace your temporary HQ password before
                continuing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <AdminAuthField
                id="admin-change-email"
                label="HQ email"
                type="email"
                value={session.admin.email}
                onChange={() => undefined}
                placeholder="hq@transport.com"
                icon={Mail}
                autoComplete="username"
                readOnly
              />

              <AdminAuthField
                id="admin-change-current-password"
                label="Temporary password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="From Parcela onboarding"
                icon={Lock}
                autoComplete="current-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-white/80 hover:text-white"
                  >
                    {showCurrent ? "hide" : "show"}
                  </button>
                }
              />

              <AdminAuthField
                id="admin-change-new-password"
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
                    className="font-body rounded-lg px-2 py-1 text-xs font-medium text-white/80 hover:text-white"
                  >
                    {showNew ? "hide" : "show"}
                  </button>
                }
              />

              <AdminAuthField
                id="admin-change-confirm-password"
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
                className="font-display w-full min-h-[52px] rounded-xl bg-white text-sm font-bold uppercase tracking-wider text-[#0f172a] shadow-sm transition-colors hover:bg-white/95 disabled:opacity-60"
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </button>
            </form>

            <p className="font-body mt-6 text-center text-sm text-white/75">
              Wrong account?{" "}
              <Link href="/admin/login" className="font-semibold text-white hover:underline">
                Sign in again
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
