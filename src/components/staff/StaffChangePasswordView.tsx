"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { OperatorPortalAuthShell } from "@/components/operator/OperatorPortalAuthShell";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useLoginOperatorBrand } from "@/lib/login-brand";
import { changeStaffPasswordApi } from "@/lib/staff-api";
import {
  changeStaffPasswordWithCredentials,
  restoreStaffSession,
  saveStaffSession,
  validateStaffChangePasswordInput,
} from "@/lib/staff-auth";
import { OPERATOR_LOGIN_PATH } from "@/lib/operator-auth";
import { queuePortalWelcome } from "@/lib/operator-portal-welcome";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { StaffSession } from "@/types/staff";

export function StaffChangePasswordView() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState("");
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
  } = useLoginOperatorBrand(phone, "staff");

  async function handleTransportConfigured(
    _name: string,
    nextBrand: import("@/lib/login-brand").LoginOperatorBrand | null,
  ) {
    applyBrand(nextBrand);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const current = await restoreStaffSession();
      if (cancelled) return;
      if (current) {
        setSession(current);
        setPhone(current.staff.phone ?? "");
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateStaffChangePasswordInput(
      phone,
      currentPassword,
      newPassword,
      confirmPassword,
      { requirePhone: !session },
    );
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (session) {
        const result = await changeStaffPasswordApi({
          currentPassword,
          newPassword,
        });
        const updated: StaffSession = {
          ...session,
          staff: { ...session.staff, mustChangePassword: false },
        };
        saveStaffSession(updated);
        queuePortalWelcome("staff", session.staff.id);
        await showSuccessAlert({
          title: "Password updated",
          text: result.message,
          confirmText: "Open counter portal",
        });
      } else {
        const updated = await changeStaffPasswordWithCredentials(
          phone,
          currentPassword,
          newPassword,
        );
        queuePortalWelcome("staff", updated.staff.id);
        await showSuccessAlert({
          title: "Password set",
          text: "Your counter password is ready. Sign in anytime with your phone and new password.",
          confirmText: "Open counter portal",
        });
      }
      router.replace("/staff/dashboard");
    } catch (err) {
      await showValidationAlert({
        title: "Could not update password",
        text: err instanceof Error ? err.message : "Check your phone and passwords, then try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const signedIn = Boolean(session);
  const usingTemporaryPassword = session?.staff.mustChangePassword ?? !signedIn;

  return (
    <OperatorPortalAuthShell
      mode="staff"
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
          {usingTemporaryPassword ? "Set password" : "Change password"}
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-slate-500">
          {signedIn
            ? `Signed in as ${session?.staff.displayName ?? session?.staff.phone}. Choose a private password for your counter account.`
            : "Enter the phone on your staff account, your temporary password from HQ, then choose a new password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <StaffAuthField
          id="change-phone"
          label="Phone number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="0531878243"
          icon={Phone}
          autoComplete="tel"
          readOnly={signedIn}
        />

        <StaffAuthField
          id="change-current-password"
          label={usingTemporaryPassword ? "Temporary password" : "Current password"}
          type={showCurrent ? "text" : "password"}
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder={usingTemporaryPassword ? "From HQ or SMS" : "Your current password"}
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
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
          className="font-display w-full min-h-[52px] rounded-full text-sm font-bold uppercase tracking-wider text-white shadow-[0_12px_28px_rgb(30_58_95_/_0.35)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "linear-gradient(120deg, #1e3a5f 0%, #152238 55%, #0d1525 100%)",
          }}
        >
          {isSubmitting ? "Updating…" : usingTemporaryPassword ? "Set password" : "Update password"}
        </button>
      </form>

      <p className="font-body mt-6 text-center text-sm text-slate-500">
        {signedIn ? "Wrong account?" : "Already set your password?"}{" "}
        <Link href={OPERATOR_LOGIN_PATH} className="font-semibold text-[#1e3a5f] hover:underline">
          {signedIn ? "Sign in again" : "Back to sign in"}
        </Link>
      </p>
    </OperatorPortalAuthShell>
  );
}
