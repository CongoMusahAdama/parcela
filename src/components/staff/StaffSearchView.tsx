"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { StaffParcelsLoading } from "@/components/staff/StaffParcelsLoading";
import { StaffParcelsTable } from "@/components/staff/StaffParcelsTable";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { matchesStaffParcelSearch } from "@/lib/staff-parcel-filters";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";
import type { ParcelTrackStatus } from "@/types/parcel";
import { cn } from "@/lib/utils";

type StatusFilter = ParcelTrackStatus | "all";
type DirectionFilter = "all" | "outgoing" | "incoming";

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All statuses" },
  { id: "pending_dropoff", label: "Awaiting drop-off" },
  { id: "in_transit", label: "In transit" },
  { id: "arrived", label: "Arrived" },
  { id: "ready_for_collection", label: "Ready to collect" },
  { id: "collected", label: "Collected" },
];

const DIRECTION_FILTERS: Array<{ id: DirectionFilter; label: string; icon?: typeof ArrowUpRight }> =
  [
    { id: "all", label: "All directions" },
    { id: "outgoing", label: "Outgoing", icon: ArrowUpRight },
    { id: "incoming", label: "Incoming", icon: ArrowDownLeft },
  ];

const SEARCH_HINTS = [
  "PCL-XXXX-XXXX",
  "PKP-XXXX",
  "VIP-4521",
  "0244123456",
];

export function StaffSearchView() {
  const { staff } = useStaffSession();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");

  const { parcels: allParcels, loading } = useStaffParcels();

  const results = useMemo(() => {
    return allParcels
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter((p) => directionFilter === "all" || p.direction === directionFilter)
      .filter((p) => matchesStaffParcelSearch(p, query))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allParcels, statusFilter, directionFilter, query]);

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== "all" || directionFilter !== "all";

  return (
    <main className="operator-portal-main">
      <StaffPageHeader
        title="Search parcels"
        description="Find any parcel linked to your station by reference, name, phone, bus number, or destination."
        badge={`${results.length} found`}
        meta={staff.stationName}
      />

      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, pickup code, sender, recipient, phone, bus, or station…"
            className="font-body w-full rounded-xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-[var(--staff-accent)]"
            autoFocus
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="font-body text-xs text-muted">Try:</p>
          {SEARCH_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setQuery(hint)}
              className="font-mono rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-display inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          <SlidersHorizontal className="size-3.5" />
          Status
        </span>
        {STATUS_FILTERS.map(({ id, label }) => {
          const active = statusFilter === id;
          const count =
            id === "all"
              ? allParcels.length
              : allParcels.filter((p) => p.status === id).length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={cn(
                "font-display rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "border-[var(--staff-accent)] text-white"
                  : "border-border bg-surface text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
              )}
              style={active ? { background: "var(--staff-accent)" } : undefined}
            >
              {label}
              <span className={cn("ml-1.5", active ? "text-white/85" : "text-muted")}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
          Direction
        </span>
        {DIRECTION_FILTERS.map(({ id, label, icon: Icon }) => {
          const active = directionFilter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setDirectionFilter(id)}
              className={cn(
                "font-display inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "border-[var(--staff-accent)] bg-[var(--staff-accent-muted)] text-[var(--staff-accent-dark)]"
                  : "border-border bg-surface text-foreground hover:border-[var(--staff-accent)]"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setDirectionFilter("all");
            }}
            className="font-display ml-auto text-[11px] font-semibold text-[var(--staff-accent)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-sm text-muted">
          {hasActiveFilters ? (
            <>
              Showing <span className="font-semibold text-foreground">{results.length}</span> of{" "}
              {allParcels.length} parcels
            </>
          ) : (
            <>
              All <span className="font-semibold text-foreground">{allParcels.length}</span> parcels
              at your station
            </>
          )}
        </p>
        {statusFilter !== "all" && (
          <span className="font-display rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            {TRACK_STATUS_LABELS[statusFilter]}
          </span>
        )}
      </div>

      {loading ? (
        <StaffParcelsLoading message="Loading parcels for search…" />
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
          >
            <Search className="size-7" strokeWidth={2.25} />
          </div>
          <p className="font-display mt-5 text-lg font-bold text-foreground">No parcels found</p>
          <p className="font-body mt-2 text-sm text-muted">
            Try a booking reference, pickup code, sender or recipient name, phone number, or bus
            number.
          </p>
        </div>
      ) : (
        <StaffParcelsTable parcels={results} pageSize={8} />
      )}
    </main>
  );
}
