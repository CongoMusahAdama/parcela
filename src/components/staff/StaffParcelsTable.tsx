"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Phone } from "lucide-react";
import { StaffParcelDetailDrawer } from "@/components/staff/StaffParcelDetailDrawer";
import { StaffTablePagination } from "@/components/staff/StaffTablePagination";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import { getStaffStatusLabel, toStaffParcelDetail } from "@/types/staff-parcel";
import { cn } from "@/lib/utils";

type StaffParcelsTableProps = {
  parcels: StaffParcelSummary[];
  pageSize?: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CLASS: Record<string, string> = {
  pending_dropoff: "bg-amber-50 text-amber-800",
  in_transit: "bg-sky-50 text-sky-800",
  arrived: "bg-violet-50 text-violet-800",
  ready_for_collection: "staff-status-ready",
  collected: "bg-slate-100 text-slate-600",
};

export function StaffParcelsTable({ parcels, pageSize = 6 }: StaffParcelsTableProps) {
  const [selected, setSelected] = useState<StaffParcelSummary | null>(null);
  const [page, setPage] = useState(1);
  const detail = selected ? toStaffParcelDetail(selected) : null;

  const totalPages = Math.max(1, Math.ceil(parcels.length / pageSize));
  const paginatedParcels = useMemo(
    () => parcels.slice((page - 1) * pageSize, page * pageSize),
    [parcels, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [parcels.length]);

  if (parcels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center shadow-sm sm:rounded-2xl sm:p-10">
        <p className="font-display text-sm font-semibold text-foreground">No parcels yet</p>
        <p className="font-body mt-1 text-xs text-muted">
          Parcels for this station will appear here after senders book online.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5 xl:hidden">
        {paginatedParcels.map((parcel) => (
          <article
            key={parcel.bookingReference}
            className="rounded-xl border border-border bg-surface p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-foreground">{parcel.bookingReference}</p>
                <p className="font-mono text-[10px] text-muted">{parcel.pickupCode}</p>
              </div>
              <span
                className={cn(
                  "font-display shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  STATUS_CLASS[parcel.status] ?? "bg-slate-100 text-slate-600",
                )}
              >
                {getStaffStatusLabel(parcel)}
              </span>
            </div>
            <div className="mt-2.5 space-y-1 text-xs">
              <p className="font-body text-foreground">
                <span className="text-muted">From </span>
                {parcel.senderName}
              </p>
              <p className="font-body text-foreground">
                <span className="text-muted">To </span>
                {parcel.recipientName}
              </p>
              <p className="font-body text-muted">
                {parcel.destinationStationName}
                <span
                  className={cn(
                    "ml-1.5 inline-block rounded px-1 py-0.5 text-[9px] font-semibold uppercase",
                    parcel.direction === "outgoing"
                      ? "bg-background text-muted"
                      : "bg-[var(--staff-accent-muted)] text-[var(--staff-accent-dark)]",
                  )}
                >
                  {parcel.direction === "outgoing" ? "out" : "in"}
                </span>
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(parcel)}
                className="font-display inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-[11px] font-semibold text-foreground"
              >
                <Eye className="size-3.5" />
                View
              </button>
              <a
                href={`tel:${parcel.senderPhone}`}
                className="font-display inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-white"
                style={{ background: "var(--staff-accent)" }}
              >
                <Phone className="size-3.5" />
                Call
              </a>
            </div>
          </article>
        ))}
        <StaffTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={parcels.length}
          pageSize={pageSize}
          itemLabel="parcels"
          onPageChange={setPage}
        />
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-sm xl:block xl:rounded-2xl">
        <div className="operator-portal-table-scroll max-h-[min(58vh,680px)] overflow-y-auto">
          <table className="w-full min-w-[720px] border-collapse text-left xl:min-w-[880px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider">
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Reference
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Sender
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Recipient
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Destination
                </th>
                <th
                  className="font-display sticky top-0 z-10 hidden px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)] xl:table-cell"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Items
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Status
                </th>
                <th
                  className="font-display sticky top-0 z-10 hidden px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)] lg:table-cell"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Updated
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedParcels.map((parcel) => (
                <tr
                  key={parcel.bookingReference}
                  className="border-b border-border/80 last:border-0 hover:bg-background/60"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs font-semibold text-foreground">
                      {parcel.bookingReference}
                    </p>
                    <p className="font-mono mt-0.5 text-[10px] text-muted">{parcel.pickupCode}</p>
                  </td>
                  <td className="font-body px-4 py-3.5 text-sm text-foreground">
                    {parcel.senderName}
                  </td>
                  <td className="font-body px-4 py-3.5 text-sm text-foreground">
                    {parcel.recipientName}
                  </td>
                  <td className="font-body px-4 py-3.5 text-sm text-muted">
                    {parcel.destinationStationName}
                    <span
                      className={cn(
                        "ml-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        parcel.direction === "outgoing"
                          ? "bg-background text-muted"
                          : "bg-[var(--staff-accent-muted)] text-[var(--staff-accent-dark)]"
                      )}
                    >
                      {parcel.direction === "outgoing" ? "out" : "in"}
                    </span>
                  </td>
                  <td className="font-body hidden px-4 py-3.5 text-sm text-muted xl:table-cell">{parcel.itemCount}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "font-display inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_CLASS[parcel.status] ?? "bg-slate-100 text-slate-600"
                      )}
                    >
                      {getStaffStatusLabel(parcel)}
                    </span>
                  </td>
                  <td className="font-body hidden px-4 py-3.5 text-xs text-muted lg:table-cell">
                    {formatDate(parcel.updatedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelected(parcel)}
                        className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <a
                        href={`tel:${parcel.senderPhone}`}
                        className="font-display inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--staff-accent)" }}
                        title={`Call ${parcel.senderName}`}
                      >
                        <Phone className="size-3.5" />
                        <span className="hidden sm:inline">Contact</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StaffTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={parcels.length}
          pageSize={pageSize}
          itemLabel="parcels"
          onPageChange={setPage}
        />
      </div>

      <StaffParcelDetailDrawer parcel={detail} onClose={() => setSelected(null)} />
    </>
  );
}
