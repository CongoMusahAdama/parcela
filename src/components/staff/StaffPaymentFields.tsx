"use client";

import { cn } from "@/lib/utils";

export type ParcelPaymentWho = "sender" | "receiver";

type StaffPaymentFieldsProps = {
  paymentWho: ParcelPaymentWho | "";
  onPaymentWhoChange: (value: ParcelPaymentWho) => void;
  markPaid: boolean;
  onMarkPaidChange: (value: boolean) => void;
  /** Hide mark-paid when receiver will pay later at destination. */
  showMarkPaid?: boolean;
  disabled?: boolean;
  className?: string;
};

export function StaffPaymentFields({
  paymentWho,
  onPaymentWhoChange,
  markPaid,
  onMarkPaidChange,
  showMarkPaid = true,
  disabled,
  className,
}: StaffPaymentFieldsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
        Who pays?
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { value: "sender" as const, label: "Sender pays", hint: "Collect at this counter" },
            {
              value: "receiver" as const,
              label: "Receiver pays",
              hint: "Collect at destination",
            },
          ] as const
        ).map((option) => {
          const active = paymentWho === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onPaymentWhoChange(option.value)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-50",
                active
                  ? "border-[var(--staff-accent)] bg-[var(--staff-accent-muted)]"
                  : "border-border bg-background hover:border-[var(--staff-accent)]/40",
              )}
            >
              <p className="font-display text-sm font-bold text-foreground">{option.label}</p>
              <p className="font-body mt-0.5 text-[11px] text-muted">{option.hint}</p>
            </button>
          );
        })}
      </div>

      {showMarkPaid && paymentWho ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
          <input
            type="checkbox"
            checked={markPaid}
            disabled={disabled}
            onChange={(e) => onMarkPaidChange(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-emerald-600"
          />
          <span className="font-body text-sm text-foreground">
            {paymentWho === "sender"
              ? "Fee collected from sender now"
              : "Fee collected from receiver now"}
            <span className="mt-0.5 block text-[11px] text-muted">
              Collection is blocked until payment is marked paid.
            </span>
          </span>
        </label>
      ) : null}

      {paymentWho === "receiver" && !showMarkPaid ? (
        <p className="font-body rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900">
          Destination staff must mark paid before releasing this parcel to the recipient.
        </p>
      ) : null}
    </div>
  );
}

export function paymentStatusBadge(parcel: {
  paymentWho?: "sender" | "receiver";
  paymentStatus?: "unpaid" | "paid";
}) {
  if (parcel.paymentStatus === "paid") {
    return {
      label: parcel.paymentWho === "receiver" ? "Paid by receiver" : "Paid by sender",
      className: "bg-emerald-50 text-emerald-800",
    };
  }
  if (parcel.paymentWho === "receiver") {
    return { label: "Receiver to pay", className: "bg-amber-50 text-amber-800" };
  }
  if (parcel.paymentWho === "sender") {
    return { label: "Sender unpaid", className: "bg-amber-50 text-amber-800" };
  }
  return { label: "Payment unset", className: "bg-slate-100 text-slate-600" };
}
