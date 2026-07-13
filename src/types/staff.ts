import type { Operator } from "@/types/parcel";

export type StaffRole = "station_staff" | "station_lead";

export type StaffAccount = {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  operator: Operator | string;
  stationId: string;
  stationName: string;
  stationCode: string;
  location?: string;
  active?: boolean;
  mustChangePassword?: boolean;
};

export type StaffSession = {
  staff: StaffAccount;
  signedInAt: string;
  /** Present only in frontend demo mode — never stored for live API sessions */
  token?: string;
};
