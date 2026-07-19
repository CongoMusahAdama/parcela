"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Phone, UserRound, Users } from "lucide-react";
import { AuthCompanyBrand } from "@/components/auth/AuthCompanyBrand";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { OperatorAuthBrandPanel } from "@/components/operator/OperatorAuthBrandPanel";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import { getLeadLoginFailureMessage, signInLead, validateLeadLoginInput } from "@/lib/lead-auth";
import {
  getOperatorChangeCredentialPath,
  getPostLoginPath,
  type OperatorLoginMode,
  restoreOperatorSession,
} from "@/lib/operator-auth";
import {
  formatStaffServerDate,
  getStaffLoginFailureMessage,
  signInStaff,
  validateStaffLoginInput,
} from "@/lib/staff-auth";
import { hasSeenPortalWelcome, queuePortalWelcome } from "@/lib/operator-portal-welcome";
import { useLoginOperatorBrand } from "@/lib/login-brand";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";
import type { LeadSession } from "@/types/lead";
import type { StaffSession } from "@/types/staff";

const LOGIN_MODES: {
  id: OperatorLoginMode;
  label: string;
  hint: string;
  icon: typeof UserRound;
}[] = [
  { id: "staff", label: "Station staff", hint: "Phone & password", icon: UserRound },
  { id: "lead", label: "Branch lead", hint: "Phone & PIN", icon: Users },
];

export function OperatorLoginView() {
  const router = useRouter();
  const [mode, setMode] = useState<OperatorLoginMode>("staff");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const ready = useClientReady();
  const loginPhone = mode === "staff" ? phone : leadPhone;
  const { brand: companyBrand, loading: brandLoading } = useLoginOperatorBrand(
    loginPhone,
    mode === "staff" ? "staff" : "lead",
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await restoreOperatorSession();
      if (cancelled) return;
      if (session) {
        router.replace(getPostLoginPath(session));
        return;
      }
      setCheckingSession(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function completeSignIn(session: StaffSession | LeadSession) {
    const isLead = session.staff.role === "station_lead";
    const credentialPath = getOperatorChangeCredentialPath(session.staff.role);

    if (session.staff.mustChangePassword) {
      await showSuccessAlert({
        title: isLead ? "Temporary PIN active" : "Temporary password active",
        text: isLead
          ? "Please set a new PIN before using the branch lead portal."
          : "Please set a new password before using the counter portal.",
        confirmText: isLead ? "Set PIN" : "Set password",
      });
      router.push(credentialPath);
      return;
    }

    const portal = isLead ? "lead" : "staff";
    if (!hasSeenPortalWelcome(portal, session.staff.id)) {
      queuePortalWelcome(portal, session.staff.id);
    }

    await showSuccessAlert({
      title: "Signed in successfully",
      text: isLead
        ? `Welcome, ${session.staff.displayName}. You are leading ${session.staff.stationName}.`
        : `Welcome, ${session.staff.displayName}. You are signed in to ${session.staff.stationName}.`,
      confirmText: "Go to dashboard",
    });
    router.push(getPostLoginPath(session));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mode === "staff") {
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
      return;
    }

    const validationMessage = validateLeadLoginInput(leadPhone, pin);
    if (validationMessage) {
      await showValidationAlert({
        title: "Check your sign-in details",
        text: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signInLead(leadPhone, pin);
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
    <AuthPageShell
      variant="operator"
      loading={checkingSession}
      brandMark={
        <AuthCompanyBrand brand={companyBrand} loading={brandLoading} variant="dark" />
      }
      hero={<OperatorAuthBrandPanel mode={mode} />}
      heroAccentColor={companyBrand?.brandColor}
    >
      <div className="text-center lg:text-left">
        <h2 className="font-display text-2xl font-bold tracking-tight text-[#0f172a] sm:text-[1.65rem]">
          Welcome back
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-[#64748b]">
          {mode === "staff"
            ? "Sign in to verify parcels, log transit, and release collections at your terminal."
            : "Sign in to manage your branch team, parcels, and daily operations."}
        </p>
        <p className="font-body mt-1 text-xs text-[#94a3b8]">
          Server date:{" "}
          <span className="font-semibold text-[#0D9488]">
            {ready ? formatStaffServerDate() : "\u00a0"}
          </span>
        </p>
      </div>

      <div
        className="mt-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-1.5"
        role="tablist"
        aria-label="Sign-in role"
      >
        <div className="grid grid-cols-2 gap-1.5">
          {LOGIN_MODES.map(({ id, label, hint, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(id)}
                className={cn(
                  "rounded-xl px-2.5 py-3 text-left transition-all duration-200",
                  active
                    ? "bg-white text-[#0f172a] shadow-sm ring-1 ring-[#e2e8f0]"
                    : "text-[#64748b] hover:bg-white/70 hover:text-[#0f172a]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-[#0D9488]/10 text-[#0D9488]" : "bg-white text-[#94a3b8]",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-display block text-sm font-bold leading-tight">
                      {label}
                    </span>
                    <span className="font-body mt-0.5 block text-[10px] leading-snug">{hint}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {mode === "staff" ? (
          <>
            <StaffAuthField
              id="operator-staff-phone"
              label="Phone number"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="0531878243"
              icon={Phone}
              autoComplete="tel"
            />

            <StaffAuthField
              id="operator-staff-password"
              label="Password"
              type={showSecret ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              icon={Lock}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
                >
                  {showSecret ? "hide" : "show"}
                </button>
              }
            />
          </>
        ) : (
          <>
            <StaffAuthField
              id="operator-lead-phone"
              label="Phone number"
              type="tel"
              value={leadPhone}
              onChange={setLeadPhone}
              placeholder="0531878243"
              icon={Phone}
              autoComplete="tel"
            />

            <StaffAuthField
              id="operator-lead-pin"
              label="PIN"
              type={showSecret ? "text" : "password"}
              value={pin}
              onChange={setPin}
              placeholder="Enter your PIN"
              icon={KeyRound}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
                >
                  {showSecret ? "hide" : "show"}
                </button>
              }
            />
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-display w-full min-h-[52px] rounded-xl bg-[#0D9488] text-sm font-bold uppercase tracking-wider text-white shadow-[0_12px_28px_rgb(13_148_136_/_0.32)] transition-colors hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        {mode === "staff" ? (
          <p className="font-body text-center text-xs sm:text-sm">
            <Link
              href="/staff/change-password"
              className="font-semibold text-[#0D9488] hover:underline"
            >
              Set or change your password
            </Link>
          </p>
        ) : (
          <p className="font-body text-center text-xs text-[#64748b] sm:text-sm">
            Use the phone and PIN from HQ Branch leads → Send login.
          </p>
        )}
      </form>

      <p className="font-body mt-6 text-center text-[11px] leading-relaxed text-[#94a3b8] lg:text-left">
        One portal for your terminal — we open the right dashboard after sign-in.{" "}
        <a href="mailto:support@parcela.app" className="font-semibold text-[#0D9488] hover:underline">
          Contact support
        </a>
      </p>
    </AuthPageShell>
  );
}
