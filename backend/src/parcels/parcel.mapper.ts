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
  destinationOperator?: string;
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
  operator?: string;
  destinationOperator?: string;
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
  trackingAppUrl: string;
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
  tracking: { web: string; app: string },
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
    trackingUrl: tracking.web,
    trackingAppUrl: tracking.app,
  };
}

export type StaffParcelSummaryDto = {
  bookingReference: string;
  pickupCode: string;
  status: Parcel['status'];
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originStationName: string;
  destinationStationName: string;
  originStationId: string;
  destinationStationId: string;
  originStationCode: string;
  destinationStationCode: string;
  itemCount: number;
  direction: 'outgoing' | 'incoming';
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  paymentWho?: 'sender' | 'receiver';
  paymentStatus: 'unpaid' | 'paid';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type StaffParcelDetailDto = StaffParcelSummaryDto & {
  items: Parcel['items'];
  driverName?: string;
  driverPhone?: string;
  expectedArrival?: string;
  arrivedAt?: string;
};

export function toStaffParcelSummary(
  parcel: Parcel & { createdAt?: Date; updatedAt?: Date },
  stationId: string,
): StaffParcelSummaryDto {
  const outgoing = parcel.originStationId === stationId;
  return {
    bookingReference: parcel.bookingReference,
    pickupCode: parcel.pickupCode,
    status: parcel.status,
    senderName: parcel.senderName,
    senderPhone: parcel.senderPhone,
    recipientName: parcel.recipientName,
    recipientPhone: parcel.recipientPhone,
    originStationName: parcel.originStationName,
    destinationStationName: parcel.destinationStationName,
    originStationId: parcel.originStationId,
    destinationStationId: parcel.destinationStationId,
    originStationCode: parcel.originStationCode,
    destinationStationCode: parcel.destinationStationCode ?? parcel.originStationCode,
    itemCount: parcel.items.length,
    direction: outgoing ? 'outgoing' : 'incoming',
    busNumber: parcel.busNumber,
    driverName: parcel.driverName,
    driverPhone: parcel.driverPhone,
    paymentWho: parcel.paymentWho,
    paymentStatus: parcel.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    paidAt: parcel.paidAt?.toISOString(),
    createdAt: (parcel.createdAt ?? new Date()).toISOString(),
    updatedAt: (parcel.updatedAt ?? parcel.createdAt ?? new Date()).toISOString(),
  };
}

export function toStaffParcelDetail(
  parcel: Parcel & { createdAt?: Date; updatedAt?: Date },
  stationId: string,
): StaffParcelDetailDto {
  return {
    ...toStaffParcelSummary(parcel, stationId),
    items: parcel.items,
    driverName: parcel.driverName,
    driverPhone: parcel.driverPhone,
    expectedArrival: parcel.expectedArrival?.toISOString(),
    arrivedAt: parcel.arrivedAt?.toISOString(),
  };
}
