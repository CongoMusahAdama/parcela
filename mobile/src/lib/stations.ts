import { GHANA_STATIONS } from "../../../data/ghana-stations";
import { fetchStationById, fetchStations } from "@/lib/api";
import type { Operator, Station } from "@/types/parcel";

export const MOCK_STATIONS: Station[] = GHANA_STATIONS;

let apiStationCache: Station[] | null = null;
let stationsLoadPromise: Promise<Station[]> | null = null;
let stationsLoadedFromApi = false;

export function didLoadStationsFromApi(): boolean {
  return stationsLoadedFromApi;
}

function normalizeStations(stations: Station[]): Station[] {
  return stations.filter((station) => Boolean(station.id?.trim() && station.name?.trim()));
}

export function setStationCache(stations: Station[]) {
  apiStationCache = normalizeStations(stations);
  stationsLoadedFromApi = true;
}

async function loadStationsFromApi(): Promise<Station[]> {
  try {
    const stations = await fetchStations();
    apiStationCache = normalizeStations(stations);
    stationsLoadedFromApi = true;
    return apiStationCache;
  } catch {
    stationsLoadedFromApi = false;
    apiStationCache = normalizeStations(MOCK_STATIONS);
    return apiStationCache;
  }
}

export async function ensureStationsLoaded(): Promise<Station[]> {
  if (apiStationCache) return apiStationCache;
  if (!stationsLoadPromise) {
    stationsLoadPromise = loadStationsFromApi().finally(() => {
      stationsLoadPromise = null;
    });
  }
  return stationsLoadPromise;
}

export async function resolveStationById(id: string): Promise<Station | undefined> {
  const cached = getStationById(id);
  if (cached) return cached;

  try {
    const station = await fetchStationById(id);
    if (!station) return undefined;
    if (apiStationCache && !apiStationCache.some((s) => s.id === station.id)) {
      apiStationCache = [...apiStationCache, station];
    }
    return station;
  } catch {
    return undefined;
  }
}

export function getSupportedStations(stations: Station[] = apiStationCache ?? MOCK_STATIONS): Station[] {
  return normalizeStations(stations);
}

export function getStationById(id: string): Station | undefined {
  const pool = apiStationCache ?? MOCK_STATIONS;
  return pool.find((s) => s.id === id);
}

export function listStationOperatorCodes(stations: Station[] = getSupportedStations()): string[] {
  return Array.from(
    new Set(stations.map((station) => station.operator.trim().toUpperCase()).filter(Boolean)),
  ).sort();
}

export function filterStationsByOperator(
  stations: Station[],
  operator: Operator | "all"
): Station[] {
  if (operator === "all") return stations;
  const code = operator.trim().toUpperCase();
  return stations.filter((s) => s.operator.trim().toUpperCase() === code);
}

export function searchStations(query: string, stations: Station[] = getSupportedStations()): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return stations;
  return stations.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.operator.toLowerCase().includes(q)
  );
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortStationsByDistance(
  stations: Station[],
  userLat: number,
  userLng: number
): (Station & { distanceKm: number })[] {
  return stations
    .map((station) => ({
      ...station,
      distanceKm: haversineKm(userLat, userLng, station.lat, station.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function sortStationsAlphabetically(stations: Station[]): Station[] {
  return [...stations].sort((a, b) => {
    const byCity = a.city.localeCompare(b.city);
    if (byCity !== 0) return byCity;
    const byOperator = a.operator.localeCompare(b.operator);
    if (byOperator !== 0) return byOperator;
    return a.name.localeCompare(b.name);
  });
}
