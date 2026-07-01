import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookingReceiptCard } from "@/components/send/BookingReceiptCard";
import { DropOffReminder } from "@/components/send/DropOffReminder";
import { SendWizardSteps } from "@/components/send/SendWizardSteps";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { Button } from "@/components/ui/Button";
import { fetchPreBookingByReference } from "@/lib/booking";
import { useSweetAlert } from "@/lib/sweetalert";
import type { PreBooking } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

export default function SendConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sweetAlert = useSweetAlert();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const [booking, setBooking] = useState<PreBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const shotRef = useRef<ViewShot>(null);
  const shownBookingAlert = useRef(false);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    fetchPreBookingByReference(ref).then((b) => {
      setBooking(b ?? null);
      setLoading(false);
    });
  }, [ref]);

  useEffect(() => {
    if (!booking || shownBookingAlert.current) return;

    const key = `parcela-booking-alert-${booking.bookingReference}`;
    shownBookingAlert.current = true;

    AsyncStorage.getItem(key).then((seen) => {
      if (seen) return;
      AsyncStorage.setItem(key, "1");
      const itemLabel =
        booking.items.length === 1 ? "1 item" : `${booking.items.length} items`;
      sweetAlert.success({
        title: "Booking confirmed!",
        text: `Tracking ID ${booking.pickupCode} covers all ${itemLabel}. Show your receipt at ${booking.stationName}.`,
        confirmText: "Great",
      });
    });
  }, [booking, sweetAlert]);

  const saveReceipt = useCallback(async () => {
    if (!booking || saving) return;
    setSaving(true);
    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) return;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `${booking.bookingReference} receipt`,
          UTI: "public.png",
        });
        await sweetAlert.success({
          title: "Receipt shared!",
          text: `Take this to ${booking.stationName} when you drop off. After staff register your parcel, send the tracking receipt to your recipient.`,
        });
      }
    } catch {
      // user cancelled or share failed
    } finally {
      setSaving(false);
    }
  }, [booking, saving, sweetAlert]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.centered, styles.pad, { paddingTop: insets.top }]}>
        <Text style={styles.notFoundTitle}>Booking not found</Text>
        <Text style={styles.notFoundText}>
          We couldn&apos;t find this booking. It may have expired from your session.
        </Text>
        <Button label="Start a new booking" onPress={() => router.replace("/send")} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push({ pathname: "/send/book", params: { stationId: booking.stationId } })}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <ScreenIllustration name="confirmed" height={130} />

        <View style={styles.titleRow}>
          <View>
            <View style={styles.stepBadgeWrap}>
              <Text style={styles.stepBadge}>Step 3 of 3</Text>
            </View>
            <Text style={styles.title}>Booking created</Text>
          </View>
        </View>

        <View style={styles.wizard}>
          <SendWizardSteps current={3} />
        </View>

        <DropOffReminder stationName={booking.stationName} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
          <BookingReceiptCard booking={booking} />
        </ViewShot>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Text style={styles.footerHint}>
          Save your receipt — you must show it to staff at the counter
        </Text>
        <Button
          label={saving ? "Saving..." : "Save receipt as image"}
          onPress={saveReceipt}
          disabled={saving}
        />
        <View style={styles.footerRow}>
          <Button
            label="Done"
            variant="outline"
            onPress={() => router.replace("/")}
            style={styles.footerBtn}
          />
          <Button
            label="Send again"
            variant="ghost"
            onPress={() => router.replace("/send")}
            style={styles.footerBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  pad: {
    paddingHorizontal: spacing.md,
  },
  notFoundTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  titleRow: {
    marginTop: 12,
  },
  stepBadgeWrap: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepBadge: {
    fontFamily: fonts.display,
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 6,
  },
  wizard: {
    marginTop: 12,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  footerHint: {
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    gap: 8,
  },
  footerBtn: {
    flex: 1,
  },
});
