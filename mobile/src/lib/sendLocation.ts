import { requestUserLocation, type UserCoords } from "@/lib/location";

let cachedCoords: UserCoords | null = null;

export type { UserCoords };

export function getSendLocation(): UserCoords | null {
  return cachedCoords;
}

export function clearSendLocation(): void {
  cachedCoords = null;
}

/** Request permission when user starts send flow; caches coords for station list. */
export async function requestSendLocation(): Promise<UserCoords | null> {
  const result = await requestUserLocation();
  if (result.ok) {
    cachedCoords = result.coords;
    return result.coords;
  }
  cachedCoords = null;
  return null;
}
