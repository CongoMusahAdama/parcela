import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDistance } from "@/lib/format";
import { BOLT_LIKE_MAP_STYLE } from "@/lib/mapStyle";
import { getOperatorLabel } from "@/lib/operators";
import type { UserCoords } from "@/lib/sendLocation";
import type { Station } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type StationWithDistance = Station & { distanceKm?: number };

type StationMapViewProps = {
  stations: StationWithDistance[];
  userCoords: UserCoords | null;
};

const GHANA_REGION = {
  latitude: 7.9465,
  longitude: -1.0232,
  latitudeDelta: 7.5,
  longitudeDelta: 7.5,
};

function YouAreHereMarker() {
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 2.4,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.55,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.youWrap} pointerEvents="none">
      <Animated.View
        style={[styles.youPulse, { opacity, transform: [{ scale }] }]}
      />
      <View style={styles.youDotRing}>
        <View style={styles.youDot}>
          <Ionicons name="navigate" size={14} color="#fff" />
        </View>
      </View>
      <View style={styles.youLabel}>
        <Text style={styles.youLabelText}>You are here</Text>
      </View>
    </View>
  );
}

const NEARBY_LINE_COUNT = 3;

function StationPin({
  selected,
  isNearest,
}: {
  selected: boolean;
  isNearest?: boolean;
}) {
  const accent = colors.primary;
  return (
    <View style={[styles.pinWrap, selected && styles.pinWrapSelected]}>
      {isNearest ? (
        <View style={styles.nearestBadge}>
          <Text style={styles.nearestBadgeText}>Nearest</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.pinHead,
          { backgroundColor: accent },
          selected && styles.pinHeadSelected,
        ]}
      >
        <Ionicons name="bus" size={selected ? 18 : 15} color="#fff" />
      </View>
      <View style={[styles.pinStem, { borderTopColor: accent }]} />
      <View style={[styles.pinShadow, { backgroundColor: accent + "40" }]} />
    </View>
  );
}

export function StationMapView({ stations, userCoords }: StationMapViewProps) {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<StationWithDistance | null>(null);

  const operatorLegend = useMemo(
    () =>
      Array.from(new Set(stations.map((station) => station.operator.trim().toUpperCase()).filter(Boolean))).sort(),
    [stations],
  );

  const nearestStations = useMemo(() => {
    if (!userCoords) return [] as StationWithDistance[];
    return [...stations]
      .filter((s) => s.distanceKm !== undefined)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, NEARBY_LINE_COUNT);
  }, [stations, userCoords]);

  const nearestId = nearestStations[0]?.id;
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (!userCoords || nearestStations.length === 0 || didAutoSelect.current) return;
    didAutoSelect.current = true;
    setSelected(nearestStations[0]);
  }, [userCoords, nearestStations]);

  function getFitCoordinates() {
    if (userCoords && nearestStations.length > 0) {
      return [
        { latitude: userCoords.lat, longitude: userCoords.lng },
        ...nearestStations.map((s) => ({ latitude: s.lat, longitude: s.lng })),
      ];
    }
    const coords = stations.map((s) => ({
      latitude: s.lat,
      longitude: s.lng,
    }));
    if (userCoords) {
      coords.push({ latitude: userCoords.lat, longitude: userCoords.lng });
    }
    return coords;
  }

  const initialRegion = useMemo(() => {
    if (userCoords) {
      return {
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: 0.35,
        longitudeDelta: 0.35,
      };
    }
    if (stations.length > 0) {
      return {
        latitude: stations[0].lat,
        longitude: stations[0].lng,
        latitudeDelta: 2.2,
        longitudeDelta: 2.2,
      };
    }
    return GHANA_REGION;
  }, [userCoords, stations]);

  useEffect(() => {
    if (!mapRef.current || stations.length === 0) return;

    const coords = getFitCoordinates();

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 72, right: 56, bottom: selected ? 200 : 120, left: 56 },
        animated: true,
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [stations, userCoords, selected, nearestStations]);

  function selectStation(station: StationWithDistance) {
    setSelected(station);
    mapRef.current?.animateToRegion(
      {
        latitude: station.lat - 0.012,
        longitude: station.lng,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      },
      420
    );
  }

  function recenter() {
    if (!mapRef.current) return;
    mapRef.current.fitToCoordinates(getFitCoordinates(), {
      edgePadding: { top: 72, right: 56, bottom: selected ? 200 : 120, left: 56 },
      animated: true,
    });
  }

  function confirmSelection() {
    if (!selected) return;
    router.push({ pathname: "/send/book", params: { stationId: selected.id } });
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={Platform.OS === "ios"}
        toolbarEnabled={false}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        customMapStyle={Platform.OS === "android" ? BOLT_LIKE_MAP_STYLE : undefined}
        userInterfaceStyle="light"
        pitchEnabled
        rotateEnabled={false}
      >
        {userCoords
          ? nearestStations.map((station, index) => (
              <Polyline
                key={`route-${station.id}`}
                coordinates={[
                  { latitude: userCoords.lat, longitude: userCoords.lng },
                  { latitude: station.lat, longitude: station.lng },
                ]}
                strokeColor={index === 0 ? colors.primary : colors.primary + "66"}
                strokeWidth={index === 0 ? 3.5 : 2.5}
                lineDashPattern={index === 0 ? undefined : [10, 7]}
                zIndex={10}
              />
            ))
          : null}

        {userCoords ? (
          <>
            <Circle
              center={{ latitude: userCoords.lat, longitude: userCoords.lng }}
              radius={450}
              fillColor={colors.primary + "18"}
              strokeColor={colors.primary + "55"}
              strokeWidth={2}
              zIndex={5}
            />
            <Marker
              coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}
              anchor={{ x: 0.5, y: 0.85 }}
              zIndex={1000}
              tracksViewChanges={false}
            >
              <YouAreHereMarker />
            </Marker>
          </>
        ) : null}

        {stations.map((station) => {
          const isSelected = selected?.id === station.id;
          const isNearest = station.id === nearestId;
          return (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.lat, longitude: station.lng }}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={isSelected ? 100 : isNearest ? 50 : 1}
              onPress={() => selectStation(station)}
              tracksViewChanges={isSelected || isNearest}
            >
              <StationPin selected={isSelected} isNearest={isNearest} />
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.legend} pointerEvents="none">
        {userCoords ? (
          <View style={styles.legendChip}>
            <View style={styles.legendYouDot}>
              <Ionicons name="navigate" size={10} color="#fff" />
            </View>
            <Text style={styles.legendText}>You</Text>
          </View>
        ) : null}
        {operatorLegend.map((op) => (
          <View key={op} style={styles.legendChip}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{getOperatorLabel(op)}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.recenterBtn, selected && styles.recenterBtnRaised]}
        onPress={recenter}
        accessibilityLabel="Recenter map"
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </Pressable>

      <View style={styles.bottomFade} pointerEvents="none" />

      {selected ? (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.sheetBadgeText, { color: colors.primaryDark }]}>
                {getOperatorLabel(selected.operator)}
              </Text>
            </View>
            {selected.distanceKm !== undefined ? (
              <Text style={styles.sheetDistance}>{formatDistance(selected.distanceKm)}</Text>
            ) : null}
          </View>
          <Text style={styles.sheetTitle}>{selected.name}</Text>
          <Text style={styles.sheetMeta}>
            {selected.city} · {selected.code}
          </Text>
          <Text style={styles.sheetAddr} numberOfLines={2}>
            {selected.address}
          </Text>
          <Pressable style={styles.sheetBtn} onPress={confirmSelection}>
            <Text style={styles.sheetBtnText}>Select this station</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Pressable style={styles.sheetDismiss} onPress={() => setSelected(null)}>
            <Text style={styles.sheetDismissText}>Show all stations</Text>
          </Pressable>
        </View>
      ) : !userCoords ? (
        <View style={styles.noLocationBar}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.noLocationText}>
            Location off — allow access from Send a parcel to see where you are
          </Text>
        </View>
      ) : (
        <View style={styles.hintBar} pointerEvents="none">
          <Ionicons name="hand-left-outline" size={14} color={colors.muted} />
          <Text style={styles.hintText}>Lines connect you to the 3 nearest stations</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#e8eef4",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  legend: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 8,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendYouDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  legendText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    color: colors.foreground,
  },
  recenterBtn: {
    position: "absolute",
    right: 12,
    bottom: 108,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  recenterBtnRaised: {
    bottom: 228,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: "transparent",
    // subtle lift — sheet provides main chrome
  },
  youWrap: {
    alignItems: "center",
    width: 110,
    height: 72,
  },
  youPulse: {
    position: "absolute",
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  youDotRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: colors.primary + "44",
  },
  youDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  youLabel: {
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  youLabelText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.2,
  },
  noLocationBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary + "33",
  },
  noLocationText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
  },
  pinWrap: {
    alignItems: "center",
    width: 44,
    height: 52,
    marginTop: 14,
  },
  nearestBadge: {
    position: "absolute",
    top: -18,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    zIndex: 5,
  },
  nearestBadgeText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.3,
  },
  pinWrapSelected: {
    transform: [{ scale: 1.12 }],
  },
  pinHead: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 2,
  },
  pinHeadSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3.5,
  },
  pinStem: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    zIndex: 1,
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 7,
    marginTop: 2,
    opacity: 0.5,
  },
  hintBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: spacing.md,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  sheetBadgeText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  sheetDistance: {
    fontFamily: fonts.displaySemibold,
    fontSize: 13,
    color: colors.primary,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.foreground,
    lineHeight: 24,
  },
  sheetMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  sheetAddr: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 18,
  },
  sheetBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetBtnText: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: "#fff",
  },
  sheetDismiss: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 6,
  },
  sheetDismissText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.muted,
  },
});
