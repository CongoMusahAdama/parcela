"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { AuthCompanyBrand } from "@/components/auth/AuthCompanyBrand";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { OperatorAuthBrandPanel } from "@/components/operator/OperatorAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { changeStaffPasswordApi } from "@/lib/staff-api";
import {
  changeStaffPasswordWithCredentials,
  restoreStaffSession,
  saveStaffSession,
  validateStaffChangePasswordInput,
} from "@/lib/staff-auth";
import { OPERATOR_LOGIN_PATH } from "@/lib/operator-auth";
import { useLoginOperatorBrand } from "@/lib/login-brand";
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
  const { brand: companyBrand, loading: brandLoading } = useLoginOperatorBrand(phone, "staff");

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

  if (!ready) {
    return (
      <AuthPageShell
        variant="operator"
        brandMark={
          <AuthCompanyBrand brand={companyBrand} loading={brandLoading} variant="dark" />
        }
        hero={<OperatorAuthBrandPanel mode="staff" />}
        heroAccentColor={companyBrand?.brandColor}
        loading
      />
    );
  }

  const signedIn = Boolean(session);
  const usingTemporaryPassword = session?.staff.mustChangePassword ?? !signedIn;

  return (
    <AuthPageShell
      variant="operator"
      brandMark={
        <AuthCompanyBrand brand={companyBrand} loading={brandLoading} variant="dark" />
      }
      hero={<OperatorAuthBrandPanel mode="staff" />}
      heroAccentColor={companyBrand?.brandColor}
    >
      <div className="text-center lg:text-left">
        <h2 className="font-display text-2xl font-bold tracking-tight text-[#0f172a] sm:text-[1.65rem]">
          {usingTemporaryPassword ? "Set your password" : "Change your password"}
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-[#64748b]">
          {signedIn
            ? `Signed in as ${session?.staff.displayName ?? session?.staff.phone}. Choose a private password for your counter account.`
            : "Enter the phone number on your staff account, your temporary password from HQ, then choose a new password."}
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
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
          className="font-display w-full min-h-[52px] rounded-xl bg-[#0D9488] text-sm font-bold uppercase tracking-wider text-white shadow-[0_12px_28px_rgb(13_148_136_/_0.32)] transition-colors hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Updating…" : usingTemporaryPassword ? "Set password" : "Update password"}
        </button>
      </form>

      <p className="font-body mt-6 text-center text-sm text-[#64748b] lg:text-left">
        {signedIn ? "Wrong account?" : "Already set your password?"}{" "}
        <Link href={OPERATOR_LOGIN_PATH} className="font-semibold text-[#0D9488] hover:underline">
          {signedIn ? "Sign in again" : "Back to sign in"}
        </Link>
      </p>
    </AuthPageShell>
  );
}
