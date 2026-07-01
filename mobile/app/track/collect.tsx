import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { ScrollWithHint } from "@/components/ui/ScrollWithHint";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { formatItemLabel } from "@/lib/bookingItems";
import { lookupParcel, resolveStationCoords } from "@/lib/tracking";
import type { TrackedParcel } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

export default function TrackCollectScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [parcel, setParcel] = useState<TrackedParcel | null>(null);

  useEffect(() => {
    if (code) lookupParcel(code).then((p) => setParcel(p ?? null));
  }, [code]);

  if (!parcel) {
    return (
      <Screen>
        <Text style={styles.title}>Loading...</Text>
      </Screen>
    );
  }

  const coords = resolveStationCoords(parcel);

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      <View style={styles.fixedHeader}>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/track/station", params: { code: parcel.pickupCode } })
          }
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScreenIllustration name="collection" height={220} maxWidth={340} />

        <Text style={styles.step}>Step 4 of 4</Text>
        <Text style={styles.title}>Ready to collect</Text>
        <Text style={styles.subtitle}>
          Bring the receipt the sender sent you to the station counter.
        </Text>

        <View style={styles.penaltySlot}>
          <PenaltyNotice
            arrivedAt={parcel.arrivedAt}
            status={parcel.status}
            embedded
          />
        </View>
      </View>

      <ScrollWithHint
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
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
          <Text style={styles.stationLabel}>Collect at</Text>
          <Text style={styles.stationName}>{parcel.destinationStationName}</Text>
          <Text style={styles.stationAddr}>{parcel.destinationStationAddress}</Text>
          <Text style={styles.stationHours}>{parcel.destinationStationHours}</Text>
          <Text style={styles.recipient}>
            Recipient: {parcel.recipientName} · {parcel.recipientPhoneMasked}
          </Text>
          {coords ? (
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
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  penaltySlot: {
    marginTop: 12,
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
