"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { AdminAuthBrandPanel } from "@/components/admin/AdminAuthBrandPanel";
import { AuthCompanyBrand } from "@/components/auth/AuthCompanyBrand";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import {
  formatAdminServerDate,
  getAdminLoginFailureMessage,
  signInAdmin,
  validateAdminLoginInput,
} from "@/lib/admin-auth";
import { hasSeenPortalWelcome, queuePortalWelcome } from "@/lib/operator-portal-welcome";
import { useLoginOperatorBrand } from "@/lib/login-brand";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";

export function AdminLoginView() {
  const router = useRouter();
  const ready = useClientReady();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { brand: companyBrand, loading: brandLoading } = useLoginOperatorBrand(phone, "hq");

  useEffect(() => {
    router.prefetch("/admin/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationMessage = validateAdminLoginInput(phone, password);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signInAdmin(phone.trim(), password);
      if (session.admin.mustChangePassword) {
        await showSuccessAlert({
          title: "Temporary password active",
          text: "Set a new password before using the HQ portal.",
          confirmText: "Set password",
        });
        router.replace("/admin/change-password");
        return;
      }
      if (!hasSeenPortalWelcome("admin", session.admin.id)) {
        queuePortalWelcome("admin", session.admin.id);
      }
      router.replace("/admin/dashboard");
    } catch (error) {
      await showValidationAlert({
        title: "Unable to sign in",
        text: getAdminLoginFailureMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      variant="hq"
      brandMark={
        <AuthCompanyBrand brand={companyBrand} loading={brandLoading} variant="dark" />
      }
      hero={<AdminAuthBrandPanel />}
      heroAccentColor={companyBrand?.brandColor}
    >
      <div className="text-center lg:text-left">
        <h2 className="font-display text-2xl font-bold tracking-tight text-[#0f172a] sm:text-[1.65rem]">
          Welcome back
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-[#64748b]">
          Sign in to your HQ dashboard with the phone number Parcela provisioned for your transport
          company.
        </p>
        <p className="font-body mt-1 text-xs text-[#94a3b8]">
          {ready ? formatAdminServerDate() : "\u00a0"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <StaffAuthField
          id="admin-phone"
          label="Phone number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="0244555666"
          icon={Phone}
          autoComplete="tel"
        />

        <StaffAuthField
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
          className="font-display mt-1 w-full min-h-[52px] rounded-xl bg-[#0f172a] text-sm font-bold uppercase tracking-wider text-white shadow-[0_12px_28px_rgb(15_23_42_/_0.28)] transition-colors hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="font-body mt-6 text-center text-xs leading-relaxed text-[#94a3b8] lg:text-left">
        Provisioned access only. Your dashboard adopts your operator branding after setup.
        <br />
        Forgot password? Contact Parcela support.
      </p>
    </AuthPageShell>
  );
}
