"use client";

import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { isLegacyOperator } from "@/lib/admin-operator";
import { getOperatorLabel } from "@/lib/operators";
import type { ParcelTagFields } from "@/lib/parcel-tag";
import { cn } from "@/lib/utils";

function TagDivider() {
  return <div className="border-t border-dashed border-[#cbd5e1]" />;
}

function TagField({
  label,
  value,
  className,
  mono = false,
  emphasized = false,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p
        className={cn(
          "font-display font-bold uppercase tracking-wide text-[#64748b]",
          emphasized ? "text-[10px]" : "text-[9px]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-semibold leading-snug text-[#0f172a] break-words",
          emphasized ? "text-sm" : "text-[13px]",
          mono && "font-mono tracking-wide",
        )}
      >
        {value}
      </p>
    </div>
  );
}

type ParcelTagReceiptProps = {
  tag: ParcelTagFields;
  id?: string;
  variant?: "counter-tag" | "pre-booking";
  compact?: boolean;
  className?: string;
};

export function ParcelTagReceipt({
  tag,
  id,
  variant = "counter-tag",
  compact = false,
  className,
}: ParcelTagReceiptProps) {
  const isCounter = variant === "counter-tag";
  const emphasized = compact || isCounter;
  const operatorLabel = getOperatorLabel(tag.operator);

  return (
    <div
      id={id}
      className={cn(
        "relative isolate box-border w-full overflow-hidden rounded-xl border-2 border-[#cbd5e1] bg-white text-[#0f172a] shadow-[0_8px_28px_-8px_rgb(15_23_42_/_0.18)]",
        className,
      )}
    >
      <div className="h-1.5 bg-[#0d9488]" aria-hidden />

      {isLegacyOperator(tag.operator) ? (
        <OperatorLogo
          operator={tag.operator}
          variant="watermark"
          className={emphasized ? "opacity-[0.08]" : "opacity-[0.18]"}
        />
      ) : null}

      <div className={cn("relative z-10 bg-white/95", compact ? "px-4 py-3.5" : "px-4 py-4")}>
        <div className="flex items-center gap-3 border-b border-[#0f172a]/10 pb-3">
          {isLegacyOperator(tag.operator) ? (
            <OperatorLogo operator={tag.operator} className={compact ? "h-7" : "h-8"} />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0d9488]/10 font-display text-xs font-bold uppercase text-[#0d9488]">
              {operatorLabel.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-bold uppercase tracking-wide text-[#0f172a]">
              {operatorLabel}
            </p>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Parcel tag
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border-2 border-[#0f172a] bg-[#f8fafc] px-3 py-3">
          <p className="font-display text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">
            Receipt no.
          </p>
          <p
            className={cn(
              "font-mono mt-1 text-center font-black leading-none tracking-tight text-[#0f172a]",
              compact ? "text-xl sm:text-2xl" : "text-lg sm:text-xl",
            )}
          >
            {tag.receiptNumber}
          </p>
        </div>

        <div
          className={cn(
            "mt-3 grid gap-3 rounded-lg bg-[#f8fafc] p-3",
            compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
          )}
        >
          <TagField label="Tracking ID" value={tag.pickupCode} mono emphasized={emphasized} />
          <TagField label="Date & time" value={tag.dateTime} emphasized={emphasized} />
          <TagField
            label="Booking ref"
            value={tag.bookingReference}
            mono
            emphasized={emphasized}
            className={compact ? "col-span-2 sm:col-span-1" : "col-span-2"}
          />
        </div>

        <TagDivider />

        <div
          className={cn(
            "grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 text-center",
            compact ? "py-3" : "py-3.5",
          )}
        >
          <div className="min-w-0">
            <p className="font-display text-[9px] font-bold uppercase tracking-wide text-[#64748b]">
              Origin
            </p>
            <p
              className={cn(
                "font-display mt-1 font-black uppercase leading-tight text-[#0f172a]",
                compact ? "text-base sm:text-lg" : "text-lg",
              )}
            >
              {tag.originRouteLabel}
            </p>
            <p className="font-body mt-1 truncate text-[11px] font-medium text-[#64748b]">
              {tag.originStationName}
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0d9488]/10">
            <span className="font-display text-lg font-black text-[#0d9488]">→</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-[9px] font-bold uppercase tracking-wide text-[#64748b]">
              Destination
            </p>
            <p
              className={cn(
                "font-display mt-1 font-black uppercase leading-tight text-[#0f172a]",
                compact ? "text-base sm:text-lg" : "text-lg",
              )}
            >
              {tag.destinationRouteLabel}
            </p>
            <p className="font-body mt-1 truncate text-[11px] font-medium text-[#64748b]">
              {tag.destinationStationName}
            </p>
          </div>
        </div>

        <TagDivider />

        <div
          className={cn(
            "grid gap-3 py-3",
            compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
          )}
        >
          <TagField label="Sender" value={tag.senderName} emphasized={emphasized} />
          <TagField label="Contact" value={tag.senderPhone} mono emphasized={emphasized} />
          <TagField label="Receiver" value={tag.recipientName} emphasized={emphasized} />
          <TagField label="Contact" value={tag.recipientPhone} mono emphasized={emphasized} />
        </div>

        <TagDivider />

        <div
          className={cn(
            "grid gap-3 py-3",
            compact
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-[1.4fr_0.6fr_0.5fr]",
          )}
        >
          <TagField label="Contents" value={tag.contents} emphasized={emphasized} />
          <TagField label="Desc." value={tag.descriptionCode} mono emphasized={emphasized} />
          <TagField label="Count" value={String(tag.itemCount)} emphasized={emphasized} />
        </div>

        {isCounter && (tag.busNumber || tag.driverPhone) ? (
          <>
            <TagDivider />
            <div className="grid gap-3 rounded-lg border border-[#0d9488]/20 bg-[#0d9488]/5 p-3 sm:grid-cols-3">
              {tag.busNumber ? (
                <TagField label="Bus no." value={tag.busNumber} mono emphasized={emphasized} />
              ) : null}
              {tag.driverPhone ? (
                <TagField label="Driver phone" value={tag.driverPhone} mono emphasized={emphasized} />
              ) : null}
              {tag.driverName ? (
                <TagField label="Driver name" value={tag.driverName} emphasized={emphasized} />
              ) : null}
            </div>
          </>
        ) : null}

        {!compact && (
          <>
            <TagDivider />
            <div className="grid grid-cols-2 gap-3 py-3">
              <TagField label="Status" value={tag.statusLabel} emphasized={emphasized} />
              <TagField label="Transport" value={operatorLabel} emphasized={emphasized} />
            </div>
          </>
        )}

        {!compact &&
          (isCounter ? (
            <p className="font-body border-t border-dashed border-[#cbd5e1] pt-3 text-xs leading-relaxed text-[#64748b]">
              Copy these details onto the blank parcel tag and attach it to the parcel before loading
              the bus.
            </p>
          ) : (
            <p className="font-body border-t border-dashed border-[#cbd5e1] pt-3 text-xs leading-relaxed text-[#64748b]">
              Show this receipt at {tag.originStationName}. Staff will verify your parcel and fill the
              physical tag at the counter.
            </p>
          ))}
      </div>

      <div className="relative z-10 bg-[#0f172a] px-3 py-2.5 text-center">
        <p className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-white/70">
          Tracking shorthand
        </p>
        <p className="font-mono mt-0.5 text-sm font-bold tracking-[0.18em] text-white sm:text-base">
          {tag.pickupCode.replace(/-/g, "")}
        </p>
      </div>
    </div>
  );
}
