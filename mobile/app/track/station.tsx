import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { CollectionStationMap } from "@/components/track/CollectionStationMap";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { stationDirectionsUrl } from "@/lib/maps";
import { OPERATOR_ACCENT } from "@/lib/operators";
import { lookupParcel, resolveStationCoords } from "@/lib/tracking";
import { goBackOrTrackHome } from "@/lib/track-navigation";
import type { UserCoords } from "@/lib/sendLocation";
import type { TrackedParcel } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

const SHEET_HEIGHT = 248;

export default function TrackStationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [parcel, setParcel] = useState<TrackedParcel | null | undefined>(undefined);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!code) {
        setParcel(null);
        return;
      }
      void lookupParcel(code, { refresh: true }).then((result) => setParcel(result ?? null));
    }, [code]),
  );

  if (parcel === undefined) {
    return (
      <Screen>
        <Text style={styles.title}>Loading map...</Text>
      </Screen>
    );
  }

  if (!parcel) {
    return (
      <Screen footer={<Button label="Back to track" onPress={() => router.replace("/track")} />}>
        <Text style={styles.title}>Parcel not found</Text>
      </Screen>
    );
  }

  const coords = resolveStationCoords(parcel);
  const canCollect =
    parcel.status === "ready_for_collection" || parcel.status === "arrived";
  const accent = parcel.destinationOperator
    ? OPERATOR_ACCENT[parcel.destinationOperator]
    : colors.primary;

  if (!coords) {
    return (
      <Screen footer={<Button label="Back to status" onPress={() => router.back()} />}>
        <Text style={styles.title}>Station location unavailable</Text>
        <Text style={styles.subtitle}>Use the address on the status screen for now.</Text>
      </Screen>
    );
  }

  function openDirections() {
    Linking.openURL(stationDirectionsUrl(coords!.lat, coords!.lng));
  }

  return (
    <View style={styles.root}>
      <CollectionStationMap
        lat={coords.lat}
        lng={coords.lng}
        name={parcel.destinationStationName}
        operator={parcel.destinationOperator}
        userCoords={userCoords}
        onUserCoords={setUserCoords}
        hideDirectionsButton
        bottomInset={SHEET_HEIGHT + insets.bottom}
        topInset={insets.top + 56}
      />

      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => goBackOrTrackHome(router)} style={styles.backPill}>
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.stepPill}>
          <Text style={styles.stepText}>
            {parcel.status === "collected" ? "Complete" : "Step 3 of 4"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.floatingSheet,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.sheetTop}>
          <View style={[styles.operatorIcon, { backgroundColor: accent }]}>
            <Ionicons name="bus" size={18} color="#fff" />
          </View>
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetEyebrow}>Find the station</Text>
            <Text style={styles.stationName} numberOfLines={2}>
              {parcel.destinationStationName}
            </Text>
            <Text style={styles.stationMeta}>
              {parcel.destinationOperator ?? "Station"} · Collect here
            </Text>
          </View>
        </View>

        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.stationAddr} numberOfLines={2}>
            {parcel.destinationStationAddress}
          </Text>
        </View>

        <View style={styles.hoursRow}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.stationHours}>{parcel.destinationStationHours}</Text>
        </View>

        <Pressable style={styles.directionsBtn} onPress={openDirections}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.directionsText}>Open directions in Maps</Text>
        </Pressable>

        {canCollect ? (
          <>
            <PenaltyNotice arrivedAt={parcel.arrivedAt} status={parcel.status} />
            <Pressable
              style={styles.collectLink}
              onPress={() =>
                router.push({ pathname: "/track/collect", params: { code: parcel.pickupCode } })
              }
            >
              <Text style={styles.collectLinkText}>Collection details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backText: {
    fontFamily: fonts.displaySemibold,
    color: colors.foreground,
    fontSize: 14,
  },
  stepPill: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepText: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  floatingSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
    gap: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 2,
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  operatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sheetEyebrow: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  stationName: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    lineHeight: 22,
  },
  stationMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingRight: 4,
  },
  stationAddr: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stationHours: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.primary,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.md,
    marginTop: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 14,
    color: "#fff",
  },
  collectLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  collectLinkText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 13,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
});
