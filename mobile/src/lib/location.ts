import * as Location from "expo-location";

export type UserCoords = { lat: number; lng: number };

export type LocationRequestResult =
  | { ok: true; coords: UserCoords }
  | { ok: false; reason: "denied" | "unavailable" | "failed" };

export async function requestUserLocation(): Promise<LocationRequestResult> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return { ok: false, reason: "unavailable" };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return { ok: false, reason: "denied" };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      ok: true,
      coords: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
    };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
