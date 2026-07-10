import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { BOLT_LIKE_MAP_STYLE } from "@/lib/mapStyle";
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

function YouAreHereMarker() {
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 2.2,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.youWrap} pointerEvents="none">
      <Animated.View style={[styles.youPulse, { opacity, transform: [{ scale }] }]} />
      <View style={styles.youDotRing}>
        <View style={styles.youDot}>
          <Ionicons name="navigate" size={12} color="#fff" />
        </View>
      </View>
    </View>
  );
}

function StationCollectPin({ accent }: { accent: string }) {
  return (
    <View style={styles.pinWrap}>
      <View style={[styles.pinHead, { backgroundColor: accent }]}>
        <Ionicons name="bus" size={16} color="#fff" />
      </View>
      <View style={[styles.pinStem, { borderTopColor: accent }]} />
      <View style={[styles.pinShadow, { backgroundColor: accent + "40" }]} />
    </View>
  );
}

export function CollectionStationMap({
  lat,
  lng,
  name,
  operator,
  userCoords,
  onUserCoords,
  hideDirectionsButton = false,
  bottomInset = 48,
  topInset = 12,
}: CollectionStationMapProps) {
  const mapRef = useRef<MapView>(null);
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

  function getFitCoordinates() {
    return userCoords
      ? [
          { latitude: userCoords.lat, longitude: userCoords.lng },
          { latitude: lat, longitude: lng },
        ]
      : [{ latitude: lat, longitude: lng }];
  }

  function fitMap() {
    mapRef.current?.fitToCoordinates(getFitCoordinates(), {
      edgePadding: { top: 100, right: 48, bottom: bottomInset + 24, left: 48 },
      animated: true,
    });
  }

  useEffect(() => {
    fitMap();
  }, [lat, lng, userCoords, bottomInset]);

  function openDirections() {
    Linking.openURL(stationDirectionsUrl(lat, lng));
  }

  async function requestLocation() {
    const coords = await requestSendLocation();
    onUserCoords(coords);
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={Platform.OS === "android" ? BOLT_LIKE_MAP_STYLE : undefined}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
        userInterfaceStyle="light"
        rotateEnabled={false}
      >
        {userCoords ? (
          <>
            <Circle
              center={{ latitude: userCoords.lat, longitude: userCoords.lng }}
              radius={400}
              fillColor={colors.primary + "18"}
              strokeColor={colors.primary + "55"}
              strokeWidth={2}
            />
            <Polyline
              coordinates={[
                { latitude: userCoords.lat, longitude: userCoords.lng },
                { latitude: lat, longitude: lng },
              ]}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
            <Marker
              coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <YouAreHereMarker />
            </Marker>
          </>
        ) : null}
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
        >
          <StationCollectPin accent={accent} />
        </Marker>
      </MapView>

      {!userCoords ? (
        <Pressable style={[styles.hintBar, { top: topInset }]} onPress={requestLocation}>
          <Ionicons name="locate-outline" size={16} color={colors.primary} />
          <Text style={styles.hintText}>Tap to show your location and route</Text>
        </Pressable>
      ) : distanceKm != null ? (
        <View style={[styles.distancePill, { top: topInset }]}>
          <Ionicons name="walk-outline" size={14} color={colors.primary} />
          <Text style={styles.distancePillText}>{formatDistance(distanceKm)} away</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.recenterBtn, { bottom: bottomInset + 16 }]}
        onPress={fitMap}
        accessibilityLabel="Recenter map"
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </Pressable>

      {!hideDirectionsButton ? (
        <Pressable
          style={[styles.directionsBtn, { bottom: bottomInset + 16 }]}
          onPress={openDirections}
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.directionsText}>Open directions</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#e8eef4",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  youWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
  youPulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + "55",
  },
  youDotRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  youDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pinWrap: {
    alignItems: "center",
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  pinStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 7,
    marginTop: 2,
    opacity: 0.6,
  },
  hintBar: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary + "33",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.foreground,
  },
  distancePill: {
    position: "absolute",
    alignSelf: "center",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary + "33",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  distancePillText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.primary,
  },
  recenterBtn: {
    position: "absolute",
    right: 16,
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
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionsBtn: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.full,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  directionsText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: "#fff",
  },
});
