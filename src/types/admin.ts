import type { Operator } from "@/types/parcel";

/** HQ operator admin — provisioned by Parcela; configures transport after first login. */
export type AdminAccount = {
  id: string;
  email: string;
  displayName: string;
  /** Set once the operator completes transport setup in HQ. */
  operator: Operator | null;
  operatorConfigured: boolean;
};

export type AdminSession = {
  admin: AdminAccount;
  signedInAt: string;
};

export type AdminBranchStatus = "healthy" | "attention" | "offline";

export type AdminBranchSnapshot = {
  id: string;
  name: string;
  code: string;
  city: string;
  leadName: string | null;
  totalStaff: number;
  /** All-time parcels logged at this branch. */
  totalParcels: number;
  /** All-time parcels collected at this branch. */
  totalCollected: number;
  /** Currently in transit from this branch. */
  inTransit: number;
  /** Currently awaiting recipient collection. */
  readyForCollection: number;
  staffOnline: number;
  status: AdminBranchStatus;
};

export type AdminNetworkAlert = {
  id: string;
  severity: "info" | "warning";
  message: string;
  branchName?: string;
};

export type AdminNetworkOverview = {
  operatorLabel: string;
  branchCount: number;
  activeLeads: number;
  activeStaff: number;
  /** All-time parcels logged across the operator network. */
  totalParcels: number;
  /** Parcels currently in transit network-wide. */
  inTransit: number;
  /** Parcels currently awaiting recipient collection. */
  readyForCollection: number;
  /** All-time parcels collected by recipients. */
  totalCollected: number;
  alerts: AdminNetworkAlert[];
  branches: AdminBranchSnapshot[];
};

export type AdminParcelStatus =
  | "pending_dropoff"
  | "in_transit"
  | "arrived"
  | "ready_for_collection"
  | "collected";

export type AdminParcelRow = {
  bookingReference: string;
  status: AdminParcelStatus | string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originStationId: string;
  originStationName: string;
  originStationCode: string;
  originCity: string | null;
  destinationStationId: string;
  destinationStationName: string;
  destinationCity: string | null;
  itemCount: number;
  busNumber: string | null;
  arrivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminParcelListResult = {
  items: AdminParcelRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
