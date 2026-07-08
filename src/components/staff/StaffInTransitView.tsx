"use client";

import { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";
import { StaffInTransitTable } from "@/components/staff/StaffInTransitTable";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";

export function StaffInTransitView() {
  const { staff } = useStaffSession();
  const { parcels, loading } = useStaffParcels();
  const [query, setQuery] = useState("");

  const inTransit = useMemo(() => {
    return parcels
      .filter((p) => p.status === "in_transit")
      .filter((p) => matchesStaffParcelQuery(p, query))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [parcels, query]);

  const outgoing = inTransit.filter((p) => p.direction === "outgoing").length;
  const incoming = inTransit.filter((p) => p.direction === "incoming").length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StaffPageHeader
        title="In transit"
        description="Parcels currently on buses — ones you sent out and ones heading to your station."
        badge={`${inTransit.length} on the road`}
        meta={staff.stationName}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Departed from you
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{outgoing}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Heading to you
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{incoming}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-sky-200/60 bg-sky-50/80 px-4 py-3.5">
        <p className="font-body text-sm leading-relaxed text-sky-900">
          <span className="font-semibold">Staff tip:</span> Use the bus number to find parcels on a
          specific coach. Destination staff confirm bus arrival to alert recipients by SMS.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, bus route, or name…"
          className="font-body w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-[var(--staff-accent)]"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          Loading in-transit parcels…
        </div>
      ) : inTransit.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
          >
            <Truck className="size-7" strokeWidth={2.25} />
          </div>
          <p className="font-display mt-5 text-lg font-bold text-foreground">
            {query ? "No matching parcels" : "No parcels in transit"}
          </p>
          <p className="font-body mt-2 text-sm text-muted">
            {query
              ? "Try a different reference or destination."
              : "Parcels appear here after they are logged to a bus from your station."}
          </p>
        </div>
      ) : (
        <StaffInTransitTable parcels={inTransit} />
      )}
    </main>
  );
}
