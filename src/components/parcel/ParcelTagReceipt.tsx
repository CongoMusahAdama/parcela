"use client";

import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { OPERATOR_LABELS } from "@/lib/operators";
import type { ParcelTagFields } from "@/lib/parcel-tag";
import { cn } from "@/lib/utils";

function TagDivider() {
  return <div className="border-t border-dashed border-[#94a3b8]" />;
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
          "font-display font-bold uppercase tracking-wide text-[#475569]",
          emphasized ? "text-[11px]" : "text-[10px]"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-bold leading-snug text-[#0f172a] break-words",
          emphasized ? "text-[15px]" : "text-[13px]",
          mono && "font-mono tracking-wide"
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

  return (
    <div
      id={id}
      className={cn(
        "relative isolate box-border w-full overflow-hidden border-2 border-[#cbd5e1] bg-white text-[#0f172a] shadow-sm",
        className
      )}
    >
      <OperatorLogo
        operator={tag.operator}
        variant="watermark"
        className={emphasized ? "opacity-[0.1]" : "opacity-[0.22]"}
      />

      <div
        className={cn(
          "relative z-10 bg-white/90",
          compact ? "px-4 py-3" : "px-4 py-3"
        )}
      >
        <div className="flex items-center gap-2 border-b-2 border-[#0f172a] pb-2">
          <OperatorLogo operator={tag.operator} className={compact ? "h-6" : "h-8"} />
          <p className="font-display text-[11px] font-bold uppercase tracking-wide text-[#475569]">
            {OPERATOR_LABELS[tag.operator]} · Parcel tag
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-[#0f172a]/15 bg-[#f8fafc] px-3 py-2.5">
          <p className="font-display text-center text-[11px] font-bold uppercase tracking-widest text-[#475569]">
            Receipt no.
          </p>
          <p
            className={cn(
              "font-mono mt-1 text-center font-black leading-none tracking-tight text-[#0f172a]",
              compact ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            )}
          >
            {tag.receiptNumber}
          </p>
        </div>

        <div
          className={cn(
            "mt-3 grid gap-x-4 gap-y-2",
            compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
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
            "grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 text-center",
            compact ? "py-2.5" : "py-3"
          )}
        >
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-[#475569]">
              Origin
            </p>
            <p
              className={cn(
                "font-display mt-1 font-black uppercase leading-none text-[#0f172a]",
                compact ? "text-base sm:text-xl" : "text-lg"
              )}
            >
              {tag.originRouteLabel}
            </p>
            <p className="font-body mt-1 text-xs font-medium text-[#475569]">
              {tag.originStationName}
            </p>
          </div>
          <p className="font-display text-2xl font-black text-[#0d9488] sm:text-3xl">→</p>
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-[#475569]">
              Destination
            </p>
            <p
              className={cn(
                "font-display mt-1 font-black uppercase leading-none text-[#0f172a]",
                compact ? "text-base sm:text-xl" : "text-lg"
              )}
            >
              {tag.destinationRouteLabel}
            </p>
            <p className="font-body mt-1 text-xs font-medium text-[#475569]">
              {tag.destinationStationName}
            </p>
          </div>
        </div>

        <TagDivider />

        <div
          className={cn(
            "grid gap-x-4 gap-y-2 py-2",
            compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
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
            "grid gap-x-3 gap-y-2 py-2",
            compact
              ? "grid-cols-2 sm:grid-cols-[1.3fr_0.45fr_0.3fr_0.5fr_0.65fr]"
              : "grid-cols-[1.4fr_0.6fr_0.5fr]"
          )}
        >
          <TagField label="Contents" value={tag.contents} emphasized={emphasized} />
          <TagField label="Desc." value={tag.descriptionCode} mono emphasized={emphasized} />
          <TagField label="Count" value={String(tag.itemCount)} emphasized={emphasized} />
          {compact && isCounter && tag.busNumber && (
            <TagField label="Bus no." value={tag.busNumber} mono emphasized={emphasized} />
          )}
          {compact && isCounter && tag.driverPhone && (
            <TagField label="Driver" value={tag.driverPhone} mono emphasized={emphasized} />
          )}
        </div>

        {!compact && (
          <>
            <TagDivider />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2">
              <TagField label="Status" value={tag.statusLabel} emphasized={emphasized} />
              {isCounter && tag.busNumber ? (
                <TagField label="Bus no." value={tag.busNumber} mono emphasized={emphasized} />
              ) : (
                <TagField label="Transport" value={OPERATOR_LABELS[tag.operator]} emphasized={emphasized} />
              )}
            </div>
            {isCounter && tag.driverPhone && (
              <>
                <TagDivider />
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2">
                  <TagField label="Driver phone" value={tag.driverPhone} mono emphasized={emphasized} />
                  {tag.driverName ? (
                    <TagField label="Driver name" value={tag.driverName} emphasized={emphasized} />
                  ) : null}
                </div>
              </>
            )}
          </>
        )}

        {!compact &&
          (isCounter ? (
            <p className="font-body border-t border-dashed border-[#94a3b8] pt-2 text-xs leading-relaxed text-[#475569]">
              Copy these details onto the blank parcel tag and attach it to the parcel before loading
              the bus.
            </p>
          ) : (
            <p className="font-body border-t border-dashed border-[#94a3b8] pt-2 text-xs leading-relaxed text-[#475569]">
              Show this receipt at {tag.originStationName}. Staff will verify your parcel and fill the
              physical tag at the counter.
            </p>
          ))}
      </div>

      <div className="relative z-10 bg-[#0f172a] py-2 text-center">
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-white sm:text-sm">
          {tag.pickupCode.replace(/-/g, "")}
        </p>
      </div>
    </div>
  );
}
