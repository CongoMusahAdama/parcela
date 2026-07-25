import { apiFetch } from '@/lib/api-client';
import type { StaffSession } from '@/types/staff';
import type { StaffParcelDetail, StaffParcelSummary } from '@/types/staff-parcel';

export async function staffLoginApi(phone: string, password: string): Promise<StaffSession> {
  return apiFetch<StaffSession>('/staff/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
}

export async function staffLogoutApi(): Promise<void> {
  await apiFetch('/staff/logout', { method: 'POST' });
}

export async function fetchStaffSession(): Promise<StaffSession> {
  return apiFetch<StaffSession>('/staff/session');
}

export async function fetchStaffParcels(): Promise<StaffParcelSummary[]> {
  return apiFetch<StaffParcelSummary[]>('/staff/parcels');
}

export async function fetchStaffParcelDetail(reference: string): Promise<StaffParcelDetail> {
  return apiFetch<StaffParcelDetail>(`/staff/parcels/${encodeURIComponent(reference)}`);
}

export async function verifyAndLogParcelApi(
  reference: string,
  body: {
    busNumber: string;
    driverPhone: string;
    driverName?: string;
    paymentWho?: "sender" | "receiver";
    markPaid?: boolean;
  },
): Promise<StaffParcelDetail> {
  return apiFetch<StaffParcelDetail>(
    `/staff/parcels/${encodeURIComponent(reference)}/verify-log`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function markParcelPaidApi(
  reference: string,
  body: { paymentWho?: "sender" | "receiver"; markPaid?: boolean } = {},
): Promise<StaffParcelDetail> {
  return apiFetch<StaffParcelDetail>(
    `/staff/parcels/${encodeURIComponent(reference)}/mark-paid`,
    {
      method: "POST",
      body: JSON.stringify({ markPaid: true, ...body }),
    },
  );
}

export type ConfirmBusArrivalResult = {
  busNumber: string;
  parcelCount: number;
  bookingReferences: string[];
  sms: Array<{ bookingReference: string; sent: boolean }>;
};

export async function confirmBusArrivalApi(busNumber: string): Promise<ConfirmBusArrivalResult> {
  return apiFetch<ConfirmBusArrivalResult>('/staff/buses/confirm-arrival', {
    method: 'POST',
    body: JSON.stringify({ busNumber }),
  });
}

export async function releaseParcelApi(
  reference: string,
  pickupCode: string,
): Promise<StaffParcelDetail> {
  return apiFetch<StaffParcelDetail>(
    `/staff/parcels/${encodeURIComponent(reference)}/release`,
    {
      method: 'POST',
      body: JSON.stringify({ pickupCode }),
    },
  );
}

export async function changeStaffPasswordApi(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>('/staff/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
