"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Phone, UserRound, Users } from "lucide-react";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Logo } from "@/components/brand/Logo";
import { OperatorAuthBrandPanel } from "@/components/operator/OperatorAuthBrandPanel";
import { OperatorInstallBanner } from "@/components/operator/OperatorInstallBanner";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { Button } from "@/components/ui/Button";
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

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6]">
        <p className="font-body text-sm text-muted">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex w-full max-w-[900px] flex-col gap-3">
        <OperatorInstallBanner placement="login" />
        <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.18)] lg:flex-row">
        <aside className="hidden lg:block lg:w-[42%] lg:shrink-0">
          <OperatorAuthBrandPanel mode={mode} />
        </aside>

        <section className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-10 sm:py-7 lg:px-12 lg:py-8">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-4 flex justify-center bg-transparent lg:hidden">
              <AuthIllustration
                priority
                className="w-full max-w-[200px] [&_img]:max-h-[120px]"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              <Logo size="lg" className="justify-center" />
              <h2 className="font-display mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Operator sign in
              </h2>
              <p className="font-body mt-1 text-xs text-muted sm:text-sm">
                Server date:{" "}
                <span className="font-semibold text-primary">{formatStaffServerDate()}</span>
              </p>
            </div>

            <div
              className="mt-5 rounded-2xl border border-border/70 bg-slate-50/90 p-1.5"
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
                          ? "bg-white text-foreground shadow-sm ring-1 ring-border/60"
                          : "text-muted hover:bg-white/60 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg",
                            active
                              ? "bg-[#0D9488]/10 text-[#0D9488]"
                              : "bg-white/80 text-muted",
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={2.25} />
                        </span>
                        <span className="min-w-0">
                          <span className="font-display block text-sm font-bold leading-tight">
                            {label}
                          </span>
                          <span className="font-body mt-0.5 block text-[10px] leading-snug">
                            {hint}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
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
                        className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
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
                        className="font-body rounded-lg px-2 py-1 text-xs font-medium text-[#0D9488] hover:text-[#0f766e]"
                      >
                        {showSecret ? "hide" : "show"}
                      </button>
                    }
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                variant="primary"
                className="!min-h-[48px] !rounded-xl !bg-[#0D9488] !font-display !text-sm font-bold uppercase tracking-wider hover:!bg-[#0f766e]"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>

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
                <p className="font-body text-center text-xs text-muted sm:text-sm">
                  Use the phone and PIN from HQ Branch leads → Send login.
                </p>
              )}
            </form>

            <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
              <p className="font-body text-[11px] leading-relaxed text-muted sm:text-xs">
                <span className="font-semibold text-foreground">One portal for your terminal.</span>{" "}
                We detect your role after sign-in and open the right dashboard.{" "}
                <a
                  href="mailto:support@parcela.app"
                  className="font-semibold text-[#0D9488] hover:underline"
                >
                  Contact support
                </a>
              </p>
            </div>

            <p className="font-body mt-4 text-center text-[10px] leading-relaxed text-muted">
              © {new Date().getFullYear()} Parcela · Station operations portal
              <br />
              support@parcela.app
            </p>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
