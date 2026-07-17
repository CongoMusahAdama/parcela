"use client";

import Link from "next/link";
import { Eye, KeyRound, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StaffCollectionQueueCard } from "@/components/staff/StaffCollectionQueueCard";
import { StaffParcelDetailDrawer } from "@/components/staff/StaffParcelDetailDrawer";
import { StaffTablePagination } from "@/components/staff/StaffTablePagination";
import { toStaffParcelDetail } from "@/types/staff-parcel";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type StaffCollectionQueueTableProps = {
  parcels: StaffParcelSummary[];
  pageSize?: number;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWaitingDays(iso: string) {
  const updated = new Date(iso).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

export function StaffCollectionQueueTable({
  parcels,
  pageSize = 8,
}: StaffCollectionQueueTableProps) {
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

  return (
    <>
      <div className="space-y-2.5 xl:hidden">
        {paginatedParcels.map((parcel) => (
          <StaffCollectionQueueCard
            key={parcel.bookingReference}
            parcel={parcel}
            onView={() => setSelected(parcel)}
          />
        ))}
        <StaffTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={parcels.length}
          pageSize={pageSize}
          itemLabel="queue parcels"
          onPageChange={setPage}
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm xl:block">
        <div className="operator-portal-table-scroll max-h-[min(62vh,720px)] overflow-y-auto">
          <table className="w-full min-w-[720px] border-collapse text-left xl:min-w-[980px]">
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
                  Pickup code
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
                  Phone
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Origin
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Items
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Ready since
                </th>
                <th
                  className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                  style={{ background: "var(--staff-accent-muted)" }}
                >
                  Days waiting
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
              {paginatedParcels.map((parcel) => {
                const waitingDays = getWaitingDays(parcel.updatedAt);
                const chargeableDays = Math.max(waitingDays - 1, 0);
                const possibleFee = chargeableDays * 5;

                return (
                  <tr
                    key={parcel.bookingReference}
                    className="border-b border-border/80 last:border-0 hover:bg-background/60"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {parcel.bookingReference}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[11px] text-foreground">
                        <KeyRound className="size-3.5 text-muted" />
                        {parcel.pickupCode}
                      </span>
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-foreground">
                      {parcel.recipientName}
                    </td>
                    <td className="font-mono px-4 py-3.5 text-xs text-muted">
                      {parcel.recipientPhone}
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-muted">
                      {parcel.originStationName}
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-muted">{parcel.itemCount}</td>
                    <td className="font-body px-4 py-3.5 text-xs text-muted">
                      {formatDateTime(parcel.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <p className="font-display text-sm font-bold text-foreground">
                          Day {waitingDays + 1}
                        </p>
                        <p className="font-body text-[11px] text-muted">
                          {chargeableDays > 0 ? `Possible fee: GHS ${possibleFee}` : "No fee yet"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/staff/release"
                          className="font-display inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white"
                          style={{ background: "var(--staff-accent)" }}
                        >
                          Recipient pickup
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelected(parcel)}
                          className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                        <a
                          href={`tel:${parcel.recipientPhone}`}
                          className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                        >
                          <Phone className="size-3.5" />
                          Contact
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <StaffTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={parcels.length}
          pageSize={pageSize}
          itemLabel="queue parcels"
          onPageChange={setPage}
        />
      </div>

      <StaffParcelDetailDrawer parcel={detail} onClose={() => setSelected(null)} />
    </>
  );
}
