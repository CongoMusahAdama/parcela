"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Phone, UserRound, Users } from "lucide-react";
import { OperatorPortalAuthShell } from "@/components/operator/OperatorPortalAuthShell";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useClientReady } from "@/hooks/use-client-ready";
import { getLeadLoginFailureMessage, signInLead, validateLeadLoginInput } from "@/lib/lead-auth";
import { brandColorAuthAccent, brandColorAuthButtonStyle, brandColorAuthTitleStyle } from "@/lib/brand-color-theme";
import { useLoginOperatorBrand, type LoginOperatorBrand } from "@/lib/login-brand";
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
  const {
    brand: companyBrand,
    loading: brandLoading,
    applyBrand,
  } = useLoginOperatorBrand(loginPhone, mode === "staff" ? "staff" : "lead");

  async function handleTransportConfigured(
    _name: string,
    nextBrand: LoginOperatorBrand | null,
  ) {
    applyBrand(nextBrand);
  }

  useEffect(() => {
    let cancelled = false;
    const failOpen = window.setTimeout(() => {
      if (!cancelled) setCheckingSession(false);
    }, 2500);

    void (async () => {
      try {
        // Login page must not treat offline cache as signed-in (API may be unreachable).
        const session = await restoreOperatorSession({ allowOfflineCache: false });
        if (cancelled) return;
        if (session) {
          router.replace(getPostLoginPath(session));
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

  const accent = brandColorAuthAccent(companyBrand?.brandColor);
  const buttonStyle = brandColorAuthButtonStyle(companyBrand?.brandColor);
  const titleStyle = brandColorAuthTitleStyle(companyBrand?.brandColor);

  return (
    <OperatorPortalAuthShell
      mode={mode}
      brand={companyBrand}
      brandLoading={brandLoading}
      loading={checkingSession}
      onServerConfigured={handleTransportConfigured}
    >
      <div>
        <h2
          className="font-display text-3xl font-bold tracking-tight sm:text-[2.15rem]"
          style={titleStyle}
        >
          Log in
        </h2>
        <p className="font-body mt-2 text-sm leading-relaxed text-slate-500">
          {mode === "staff"
            ? "Sign in to verify parcels, log transit, and release collections at your terminal."
            : "Sign in to manage your branch team, parcels, and daily operations."}
        </p>
        <p className="font-body mt-1 text-xs text-slate-400">
          Server date:{" "}
          <span className="font-semibold" style={{ color: accent }}>
            {ready ? formatStaffServerDate() : "\u00a0"}
          </span>
        </p>
      </div>

      <div
        className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
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
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      active ? "" : "bg-white text-slate-400",
                    )}
                    style={
                      active
                        ? { background: `${accent}1a`, color: accent }
                        : undefined
                    }
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
                  className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
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
                  className="font-body rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
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
          className="font-display w-full min-h-[52px] rounded-full text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={buttonStyle}
        >
          {isSubmitting ? "Signing in…" : "Log in"}
        </button>

        {mode === "staff" ? (
          <p className="font-body text-center text-xs sm:text-sm">
            <Link
              href="/staff/change-password"
              className="font-semibold hover:underline"
              style={{ color: accent }}
            >
              Set or change your password
            </Link>
          </p>
        ) : (
          <p className="font-body text-center text-xs text-slate-500 sm:text-sm">
            Use the phone and PIN from HQ Branch leads → Send login.
          </p>
        )}
      </form>

      <p className="font-body mt-6 text-center text-[11px] leading-relaxed text-slate-400">
        One portal for your terminal — we open the right dashboard after sign-in.{" "}
        <a
          href="mailto:support@parcela.app"
          className="font-semibold hover:underline"
          style={{ color: accent }}
        >
          Contact support
        </a>
      </p>
    </OperatorPortalAuthShell>
  );
}
