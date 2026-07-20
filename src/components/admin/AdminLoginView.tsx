"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { OperatorPortalAuthShell } from "@/components/operator/OperatorPortalAuthShell";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import { brandColorAuthAccent, brandColorAuthButtonStyle, brandColorAuthTitleStyle } from "@/lib/brand-color-theme";
import {
  formatAdminServerDate,
  getAdminLoginFailureMessage,
  restoreAdminSession,
  signInAdmin,
  validateAdminLoginInput,
} from "@/lib/admin-auth";
import { useLoginOperatorBrand, type LoginOperatorBrand } from "@/lib/login-brand";
import { hasSeenPortalWelcome, queuePortalWelcome } from "@/lib/operator-portal-welcome";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";

export function AdminLoginView() {
  const router = useRouter();
  const ready = useClientReady();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const {
    brand: companyBrand,
    loading: brandLoading,
    applyBrand,
  } = useLoginOperatorBrand(phone, "hq");

  async function handleTransportConfigured(
    _name: string,
    nextBrand: LoginOperatorBrand | null,
  ) {
    applyBrand(nextBrand);
  }

  useEffect(() => {
    router.prefetch("/admin/dashboard");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const failOpen = window.setTimeout(() => {
      if (!cancelled) setCheckingSession(false);
    }, 2500);

    void (async () => {
      try {
        const session = await restoreAdminSession({ allowOfflineCache: false });
        if (cancelled) return;
        if (session) {
          if (session.admin.mustChangePassword) {
            router.replace("/admin/change-password");
            return;
          }
          router.replace("/admin/dashboard");
          return;
        }
      } catch {
        // Show the form even when the API host cannot be resolved.
      } finally {
        window.clearTimeout(failOpen);
        if (!cancelled) setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(failOpen);
    };
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
    <OperatorPortalAuthShell
      mode="hq"
      brand={companyBrand}
      brandLoading={brandLoading}
      loading={checkingSession}
      onServerConfigured={handleTransportConfigured}
    >
      <div>
        <h2
          className="font-display text-3xl font-bold tracking-tight sm:text-[2.15rem]"
          style={brandColorAuthTitleStyle(companyBrand?.brandColor)}
        >
          Log in
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-slate-500">
          Sign in to your HQ dashboard with the phone number Parcela provisioned for your transport
          company.
        </p>
        <p className="font-body mt-1 text-xs text-slate-400">
          Server date:{" "}
          <span
            className="font-semibold"
            style={{ color: brandColorAuthAccent(companyBrand?.brandColor) }}
          >
            {ready ? formatAdminServerDate() : "\u00a0"}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
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
              className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              {showPassword ? "hide" : "show"}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-display mt-1 w-full min-h-[52px] rounded-xl text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={brandColorAuthButtonStyle(companyBrand?.brandColor)}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="font-body mt-6 text-center text-xs leading-relaxed text-slate-400">
        Provisioned access only. Forgot password? Contact Parcela support.
      </p>
    </OperatorPortalAuthShell>
  );
}
