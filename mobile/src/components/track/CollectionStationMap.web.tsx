import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { stationDirectionsUrl } from "@/lib/maps";
import { formatDistance } from "@/lib/format";
import { haversineKm } from "@/lib/stations";
import { getSendLocation, requestSendLocation, type UserCoords } from "@/lib/sendLocation";
import type { Operator } from "@/types/parcel";
import { colors, fonts, radii } from "@/constants/theme";

type CollectionStationMapProps = {
  lat: number;
  lng: number;
  name: string;
  operator?: Operator;
  userCoords: UserCoords | null;
  onUserCoords: (coords: UserCoords | null) => void;
  hideDirectionsButton?: boolean;
  bottomInset?: number;
  topInset?: number;
};

export function CollectionStationMap({
  lat,
  lng,
  name,
  operator,
  userCoords,
  onUserCoords,
  hideDirectionsButton = false,
}: CollectionStationMapProps) {
  const accent = colors.primary;
  const distanceKm = userCoords ? haversineKm(userCoords.lat, userCoords.lng, lat, lng) : null;

  useEffect(() => {
    if (userCoords) return;
    const cached = getSendLocation();
    if (cached) {
      onUserCoords(cached);
      return;
    }
    requestSendLocation().then(onUserCoords);
  }, [onUserCoords, userCoords]);

  function openDirections() {
    Linking.openURL(stationDirectionsUrl(lat, lng));
  }

  async function requestLocation() {
    const coords = await requestSendLocation();
    onUserCoords(coords);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={28} color={colors.primary} />
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Interactive map is available in Expo Go on your phone.</Text>
        {distanceKm != null ? (
          <Text style={styles.distance}>{formatDistance(distanceKm)} away</Text>
        ) : (
          <Pressable style={styles.locationBtn} onPress={requestLocation}>
            <Ionicons name="locate-outline" size={16} color={colors.primary} />
            <Text style={styles.locationBtnText}>Use my location</Text>
          </Pressable>
        )}
      </View>

      {!hideDirectionsButton ? (
        <Pressable style={[styles.directionsBtn, { backgroundColor: accent }]} onPress={openDirections}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.directionsText}>Open directions</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  placeholder: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
    backgroundColor: colors.primary + "08",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    textAlign: "center",
  },
  distance: {
    fontFamily: fonts.displaySemibold,
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  locationBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary + "44",
    backgroundColor: "#fff",
  },
  locationBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.primary,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  directionsText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 14,
    color: "#fff",
  },
});
