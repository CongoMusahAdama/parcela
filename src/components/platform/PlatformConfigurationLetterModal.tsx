"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download, Mail, X } from "lucide-react";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";
import {
  CONFIGURATION_LETTER_MONTHLY_MAINTENANCE,
  CONFIGURATION_LETTER_ONGOING_SUPPORT,
  PARCELA_PLATFORM_CONTACT,
  buildConfigurationLetterData,
  configurationLetterRecipients,
  configurationLetterThankYou,
  downloadConfigurationLetterPdf,
  emailConfigurationLetter,
} from "@/lib/platform-configuration-letter";
import type { PlatformOperatorRow } from "@/lib/platform-demo";
import { PLATFORM_THEME } from "@/lib/platform-theme";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";

type PlatformConfigurationLetterModalProps = {
  operator: PlatformOperatorRow;
  agreementDate: string;
  onAgreementDateChange: (value: string) => void;
  onClose: () => void;
  onEmailed?: () => void;
};

const inputClass =
  "font-body w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]";

function LetterHighlight({ children }: { children: ReactNode }) {
  return (
    <strong className="font-semibold text-[var(--platform-orange-dark)]">{children}</strong>
  );
}

export function PlatformConfigurationLetterModal({
  operator,
  agreementDate,
  onAgreementDateChange,
  onClose,
  onEmailed,
}: PlatformConfigurationLetterModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const letterData = useMemo(() => {
    if (!agreementDate.trim()) return null;
    return buildConfigurationLetterData(operator, agreementDate);
  }, [operator, agreementDate]);

  const recipients = useMemo(() => configurationLetterRecipients(operator), [operator]);

  async function handleDownload() {
    if (!letterData) {
      await showValidationAlert({
        title: "Agreement date required",
        text: "Enter the date the platform agreement was signed before generating the letter.",
      });
      return;
    }
    setDownloading(true);
    try {
      await downloadConfigurationLetterPdf(letterData);
    } finally {
      setDownloading(false);
    }
  }

  async function handleEmail() {
    if (!letterData) {
      await showValidationAlert({
        title: "Agreement date required",
        text: "Enter the agreement date before emailing the letter.",
      });
      return;
    }
    if (recipients.length === 0) {
      await showValidationAlert({
        title: "No recipient email",
        text: "Add a company email or HQ admin email on this transport before sending.",
      });
      return;
    }

    setEmailing(true);
    try {
      const result = await emailConfigurationLetter(letterData, recipients);
      if (!result.ok) {
        await showValidationAlert({ title: "Cannot send", text: result.reason });
        return;
      }
      onEmailed?.();
      await showSuccessAlert({
        title: "Letter sent",
        text: `Configuration letter emailed to ${recipients.join(" and ")}. PDF downloaded — attach it in your email client if needed (full auto-attach wiring comes next).`,
        confirmButtonColor: "#fd7e14",
      });
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
      <div
        className="platform-portal flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        style={
          {
            "--platform-orange": PLATFORM_THEME.orange,
            "--platform-orange-dark": PLATFORM_THEME.orangeDark,
            "--platform-orange-muted": PLATFORM_THEME.orangeMuted,
            "--platform-orange-soft": PLATFORM_THEME.orangeSoft,
          } as React.CSSProperties
        }
      >
        <div
          className="relative px-5 py-5 text-white"
          style={{ background: PLATFORM_THEME.headerGradient }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                Auto-generated
              </p>
              <h2 className="font-display mt-1 text-lg font-bold">Configuration letter</h2>
              <p className="font-body mt-1 text-sm text-white/85">
                {operator.name} · issued after successful configuration
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/80 p-4 sm:p-5">
          <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4">
            <label htmlFor="letter-agreement-date" className="font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Agreement signed on
            </label>
            <input
              id="letter-agreement-date"
              type="date"
              className={inputClass}
              value={agreementDate}
              onChange={(e) => onAgreementDateChange(e.target.value)}
            />
            <p className="font-body mt-2 text-xs text-stone-500">
              The commercial agreement is signed before onboarding. This letter references that date.
            </p>
          </div>

          <article
            className="relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-sm border border-stone-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] print:shadow-none"
            style={{ minHeight: "min(297mm, 72dvh)" }}
          >
            <div className="flex h-2">
              <div className="flex-1" style={{ backgroundColor: operator.brandColor }} />
              <div className="w-1/3" style={{ backgroundColor: PLATFORM_THEME.orange }} />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO_SRC}
                alt=""
                className="w-[min(68%,26rem)] max-w-none select-none object-contain opacity-[0.07]"
              />
            </div>

            <div className="relative z-10 px-6 py-7 sm:px-10 sm:py-9">
              <header className="border-b border-stone-200 pb-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={BRAND_LOGO_SRC}
                      alt={BRAND_NAME}
                      className="h-16 w-auto max-w-[11rem] object-contain object-left sm:h-20 sm:max-w-[13rem]"
                    />
                    <p className="font-display mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                      {BRAND_NAME} platform
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-end">
                    <PlatformOperatorMark
                      code={operator.code}
                      name={operator.name}
                      brandColor={operator.brandColor}
                      logoDataUrl={operator.logoDataUrl}
                      size="letter"
                      className="rounded-2xl border-stone-200 p-3 shadow-sm"
                    />
                    <p className="font-display mt-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                      {operator.code} · {operator.region}
                    </p>
                  </div>
                </div>
                <h3 className="font-display mt-6 text-center text-lg font-bold uppercase tracking-[0.08em] text-stone-900 sm:text-xl">
                  {operator.name}
                </h3>
                {(operator.contactEmail || operator.contactPhone) && (
                  <p className="font-body mt-2 text-center text-sm text-stone-500">
                    {[operator.contactEmail, operator.contactPhone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </header>

              <p className="font-body mt-5 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                Ref: {operator.code} · Configuration completion
              </p>

              <div className="mt-5 text-center">
                <h3 className="font-display text-xl font-bold tracking-tight text-stone-900 underline decoration-stone-300 underline-offset-4">
                  Configuration Completion Letter
                </h3>
                <p className="font-body mt-1.5 text-sm text-stone-500">
                  {letterData?.letterDateLabel ?? "—"}
                </p>
              </div>

              <div className="font-body mt-8 space-y-5 text-[15px] leading-[1.7] text-stone-700">
              <p>Dear {operator.name},</p>
              <p>
                This letter confirms that your transport service has been{" "}
                <LetterHighlight>successfully configured</LetterHighlight> on the {BRAND_NAME}{" "}
                platform, in accordance with the{" "}
                <LetterHighlight>platform agreement</LetterHighlight> signed on{" "}
                <LetterHighlight>{letterData?.agreementDateLabel ?? "—"}</LetterHighlight>.
              </p>

              <div className="rounded-xl border border-stone-200 bg-stone-50/90 px-5 py-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]">
                  Configuration summary
                </p>
                <ul className="mt-3 space-y-2 text-[14px] text-stone-800">
                  <li className="flex gap-2">
                    <span className="text-stone-400">•</span>
                    <span>Operator code: {operator.code}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-stone-400">•</span>
                    <span>Operating region: {operator.region}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-stone-400">•</span>
                    <span>
                      Network: {operator.stationCount} stations across {operator.cityCount} cities /
                      corridors
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-stone-400">•</span>
                    <span>Configuration completed: {letterData?.configuredDateLabel ?? "Today"}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-stone-400">•</span>
                    <span>
                      Primary HQ contact: {operator.primaryAdminName ?? "—"} (
                      {operator.primaryAdminEmail ?? "—"})
                    </span>
                  </li>
                  {letterData?.subscriptionSummary ? (
                    <li className="flex gap-2">
                      <span className="text-stone-400">•</span>
                      <span>Platform licence: {letterData.subscriptionSummary}</span>
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="font-display text-[11px] font-bold uppercase tracking-wide text-amber-900">
                  Monthly maintenance — our commitment to you
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
                  {CONFIGURATION_LETTER_MONTHLY_MAINTENANCE.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
                <p className="font-display text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f]">
                  Dedicated support — we are here for everything you need
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
                  {CONFIGURATION_LETTER_ONGOING_SUPPORT.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <p>
                Your HQ administrator may now sign in to complete terminal setup and create branch
                leads. For any assistance, contact the Parcela platform team using the details below.
              </p>

              <p className="rounded-xl border border-stone-200 bg-stone-50/80 px-5 py-4 italic leading-relaxed text-stone-600">
                {configurationLetterThankYou(operator.name)}
              </p>

              <p className="font-display text-[15px] font-semibold text-stone-900">
                We look forward to a <LetterHighlight>long and successful partnership</LetterHighlight>.
              </p>
            </div>

            <footer className="relative z-10 mt-10 px-6 pb-7 pt-5 sm:px-10 sm:pb-9">
              <div
                className="mb-4 h-0.5 w-16 rounded-full"
                style={{ backgroundColor: operator.brandColor }}
              />
              <p className="font-display text-sm font-bold text-stone-900">
                {PARCELA_PLATFORM_CONTACT.teamName}
              </p>
              <p className="font-body mt-1 text-xs uppercase tracking-wide text-stone-400">
                Authorised platform correspondence
              </p>
              <p className="font-body mt-2 text-sm text-stone-600">
                Phone: {PARCELA_PLATFORM_CONTACT.phone}
              </p>
              <p className="font-body text-sm text-stone-600">
                Email: {PARCELA_PLATFORM_CONTACT.email}
              </p>
            </footer>
            </div>
          </article>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p className="font-body text-xs text-stone-500">
            {recipients.length > 0
              ? `Email to: ${recipients.join(", ")}`
              : "Add company or HQ email to enable sending"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-display rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-700 hover:bg-stone-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload()}
              className={cn(
                "font-display inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50",
                downloading && "opacity-60",
              )}
            >
              <Download className="size-3.5" />
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
            <button
              type="button"
              disabled={emailing}
              onClick={() => void handleEmail()}
              className={cn(
                "font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white",
                emailing && "opacity-60",
              )}
              style={{ background: "var(--platform-orange)" }}
            >
              <Mail className="size-3.5" />
              {emailing ? "Sending…" : "Email letter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
