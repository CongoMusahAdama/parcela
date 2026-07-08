"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Pencil, Phone, User, X } from "lucide-react";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { updateLeadTeamMemberApi } from "@/lib/lead-api";
import { getLeadFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { useModalScrollLock } from "@/lib/use-modal-scroll-lock";
import type { LeadTeamMember } from "@/types/lead";

type LeadEditStaffModalProps = {
  member: LeadTeamMember | null;
  onClose: () => void;
  onUpdated?: (member: LeadTeamMember) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadEditStaffModal({ member, onClose, onUpdated }: LeadEditStaffModalProps) {
  const { staff, token } = useLeadSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = Boolean(member);

  useModalScrollLock(open);

  useEffect(() => {
    if (!member) return;
    setDisplayName(member.displayName);
    setEmail(member.email);
    setPhone(member.phone ?? "");
    setIsSubmitting(false);
  }, [member]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;

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

    const body: {
      displayName?: string;
      email?: string;
      phone?: string;
    } = {};

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName !== member.displayName) body.displayName = trimmedName;
    if (trimmedEmail !== member.email.toLowerCase()) body.email = trimmedEmail;
    if (trimmedPhone !== (member.phone ?? "").trim()) body.phone = trimmedPhone;

    if (Object.keys(body).length === 0) {
      await showValidationAlert({
        title: "No changes",
        text: "Update at least one field before saving.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateLeadTeamMemberApi(member.id, body, token);
      await showSuccessAlert({
        title: "Staff updated",
        text: `${updated.displayName}'s details were saved.`,
      });
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      await showValidationAlert({
        title: "Could not update staff",
        text: err instanceof Error ? err.message : "Please check the details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!member) return null;

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
        aria-label="Close edit staff form"
      />
      <div
        className="relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_64px_-16px_rgb(15_23_42_/_0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-edit-staff-title"
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
                <Pencil className="size-5" />
              </span>
              <div>
                <h2 id="lead-edit-staff-title" className="font-display text-xl font-bold text-foreground">
                  Edit counter staff
                </h2>
                <p className="font-body mt-1 text-sm text-muted">
                  Update name, email, or phone for staff at your branch.
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
                Your branch
              </p>
              <div className="mt-2 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Building2 className="size-5 text-[#0D9488]" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-foreground">{staff.stationName}</p>
                  <p className="font-body mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3 shrink-0" />
                    {staff.location ?? staff.stationName} · {staff.stationCode}
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
                  id="edit-staff-name"
                  label="Full name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="e.g. Ama Serwaa"
                  icon={User}
                />
                <StaffAuthField
                  id="edit-staff-email"
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
                    id="edit-staff-phone"
                    label="Phone number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="0244123456"
                    icon={Phone}
                    autoComplete="tel"
                  />
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
                disabled={isSubmitting}
                className="font-display flex-1 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm disabled:opacity-60"
                style={{ background: "var(--staff-accent)" }}
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
