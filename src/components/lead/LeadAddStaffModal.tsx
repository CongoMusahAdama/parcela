"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, User, UserPlus, X } from "lucide-react";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { createLeadTeamMemberApi, fetchLeadBranchStations } from "@/lib/lead-api";
import { getLeadFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { useModalScrollLock } from "@/lib/use-modal-scroll-lock";
import type { Station } from "@/types/parcel";

type LeadAddStaffModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadAddStaffModal({ open, onClose, onAdded }: LeadAddStaffModalProps) {
  const { staff, token } = useLeadSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stationId, setStationId] = useState("");
  const [branchCity, setBranchCity] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setDisplayName("");
    setEmail("");
    setPhone("");
    setStationId("");
    setIsSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStationsLoading(true);

    void fetchLeadBranchStations(token)
      .then((result) => {
        if (cancelled) return;
        setBranchCity(result.branchCity);
        setStations(result.stations);
        const defaultStation =
          result.stations.find((station) => station.id === staff.stationId) ??
          result.stations[0];
        setStationId(defaultStation?.id ?? "");
      })
      .catch(async (err) => {
        if (cancelled) return;
        await showValidationAlert({
          title: "Could not load terminals",
          text: err instanceof Error ? err.message : "Please try again.",
        });
      })
      .finally(() => {
        if (!cancelled) setStationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, staff.stationId]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  const selectedStation = stations.find((station) => station.id === stationId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const locks = await loadOperatorLockStatus(staff.operator);
    if (locks.leadOpsLocked) {
      await showValidationAlert({
        title: "Operations frozen by HQ",
        text: getLeadFreezeMessage(staff.operator),
      });
      return;
    }

    if (!displayName.trim()) {
      await showValidationAlert({ title: "Name required", text: "Enter the staff member's full name." });
      return;
    }
    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
      await showValidationAlert({ title: "Email required", text: "Enter a valid staff email address." });
      return;
    }
    if (!phone.trim()) {
      await showValidationAlert({ title: "Phone required", text: "Enter a Ghana mobile number." });
      return;
    }
    if (!stationId) {
      await showValidationAlert({
        title: "Terminal required",
        text: "Select which terminal this staff member will work at.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLeadTeamMemberApi(
        {
          displayName: displayName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          stationId,
        },
        token,
      );

      const terminalName = result.staff.stationName ?? selectedStation?.name ?? "your branch";

      await showSuccessAlert({
        title: "Staff added",
        text: result.smsSent
          ? `${result.staff.displayName} was added to ${terminalName}. A temporary password was sent by SMS — they must sign in, then set a new password.`
          : `${result.staff.displayName} was added to ${terminalName}. SMS could not be sent — ask HQ/support to resend credentials.`,
      });
      onAdded?.();
      onClose();
    } catch (err) {
      await showValidationAlert({
        title: "Could not add staff",
        text: err instanceof Error ? err.message : "Please check the details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden overscroll-none p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[3px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-label="Close add staff form"
      />
      <div
        className="relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-add-staff-title"
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className="shrink-0 border-b border-border px-6 py-5"
          style={{ background: "var(--staff-accent-muted)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: "var(--staff-accent)" }}
              >
                <UserPlus className="size-5" />
              </span>
              <div>
                <h2 id="lead-add-staff-title" className="font-display text-xl font-bold text-foreground">
                  Add counter staff
                </h2>
                <p className="font-body mt-1 text-sm text-muted">
                  New staff are added to terminals in your branch city only. We&apos;ll SMS a temporary
                  password plus a secure change-password link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border bg-surface p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="mb-4 rounded-xl border border-[#0D9488]/20 bg-[#0D9488]/5 px-4 py-3">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Your station
              </p>
              <div className="mt-2 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Building2 className="size-5 text-[#0D9488]" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-foreground">
                    {staff.stationName}
                  </p>
                  <p className="font-body mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3 shrink-0" />
                    {staff.operator} · {branchCity || staff.location?.split("·")[0]?.trim() || "Branch"}
                  </p>
                  <p className="font-body mt-1 text-xs text-muted">
                    {stationsLoading
                      ? "Loading your station…"
                      : "New counter staff are locked to this station only."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-[#f8fafc] p-4 sm:p-5">
              <p className="font-display mb-4 text-xs font-bold uppercase tracking-wider text-muted">
                Staff details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <StaffAuthField
                  id="modal-staff-name"
                  label="Full name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="e.g. Ama Serwaa"
                  icon={User}
                />
                <StaffAuthField
                  id="modal-staff-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="ama.serwaa@parcela.staff"
                  icon={Mail}
                  autoComplete="email"
                />
                <div className="sm:col-span-2">
                  <StaffAuthField
                    id="modal-staff-phone"
                    label="Phone number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="0244123456"
                    icon={Phone}
                    autoComplete="tel"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="modal-staff-terminal" className="font-display mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                    Terminal
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <select
                      id="modal-staff-terminal"
                      value={stationId}
                      onChange={(event) => setStationId(event.target.value)}
                      disabled
                      className="font-body w-full appearance-none rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-[var(--staff-accent)] disabled:opacity-60"
                    >
                      {stations.length === 0 ? (
                        <option value="">No terminals available</option>
                      ) : (
                        stations.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name} ({station.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <p className="font-body mt-1.5 text-[11px] text-muted">
                    Locked to your assigned station.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-surface px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-display flex-1 rounded-xl border border-border bg-surface py-3.5 text-sm font-semibold text-foreground hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || stationsLoading || !stationId}
                className="font-display flex-1 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm disabled:opacity-60"
                style={{ background: "var(--staff-accent)" }}
              >
                {isSubmitting ? "Adding…" : "Add staff"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
