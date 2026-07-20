"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { OperatorPortalAuthShell } from "@/components/operator/OperatorPortalAuthShell";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { changeAdminPasswordApi } from "@/lib/admin-api";
import { restoreAdminSession, saveAdminSession, signOutAdmin } from "@/lib/admin-auth";
import { useLoginOperatorBrand, type LoginOperatorBrand } from "@/lib/login-brand";
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
  const {
    brand: companyBrand,
    loading: brandLoading,
    applyBrand,
  } = useLoginOperatorBrand("", "hq");

  async function handleTransportConfigured(
    _name: string,
    nextBrand: LoginOperatorBrand | null,
  ) {
    applyBrand(nextBrand);
  }

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
      if (current.admin.operator || current.admin.logoDataUrl || current.admin.operatorName) {
        applyBrand({
          found: true,
          operatorCode: current.admin.operator ?? undefined,
          operatorName: current.admin.operatorName ?? current.admin.operator ?? undefined,
          brandColor: current.admin.brandColor ?? undefined,
          logoDataUrl: current.admin.logoDataUrl ?? null,
          stationName: null,
        });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, applyBrand]);

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

  return (
    <OperatorPortalAuthShell
      mode="hq"
      brand={companyBrand}
      brandLoading={brandLoading}
      loading={!ready}
      onServerConfigured={handleTransportConfigured}
    >
      <div>
        <h2
          className="font-display text-3xl font-bold tracking-tight sm:text-[2.15rem]"
          style={{
            background: "linear-gradient(120deg, #1e3a5f 0%, #334155 55%, #0d1525 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Set password
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-slate-500">
          {session
            ? `Signed in as ${session.admin.displayName}. Replace your temporary HQ password before continuing.`
            : "Replace your temporary HQ password before continuing."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <StaffAuthField
          id="admin-change-email"
          label="HQ email"
          type="email"
          value={session?.admin.email ?? ""}
          onChange={() => undefined}
          placeholder="hq@transport.com"
          icon={Mail}
          autoComplete="username"
          readOnly
        />

        <StaffAuthField
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              {showCurrent ? "hide" : "show"}
            </button>
          }
        />

        <StaffAuthField
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              {showNew ? "hide" : "show"}
            </button>
          }
        />

        <StaffAuthField
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
          className="font-display w-full min-h-[52px] rounded-xl text-sm font-bold uppercase tracking-wider text-white shadow-[0_12px_28px_rgb(15_23_42_/_0.28)] transition-opacity hover:opacity-95 disabled:opacity-60"
          style={{
            background: "linear-gradient(120deg, #1e3a5f 0%, #152238 100%)",
          }}
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="font-body mt-6 text-center text-sm text-slate-500">
        Wrong account?{" "}
        <Link href="/admin/login" className="font-semibold text-[#1e3a5f] hover:underline">
          Sign in again
        </Link>
      </p>
    </OperatorPortalAuthShell>
  );
}
