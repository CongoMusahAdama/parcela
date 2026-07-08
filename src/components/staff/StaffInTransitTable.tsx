"use client";

import { Eye, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StaffInTransitParcelCard } from "@/components/staff/StaffInTransitParcelCard";
import { StaffParcelDetailDrawer } from "@/components/staff/StaffParcelDetailDrawer";
import { StaffTablePagination } from "@/components/staff/StaffTablePagination";
import { toStaffParcelDetail } from "@/types/staff-parcel";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type StaffInTransitTableProps = {
  parcels: StaffParcelSummary[];
  pageSize?: number;
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffInTransitTable({ parcels, pageSize = 8 }: StaffInTransitTableProps) {
  const [selected, setSelected] = useState<StaffParcelSummary | null>(null);
  const [page, setPage] = useState(1);
  const detail = selected ? toStaffParcelDetail(selected) : null;

  const totalPages = Math.max(1, Math.ceil(parcels.length / pageSize));
  const paginatedParcels = useMemo(
    () => parcels.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize, parcels]
  );

  useEffect(() => {
    setPage(1);
  }, [parcels.length]);

  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {paginatedParcels.map((parcel) => (
          <StaffInTransitParcelCard
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
          itemLabel="in-transit parcels"
          onPageChange={setPage}
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:block">
        <div className="max-h-[min(62vh,720px)] overflow-auto">
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider">
                {["Reference", "Bus", "Direction", "Sender", "Recipient", "Route", "Items", "Updated", "Actions"].map((label) => (
                  <th
                    key={label}
                    className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                    style={{ background: "rgb(224 242 254)" }}
                  >
                    {label}
                  </th>
                ))}
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
                    <td className="font-mono px-4 py-3.5 text-xs text-foreground">
                      {parcel.busNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold uppercase text-muted">
                        {parcel.direction === "outgoing" ? "Departed" : "Incoming"}
                      </span>
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-foreground">{parcel.senderName}</td>
                    <td className="font-body px-4 py-3.5 text-sm text-foreground">{parcel.recipientName}</td>
                    <td className="font-body px-4 py-3.5 text-sm text-muted">
                      {parcel.originStationName} → {parcel.destinationStationName}
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-muted">{parcel.itemCount}</td>
                    <td className="font-body px-4 py-3.5 text-xs text-muted">{formatUpdated(parcel.updatedAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelected(parcel)}
                          className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                        <a
                          href={`tel:${parcel.senderPhone}`}
                          className="font-display inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white"
                          style={{ background: "var(--staff-accent)" }}
                        >
                          <Phone className="size-3.5" />
                          Contact
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
          itemLabel="in-transit parcels"
          onPageChange={setPage}
        />
      </div>

      <StaffParcelDetailDrawer parcel={detail} onClose={() => setSelected(null)} />
    </>
  );
}
