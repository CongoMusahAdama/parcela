import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { ScrollWithHint } from "@/components/ui/ScrollWithHint";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { ParcelStatusTimeline } from "@/components/track/ParcelStatusTimeline";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { lookupParcel, resolveStationCoords, TRACK_STATUS_LABELS } from "@/lib/tracking";
import { getTrackStatusStepLabel, goBackOrTrackHome } from "@/lib/track-navigation";
import { formatExpectedArrival } from "@/lib/tracking-shared";
import { formatItemLabel } from "@/lib/bookingItems";
import { useSweetAlert } from "@/lib/sweetalert";
import { images } from "@/lib/images";
import type { TrackedParcel } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

function TransportStrip({ parcel }: { parcel: TrackedParcel }) {
  if (!parcel.busNumber && !parcel.driverPhone) return null;
  return (
    <View style={styles.transport}>
      {parcel.busNumber ? (
        <View style={styles.transportCell}>
          <Ionicons name="bus-outline" size={16} color={colors.primary} />
          <View>
            <Text style={styles.transportLabel}>Bus</Text>
            <Text style={styles.transportValue}>{parcel.busNumber}</Text>
          </View>
        </View>
      ) : null}
      {parcel.driverPhone ? (
        <Pressable
          style={[styles.transportCell, styles.transportCellLast]}
          onPress={() => Linking.openURL(`tel:${parcel.driverPhone!.replace(/\s/g, "")}`)}
        >
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <View>
            <Text style={styles.transportLabel}>Driver</Text>
            <Text style={[styles.transportValue, styles.transportLink]}>{parcel.driverPhone}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TrackStatusScreen() {
  const router = useRouter();
  const sweetAlert = useSweetAlert();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [parcel, setParcel] = useState<TrackedParcel | null | undefined>(undefined);
  const shownNotFound = useRef(false);

  const loadParcel = useCallback(
    (refresh = false) => {
      if (!code) return;
      void lookupParcel(code, { refresh }).then((result) => {
        setParcel(result);
        if (!result && !shownNotFound.current) {
          shownNotFound.current = true;
          sweetAlert.error({
            title: "Parcel not found",
            text: "Check the pickup code and try again.",
            confirmText: "Try again",
          });
        }
      });
    },
    [code, sweetAlert],
  );

  useFocusEffect(
    useCallback(() => {
      loadParcel(true);
      const interval = setInterval(() => loadParcel(true), 30_000);
      return () => clearInterval(interval);
    }, [loadParcel]),
  );

  if (parcel === undefined) {
    return (
      <Screen>
        <Text style={styles.title}>Loading...</Text>
      </Screen>
    );
  }

  if (!parcel) {
    return (
      <Screen footer={<Button label="Enter code again" onPress={() => router.replace("/track")} />}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="search-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Parcel not found</Text>
        <Text style={styles.subtitle}>
          We couldn&apos;t find a parcel for this code. Check the pickup code on your receipt and
          try again.
        </Text>
      </Screen>
    );
  }

  const canCollect = parcel.status === "ready_for_collection" || parcel.status === "arrived";
  const isCollected = parcel.status === "collected";
  const coords = resolveStationCoords(parcel);

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screenContent}
      footer={
        canCollect ? (
          <Button
            label="Collection details"
            onPress={() =>
              router.push({ pathname: "/track/collect", params: { code: parcel.pickupCode } })
            }
          />
        ) : isCollected ? (
          <Button label="Track another parcel" onPress={() => router.replace("/track")} />
        ) : coords ? (
          <Button
            label="Find station on map"
            onPress={() =>
              router.push({ pathname: "/track/station", params: { code: parcel.pickupCode } })
            }
          />
        ) : null
      }
    >
      <View style={styles.fixedHeader}>
        <Pressable onPress={() => goBackOrTrackHome(router)} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScreenIllustration name="receiver" height={120} maxWidth={200} />

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.step, isCollected && styles.stepComplete]}>
              {getTrackStatusStepLabel(parcel.status)}
            </Text>
            <Text style={styles.title}>
              {isCollected ? "Parcel collected" : "Parcel status"}
            </Text>
          </View>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{parcel.pickupCode}</Text>
            <Text
              style={[
                styles.statusBadge,
                (parcel.status === "ready_for_collection" || isCollected) && styles.statusSuccess,
              ]}
            >
              {TRACK_STATUS_LABELS[parcel.status]}
            </Text>
          </View>
        </View>

        <View style={styles.route}>
          <Text style={styles.routeText} numberOfLines={1}>
            {parcel.originStationName}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          <Text style={[styles.routeText, styles.routeDest]} numberOfLines={1}>
            {parcel.destinationStationName}
          </Text>
        </View>

        {!isCollected && coords ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/track/station", params: { code: parcel.pickupCode } })
            }
            style={styles.mapPromo}
          >
            <Image source={images.map} style={styles.mapPromoImage} contentFit="cover" />
            <View style={styles.mapPromoBody}>
              <Text style={styles.mapPromoTitle}>Find station on map</Text>
              <Text style={styles.mapPromoSub} numberOfLines={1}>
                {parcel.destinationStationName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Pressable>
        ) : null}

        {canCollect ? (
          <View style={styles.penaltySlot}>
            <PenaltyNotice
              arrivedAt={parcel.arrivedAt}
              status={parcel.status}
              embedded
            />
          </View>
        ) : null}
      </View>

      <ScrollWithHint
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TransportStrip parcel={parcel} />

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineWrap}>
          <ParcelStatusTimeline status={parcel.status} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.itemsTitle}>
            Items ({parcel.itemCount}) · tracking ID {parcel.pickupCode}
          </Text>
          <Text style={styles.infoLine}>
            Recipient: {parcel.recipientName} · {parcel.recipientPhoneMasked}
          </Text>
          {parcel.items.map((item, index) => (
            <Text key={item.id} style={styles.itemLine}>
              {formatItemLabel(item, index)}
            </Text>
          ))}
          {parcel.expectedArrival &&
          (parcel.status === "in_transit" || parcel.status === "pending_dropoff") ? (
            <Text style={styles.etaLine}>
              Expected arrival {formatExpectedArrival(parcel.expectedArrival)}
            </Text>
          ) : null}
          <Text style={styles.collectLabel}>{isCollected ? "Collected at" : "Collect at"}</Text>
          <Text style={styles.collectName}>{parcel.destinationStationName}</Text>
          <Text style={styles.collectAddr}>{parcel.destinationStationAddress}</Text>
          <Text style={styles.collectHours}>{parcel.destinationStationHours}</Text>
        </View>
      </ScrollWithHint>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, paddingHorizontal: 0 },
  fixedHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.lg,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, alignSelf: "flex-start" },
  backText: { fontFamily: fonts.display, color: colors.primary, fontWeight: "600", fontSize: 15 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginTop: 4 },
  headerText: { flex: 1 },
  step: { fontFamily: fonts.display, fontSize: 9, fontWeight: "700", color: colors.primary, textTransform: "uppercase" },
  stepComplete: { color: colors.success },
  title: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 2 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 8 },
  codeBlock: { alignItems: "flex-end" },
  code: { fontFamily: fonts.mono, fontSize: 14, color: colors.primary },
  statusBadge: { fontFamily: fonts.display, fontSize: 9, fontWeight: "700", color: colors.primary, textTransform: "uppercase", marginTop: 2 },
  statusSuccess: { color: colors.success },
  route: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 10, backgroundColor: colors.background, borderRadius: radii.sm },
  routeText: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.foreground },
  routeDest: { textAlign: "right" },
  transport: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, overflow: "hidden", marginBottom: 12, backgroundColor: colors.surface },
  transportCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRightWidth: 1, borderRightColor: colors.border },
  transportCellLast: { borderRightWidth: 0 },
  transportLabel: { fontFamily: fonts.display, fontSize: 9, fontWeight: "600", color: colors.muted, textTransform: "uppercase" },
  transportValue: { fontFamily: fonts.display, fontSize: 12, fontWeight: "700", color: colors.foreground },
  transportLink: { color: colors.primary },
  sectionTitle: { fontFamily: fonts.display, fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
  timelineWrap: { marginBottom: 12 },
  infoCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  itemsTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 6,
  },
  infoLine: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  itemLine: { fontSize: 13, color: colors.foreground, lineHeight: 20, marginBottom: 6, paddingLeft: 4 },
  etaLine: { fontSize: 11, color: colors.muted, marginTop: 8, marginBottom: 4 },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  collectLabel: { fontFamily: fonts.display, fontSize: 10, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginTop: 14 },
  collectName: { fontFamily: fonts.display, fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 2 },
  collectAddr: { fontSize: 12, color: colors.muted, marginTop: 4 },
  mapPromo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.primary + "10",
    borderWidth: 1,
    borderColor: colors.primary + "33",
  },
  mapPromoImage: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary + "22",
  },
  mapPromoBody: {
    flex: 1,
    minWidth: 0,
  },
  mapPromoTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize: 13,
    color: colors.primary,
  },
  mapPromoSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  penaltySlot: {
    marginTop: 10,
  },
  collectHours: { fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 4 },
});
