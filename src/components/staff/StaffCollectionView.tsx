"use client";

import { useMemo, useState } from "react";
import { KeyRound, Search } from "lucide-react";
import { StaffCollectionQueueTable } from "@/components/staff/StaffCollectionQueueTable";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";
import { getCollectionQueueParcels } from "@/types/staff-parcel";

export function StaffCollectionView() {
  const { staff } = useStaffSession();
  const { parcels, loading } = useStaffParcels();
  const [query, setQuery] = useState("");

  const queue = useMemo(() => {
    return getCollectionQueueParcels(parcels)
      .filter((p) => matchesStaffParcelQuery(p, query))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [parcels, query]);

  const fromOutside = queue.filter((p) => p.direction === "incoming").length;
  const overdue = queue.filter((p) => {
    const days = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days >= 1;
  }).length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StaffPageHeader
        title="Collection queue"
        description="Parcels received at your terminal and waiting for the recipient to arrive for pickup."
        badge={`${queue.length} waiting`}
        meta={staff.stationName}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Waiting recipients
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{queue.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Arrived from other stations
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{fromOutside}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Possible charge cases
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{overdue}</p>
        </div>
      </div>

      <div className="staff-collection-tip mb-6 rounded-2xl border px-4 py-3.5">
        <p className="font-body text-sm leading-relaxed">
          <span className="font-semibold">Staff tip:</span> Only parcels destined for{" "}
          <span className="font-semibold">{staff.stationName}</span> appear here. Parcels you sent
          to other stations stay on your overview as &quot;Ready at [destination]&quot; until the
          recipient collects them there. Release parcels at{" "}
          <span className="font-semibold">Recipient pickup</span> when the recipient arrives with
          their pickup code.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, recipient, or pickup code…"
          className="font-body w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-[var(--staff-accent)]"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          Loading collection queue…
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
          >
            <KeyRound className="size-7" strokeWidth={2.25} />
          </div>
          <p className="font-display mt-5 text-lg font-bold text-foreground">
            {query ? "No matching parcels" : "No parcels in the collection queue"}
          </p>
          <p className="font-body mt-2 text-sm text-muted">
            {query
              ? "Try a different recipient, reference, or pickup code."
              : "Parcels will appear here after they are marked ready for collection."}
          </p>
        </div>
      ) : (
        <StaffCollectionQueueTable parcels={queue} />
      )}
    </main>
  );
}
