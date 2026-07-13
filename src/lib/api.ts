import type { PreBooking, Station, TrackedParcel } from '@/types/parcel';
import { apiFetch } from './api-client';
import type { CreateBookingPayload } from './api-types';

export type PublicOperatorBranding = {
  code: string;
  name: string;
  brandColor: string;
  logoDataUrl: string | null;
  active: boolean;
};

export async function fetchPublicOperatorBrandingApi(): Promise<PublicOperatorBranding[]> {
  return apiFetch<PublicOperatorBranding[]>('/operators/branding');
}

export async function fetchStationById(id: string): Promise<Station | null> {
  return apiFetch<Station | null>(`/stations/${encodeURIComponent(id)}`);
}

export async function fetchStations(params?: {
  q?: string;
  operator?: string;
  lat?: number;
  lng?: number;
  excludeId?: string;
}): Promise<Station[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.operator) search.set('operator', params.operator);
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  if (params?.excludeId) search.set('excludeId', params.excludeId);
  const qs = search.toString();
  return apiFetch<Station[]>(`/stations${qs ? `?${qs}` : ''}`);
}

export async function createBookingApi(payload: CreateBookingPayload): Promise<PreBooking> {
  const result = await apiFetch<PreBooking & { trackingUrl?: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const { trackingUrl: _u, ...booking } = result;
  return booking;
}

export async function trackParcelByCodeApi(code: string): Promise<TrackedParcel> {
  return apiFetch<TrackedParcel>(`/tracking/code/${encodeURIComponent(code.trim())}`);
}

export async function trackParcelByTokenApi(token: string): Promise<TrackedParcel> {
  return apiFetch<TrackedParcel>(`/tracking/token/${encodeURIComponent(token.trim())}`);
}

export async function getBookingApi(reference: string): Promise<PreBooking> {
  const result = await apiFetch<PreBooking & { trackingUrl?: string }>(
    `/bookings/${encodeURIComponent(reference.trim())}`,
  );
  const { trackingUrl: _u, ...booking } = result;
  return booking;
}
