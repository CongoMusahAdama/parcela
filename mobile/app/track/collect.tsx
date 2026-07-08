import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { ScrollWithHint } from "@/components/ui/ScrollWithHint";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { ParcelStatusTimeline } from "@/components/track/ParcelStatusTimeline";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { formatItemLabel } from "@/lib/bookingItems";
import { lookupParcel, resolveStationCoords } from "@/lib/tracking";
import { goBackOrTrackHome } from "@/lib/track-navigation";
import type { TrackedParcel } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

export default function TrackCollectScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [parcel, setParcel] = useState<TrackedParcel | null>(null);

  const loadParcel = useCallback(
    (refresh = false) => {
      if (!code) return;
      void lookupParcel(code, { refresh }).then((result) => {
        if (!result) {
          setParcel(null);
          return;
        }

        const canCollect =
          result.status === "ready_for_collection" || result.status === "arrived";
        if (!canCollect && result.status !== "collected") {
          router.replace({ pathname: "/track/status", params: { code: result.pickupCode } });
          return;
        }

        setParcel(result);
      });
    },
    [code, router],
  );

  useFocusEffect(
    useCallback(() => {
      loadParcel(true);
      const interval = setInterval(() => loadParcel(true), 15_000);
      return () => clearInterval(interval);
    }, [loadParcel]),
  );

  if (!parcel) {
    return (
      <Screen>
        <Text style={styles.title}>Loading...</Text>
      </Screen>
    );
  }

  const coords = resolveStationCoords(parcel);
  const isCollected = parcel.status === "collected";
  const canCollect = parcel.status === "ready_for_collection" || parcel.status === "arrived";

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screenContent}
      footer={
        isCollected ? (
          <Button
            label="View parcel status"
            onPress={() =>
              router.replace({ pathname: "/track/status", params: { code: parcel.pickupCode } })
            }
          />
        ) : null
      }
    >
      <View style={styles.fixedHeader}>
        <Pressable
          onPress={() => goBackOrTrackHome(router)}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScreenIllustration
          name={isCollected ? "confirmed" : "collection"}
          height={isCollected ? 160 : 220}
          maxWidth={340}
        />

        <Text style={styles.step}>{isCollected ? "Complete" : "Step 4 of 4"}</Text>
        <Text style={[styles.title, isCollected && styles.titleSuccess]}>
          {isCollected ? "Parcel collected" : "Ready to collect"}
        </Text>
        <Text style={styles.subtitle}>
          {isCollected
            ? "This parcel has been handed over at the station. No further action is needed."
            : "Bring the receipt the sender sent you to the station counter."}
        </Text>

        {canCollect ? (
          <View style={styles.penaltySlot}>
            <PenaltyNotice arrivedAt={parcel.arrivedAt} status={parcel.status} embedded />
          </View>
        ) : null}
      </View>

      <ScrollWithHint style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isCollected ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.successTitle}>Handover complete</Text>
            <Text style={styles.successDesc}>
              Tracking ID {parcel.pickupCode} was released to the recipient at{" "}
              {parcel.destinationStationName}.
            </Text>
          </View>
        ) : (
          <View style={styles.receiptCard}>
            <Ionicons name="document-text-outline" size={28} color={colors.primary} />
            <Text style={styles.receiptTitle}>Sender&apos;s receipt</Text>
            <Text style={styles.receiptDesc}>
              This is what you need at the counter. It shows the tracking ID for everything in this
              booking.
            </Text>
            <Text style={styles.trackingLabel}>Tracking ID on receipt</Text>
            <Text style={styles.trackingCode}>{parcel.pickupCode}</Text>
          </View>
        )}

        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>
            {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""} on this ID
          </Text>
          {parcel.items.map((item, index) => (
            <Text key={item.id} style={styles.itemLine}>
              {formatItemLabel(item, index)}
            </Text>
          ))}
        </View>

        <View style={styles.stationCard}>
          <Text style={styles.stationLabel}>{isCollected ? "Collected at" : "Collect at"}</Text>
          <Text style={styles.stationName}>{parcel.destinationStationName}</Text>
          <Text style={styles.stationAddr}>{parcel.destinationStationAddress}</Text>
          <Text style={styles.stationHours}>{parcel.destinationStationHours}</Text>
          <Text style={styles.recipient}>
            Recipient: {parcel.recipientName} · {parcel.recipientPhoneMasked}
          </Text>
          {!isCollected && coords ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/track/station", params: { code: parcel.pickupCode } })
              }
              style={styles.mapLink}
            >
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={styles.mapLinkText}>Open station map</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Delivery progress</Text>
          <ParcelStatusTimeline status={parcel.status} />
        </View>
      </ScrollWithHint>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, paddingHorizontal: 0 },
  fixedHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
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
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: fonts.display,
    color: colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  step: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 4,
  },
  titleSuccess: {
    color: colors.success,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  penaltySlot: {
    marginTop: 12,
  },
  successCard: {
    backgroundColor: colors.success + "12",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + "33",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
    marginTop: 10,
  },
  successDesc: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 10,
  },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  receiptTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 10,
  },
  receiptDesc: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 19,
  },
  trackingLabel: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  trackingCode: {
    fontFamily: fonts.mono,
    fontSize: 26,
    color: colors.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 10,
  },
  itemLine: {
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 20,
    marginBottom: 6,
  },
  stationCard: {
    backgroundColor: colors.primary + "10",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stationLabel: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
  },
  stationName: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 4,
  },
  stationAddr: { fontSize: 13, color: colors.muted, marginTop: 4 },
  stationHours: { fontSize: 13, color: colors.primary, fontWeight: "600", marginTop: 4 },
  recipient: { fontSize: 13, color: colors.foreground, marginTop: 10, fontWeight: "500" },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + "33",
    alignSelf: "flex-start",
  },
  mapLinkText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.primary,
  },
});
