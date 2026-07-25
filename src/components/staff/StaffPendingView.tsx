"use client";

import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { StaffPendingTable } from "@/components/staff/StaffPendingTable";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";

export function StaffPendingView() {
  const { staff } = useStaffSession();
  const { parcels, loading } = useStaffParcels();
  const [query, setQuery] = useState("");

  const pending = useMemo(() => {
    return parcels
      .filter((p) => p.status === "pending_dropoff" && p.direction === "outgoing")
      .filter((p) => matchesStaffParcelQuery(p, query))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [parcels, query]);

  return (
    <main className="operator-portal-main">
      <StaffPageHeader
        title="Awaiting drop-off"
        description="Pre-booked parcels where the sender will drop off at your counter (outgoing only). Verify the physical parcel, then log it to a bus."
        badge={`${pending.length} pending`}
        meta={staff.stationName}
      />

      <div className="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3.5">
        <p className="font-body text-sm leading-relaxed text-amber-900">
          <span className="font-semibold">Staff tip:</span> Ask the sender for their booking
          reference or name, match the parcel details, then tap{" "}
          <span className="font-semibold">Verify &amp; log</span> to assign a bus and issue the
          receipt.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, sender, or destination…"
          className="font-body w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-[var(--staff-accent)]"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          Loading pending parcels…
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
          >
            <Package className="size-7" strokeWidth={2.25} />
          </div>
          <p className="font-display mt-5 text-lg font-bold text-foreground">
            {query ? "No matching parcels" : "No parcels awaiting drop-off"}
          </p>
          <p className="font-body mt-2 text-sm text-muted">
            {query
              ? "Try a different reference or sender name."
              : "New online or walk-in bookings for your station will show up here."}
          </p>
        </div>
      ) : (
        <StaffPendingTable parcels={pending} />
      )}
    </main>
  );
}
