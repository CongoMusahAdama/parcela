"use client";

import { useEffect } from "react";
import { Mail, MapPin, Pencil, Phone, Trash2, UserX, X } from "lucide-react";
import type { LeadTeamMember } from "@/types/lead";
import { formatLeadDateTime } from "@/lib/lead-format";
import { useModalScrollLock } from "@/lib/use-modal-scroll-lock";

type LeadStaffDetailModalProps = {
  member: LeadTeamMember | null;
  onClose: () => void;
  onEdit?: (member: LeadTeamMember) => void;
  onToggleActive?: (member: LeadTeamMember) => void;
  onDelete?: (member: LeadTeamMember) => void;
};

export function LeadStaffDetailModal({
  member,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
}: LeadStaffDetailModalProps) {
  useModalScrollLock(Boolean(member));

  useEffect(() => {
    if (!member) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;

  const inactive = member.active === false;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden overscroll-none p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[3px]"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-label="Close staff details"
      />
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-staff-detail-title"
      >
        <div
          className="px-5 py-5 text-white"
          style={{ background: "var(--staff-header-gradient)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-white/75">
                Counter staff
              </p>
              <h2 id="lead-staff-detail-title" className="font-display mt-1 text-xl font-bold">
                {member.displayName}
              </h2>
              <p className="font-body mt-1 text-sm text-white/85">{member.stationName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                inactive ? "bg-slate-100 text-slate-600" : "staff-status-ready"
              }`}
            >
              {inactive ? "Inactive" : "Active"}
            </span>
            <span
              className={`font-display inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                member.online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`size-2 rounded-full ${member.online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              />
              {member.online ? "Online" : "Offline"}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Phone" value={member.phone ?? "—"} icon={Phone} />
            <DetailItem label="Email" value={member.email} icon={Mail} />
            <DetailItem label="Terminal" value={member.stationName} icon={MapPin} />
            <DetailItem label="Location" value={member.location ?? member.stationName} icon={MapPin} />
            <DetailItem label="Last login" value={formatLeadDateTime(member.lastLoginAt)} />
            <DetailItem label="Last logout" value={formatLeadDateTime(member.lastLogoutAt)} />
            <DetailItem label="Parcels today" value={String(member.parcelsHandledToday)} />
            <DetailItem label="Operator" value={member.operator} />
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="font-display inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
              >
                <Pencil className="size-4" />
                Edit details
              </button>
            ) : null}
            {onToggleActive ? (
              <button
                type="button"
                onClick={() => onToggleActive(member)}
                className="font-display inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
              >
                <UserX className="size-4" />
                {inactive ? "Enable staff account" : "Disable staff account"}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(member)}
                className="font-display inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
                Delete staff account
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Phone;
}) {
  return (
    <div className="rounded-xl border border-border bg-[#f8fafc] px-3 py-3">
      <dt className="font-body flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </dt>
      <dd className="font-display mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
