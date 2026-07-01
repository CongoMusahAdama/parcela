export type UserCoords = { lat: number; lng: number };

const STORAGE_KEY = "parcela_send_coords";

export function getSendLocation(): UserCoords | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserCoords;
    if (typeof parsed.lat === "number" && typeof parsed.lng === "number") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearSendLocation(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

function saveSendLocation(coords: UserCoords): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
}

/** Request permission when user starts send flow; caches coords for station list. */
export function requestSendLocation(): Promise<UserCoords | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        saveSendLocation(coords);
        resolve(coords);
      },
      () => {
        clearSendLocation();
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}
