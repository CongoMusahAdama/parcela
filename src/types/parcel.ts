export type Operator = "VIP" | "STC";

export type Station = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  hours: string;
  lat: number;
  lng: number;
  operator: Operator;
};

export type ParcelType = "document" | "box" | "envelope" | "other";

export type BookingItem = {
  id: string;
  parcelType: ParcelType;
  description: string;
  fragile: boolean;
};

export type ParcelTrackStatus =
  | "pending_dropoff"
  | "in_transit"
  | "arrived"
  | "ready_for_collection"
  | "collected";

export type PreBooking = {
  bookingReference: string;
  /** One tracking ID for every item in this booking */
  pickupCode: string;
  status: "pending_dropoff";
  stationId: string;
  stationName: string;
  stationCode: string;
  operator?: Operator;
  destinationOperator?: Operator;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationStationId: string;
  destinationStationName: string;
  items: BookingItem[];
  createdAt: string;
};

export type TrackedParcel = {
  pickupCode: string;
  bookingReference: string;
  trackingToken?: string;
  status: ParcelTrackStatus;
  originStationName: string;
  destinationStationId?: string;
  destinationStationName: string;
  destinationStationAddress: string;
  destinationStationHours: string;
  destinationOperator?: Operator;
  recipientName: string;
  recipientPhoneMasked: string;
  items: BookingItem[];
  itemCount: number;
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  expectedArrival?: string;
  arrivedAt?: string;
  updatedAt: string;
};
