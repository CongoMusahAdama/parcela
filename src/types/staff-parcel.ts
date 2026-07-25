import type { ParcelTrackStatus, ParcelType } from "@/types/parcel";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";

export type StaffParcelItem = {
  parcelType: ParcelType;
  description: string;
  fragile: boolean;
};

export type StaffParcelSummary = {
  bookingReference: string;
  pickupCode: string;
  status: ParcelTrackStatus;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originStationName: string;
  destinationStationName: string;
  originStationId: string;
  destinationStationId: string;
  originStationCode?: string;
  destinationStationCode?: string;
  originCity?: string;
  destinationCity?: string;
  itemCount: number;
  direction: "outgoing" | "incoming";
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  /** Staff-chosen: who pays the transport fee. */
  paymentWho?: "sender" | "receiver";
  paymentStatus?: "unpaid" | "paid";
  paidAt?: string;
  /** Present on detail responses only — omitted from list summaries to keep payloads small. */
  items?: StaffParcelItem[];
  createdAt: string;
  updatedAt: string;
};

export type StaffParcelDetail = StaffParcelSummary & {
  items: StaffParcelItem[];
  driverName?: string;
  driverPhone?: string;
  expectedArrival?: string;
  arrivedAt?: string;
};

export function toStaffParcelDetail(parcel: StaffParcelSummary): StaffParcelDetail {
  return {
    ...parcel,
    items: parcel.items ?? [],
  };
}

export type BranchSummaryCounts = {
  total: number;
  pending_dropoff: number;
  in_transit: number;
  arrived: number;
  ready_for_collection: number;
  collected: number;
  outgoing: number;
  incoming: number;
  updatedToday: number;
};

/** Mirror backend branch summary counts from an already-loaded parcel list. */
export function computeBranchSummaryCounts(
  parcels: StaffParcelSummary[],
  stationId: string,
): BranchSummaryCounts {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const counts: BranchSummaryCounts = {
    total: parcels.length,
    pending_dropoff: 0,
    in_transit: 0,
    arrived: 0,
    ready_for_collection: 0,
    collected: 0,
    outgoing: 0,
    incoming: 0,
    updatedToday: 0,
  };

  for (const parcel of parcels) {
    if (parcel.status === "pending_dropoff" && parcel.originStationId === stationId) {
      counts.pending_dropoff++;
    } else if (parcel.status === "in_transit") {
      counts.in_transit++;
    } else if (parcel.status === "arrived" && parcel.destinationStationId === stationId) {
      counts.arrived++;
    } else if (
      parcel.status === "ready_for_collection" &&
      parcel.destinationStationId === stationId
    ) {
      counts.ready_for_collection++;
    } else if (parcel.status === "collected") {
      counts.collected++;
    }

    if (parcel.direction === "outgoing") counts.outgoing++;
    if (parcel.direction === "incoming") counts.incoming++;
    if (new Date(parcel.updatedAt) >= todayStart) counts.updatedToday++;
  }

  return counts;
}

export type StaffParcelStats = {
  total: number;
  pendingDropoff: number;
  inTransit: number;
  arrived: number;
  readyForCollection: number;
};

/** Parcels waiting for recipient pickup at this terminal (destination only). */
export function getCollectionQueueParcels(parcels: StaffParcelSummary[]): StaffParcelSummary[] {
  return parcels.filter(
    (parcel) => parcel.status === "ready_for_collection" && parcel.direction === "incoming",
  );
}

export function computeStaffParcelStats(parcels: StaffParcelSummary[]): StaffParcelStats {
  return {
    total: parcels.length,
    pendingDropoff: parcels.filter(
      (p) => p.status === "pending_dropoff" && p.direction === "outgoing",
    ).length,
    inTransit: parcels.filter((p) => p.status === "in_transit").length,
    arrived: parcels.filter((p) => p.status === "arrived" && p.direction === "incoming").length,
    readyForCollection: getCollectionQueueParcels(parcels).length,
  };
}

/** Staff-facing status — incoming bookings still at another origin are not awaiting drop-off here. */
export function getStaffStatusLabel(parcel: StaffParcelSummary): string {
  if (parcel.status === "pending_dropoff" && parcel.direction === "incoming") {
    return "Awaiting drop-off at origin";
  }
  if (parcel.status === "ready_for_collection" && parcel.direction === "outgoing") {
    return `Ready at ${parcel.destinationStationName}`;
  }
  return TRACK_STATUS_LABELS[parcel.status];
}

export function getPendingParcelsForVerify(parcels: StaffParcelSummary[], stationId: string) {
  return parcels.filter(
    (parcel) =>
      parcel.originStationId === stationId &&
      parcel.status === "pending_dropoff" &&
      parcel.direction === "outgoing",
  );
}
