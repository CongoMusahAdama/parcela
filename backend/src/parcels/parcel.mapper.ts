import { Parcel } from './schemas/parcel.schema';
import { maskPhone } from '../common/utils/phone.util';

export type TrackedParcelDto = {
  pickupCode: string;
  bookingReference: string;
  trackingToken: string;
  status: string;
  originStationName: string;
  destinationStationId?: string;
  destinationStationName: string;
  destinationStationAddress: string;
  destinationStationHours: string;
  destinationOperator?: 'VIP' | 'STC';
  recipientName: string;
  recipientPhoneMasked: string;
  items: Parcel['items'];
  itemCount: number;
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  expectedArrival?: string;
  arrivedAt?: string;
  updatedAt: string;
};

export type PreBookingDto = {
  bookingReference: string;
  pickupCode: string;
  status: 'pending_dropoff';
  stationId: string;
  stationName: string;
  stationCode: string;
  operator?: 'VIP' | 'STC';
  destinationOperator?: 'VIP' | 'STC';
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationStationId: string;
  destinationStationName: string;
  items: Parcel['items'];
  createdAt: string;
  trackingToken: string;
  trackingUrl: string;
};

export function toTrackedParcel(
  parcel: Parcel & { updatedAt?: Date; createdAt?: Date },
  destination?: { address: string; hours: string } | null,
): TrackedParcelDto {
  return {
    pickupCode: parcel.pickupCode,
    bookingReference: parcel.bookingReference,
    trackingToken: parcel.trackingToken,
    status: parcel.status,
    originStationName: parcel.originStationName,
    destinationStationId: parcel.destinationStationId,
    destinationStationName: parcel.destinationStationName,
    destinationStationAddress: destination?.address ?? parcel.destinationStationName,
    destinationStationHours: destination?.hours ?? 'See station',
    destinationOperator: parcel.destinationOperator,
    recipientName: parcel.recipientName,
    recipientPhoneMasked: maskPhone(parcel.recipientPhone),
    items: parcel.items,
    itemCount: parcel.items.length,
    busNumber: parcel.busNumber,
    driverName: parcel.driverName,
    driverPhone: parcel.driverPhone,
    expectedArrival: parcel.expectedArrival?.toISOString(),
    arrivedAt: parcel.arrivedAt?.toISOString(),
    updatedAt: (parcel.updatedAt ?? parcel.createdAt ?? new Date()).toISOString(),
  };
}

export function toPreBooking(
  parcel: Parcel & { createdAt?: Date },
  trackingUrl: string,
): PreBookingDto {
  return {
    bookingReference: parcel.bookingReference,
    pickupCode: parcel.pickupCode,
    status: 'pending_dropoff',
    stationId: parcel.originStationId,
    stationName: parcel.originStationName,
    stationCode: parcel.originStationCode,
    operator: parcel.operator,
    destinationOperator: parcel.destinationOperator,
    senderName: parcel.senderName,
    senderPhone: parcel.senderPhone,
    recipientName: parcel.recipientName,
    recipientPhone: parcel.recipientPhone,
    destinationStationId: parcel.destinationStationId,
    destinationStationName: parcel.destinationStationName,
    items: parcel.items,
    createdAt: (parcel.createdAt ?? new Date()).toISOString(),
    trackingToken: parcel.trackingToken,
    trackingUrl,
  };
}
