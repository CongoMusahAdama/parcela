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
  itemCount: number;
  direction: "outgoing" | "incoming";
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  items: StaffParcelItem[];
  createdAt: string;
  updatedAt: string;
};

export type StaffParcelDetail = StaffParcelSummary & {
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
