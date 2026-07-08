import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DestinationStationPicker } from "@/components/send/DestinationStationPicker";
import { Screen } from "@/components/ui/Screen";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { submitBooking } from "@/lib/booking";
import { ApiError } from "@/lib/api-client";
import { formatItemLabel } from "@/lib/bookingItems";
import {
  ensureStationsLoaded,
  getStationById,
  didLoadStationsFromApi,
  resolveStationById,
  sortStationsAlphabetically,
} from "@/lib/stations";
import type { BookingItem, ParcelType, Station } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

const PARCEL_TYPES: { value: ParcelType; label: string }[] = [
  { value: "envelope", label: "Envelope" },
  { value: "document", label: "Documents" },
  { value: "box", label: "Box" },
  { value: "other", label: "Other" },
];

const STEPS = ["Sender", "Recipient", "Items", "Review"];

type ItemDraft = Omit<BookingItem, "id">;

function emptyItem(): ItemDraft {
  return { parcelType: "box", description: "", fragile: false };
}

export default function SendBookScreen() {
  const router = useRouter();
  const { stationId } = useLocalSearchParams<{ stationId: string }>();
  const [origin, setOrigin] = useState<ReturnType<typeof getStationById>>(undefined);
  const [destinations, setDestinations] = useState<Station[]>([]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    recipientName: "",
    recipientPhone: "",
    destinationStationId: destinations[0]?.id ?? "",
    items: [emptyItem()] as ItemDraft[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!stationId) {
      setOrigin(null);
      return;
    }
    const cached = getStationById(stationId);
    if (cached) {
      setOrigin(cached);
      return;
    }
    resolveStationById(stationId).then((station) => setOrigin(station ?? null));
  }, [stationId]);

  useEffect(() => {
    if (!origin) return;
    ensureStationsLoaded().then((stations) => {
      setDestinations(sortStationsAlphabetically(stations.filter((s) => s.id !== origin.id)));
    });
  }, [origin]);

  if (origin === undefined) {
    return (
      <Screen>
        <Text style={styles.title}>Loading station...</Text>
      </Screen>
    );
  }

  if (!origin) {
    return (
      <Screen>
        <Text style={styles.title}>Station not found</Text>
        <Button label="Go back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const destStation = getStationById(form.destinationStationId);

  function validateCurrentStep(): boolean {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.senderName.trim()) next.senderName = "Required";
      if (!form.senderPhone.trim()) next.senderPhone = "Required";
    }
    if (step === 1) {
      if (!form.recipientName.trim()) next.recipientName = "Required";
      if (!form.recipientPhone.trim()) next.recipientPhone = "Required";
      if (!form.destinationStationId) next.destinationStationId = "Required";
    }
    if (step === 2) {
      if (form.items.length === 0) next.items = "Add at least one item";
      form.items.forEach((item, i) => {
        if (!item.description.trim()) next[`item-${i}`] = "Required";
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleNext() {
    if (step < 3) {
      if (validateCurrentStep()) setStep((s) => s + 1);
      return;
    }
    if (!validateCurrentStep()) return;
    if (!origin || !destStation) {
      setErrors({
        submit: "Missing station details. Go back and choose the destination again.",
      });
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await ensureStationsLoaded();
      if (!didLoadStationsFromApi()) {
        setErrors({
          submit:
            "Cannot reach the Parcela server from this device. Staff will not see bookings until the API is reachable. Use the same Wi‑Fi as your computer and allow port 3002 through Windows Firewall.",
        });
        return;
      }

      const booking = await submitBooking({
        stationId: origin.id,
        destinationStationId: destStation.id,
        senderName: form.senderName.trim(),
        senderPhone: form.senderPhone.trim(),
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        items: form.items.map((item) => ({
          parcelType: item.parcelType,
          description: item.description.trim(),
          fragile: item.fragile,
        })),
      });
      router.replace({ pathname: "/send/confirm", params: { ref: booking.bookingReference } });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not save booking. Ensure the API is running and your phone is on the same Wi‑Fi as your computer.";
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? (
            <Button label="Back" variant="outline" onPress={() => setStep((s) => s - 1)} style={styles.footerBtn} />
          ) : null}
          <Button
            label={step === 3 ? (submitting ? "Saving..." : "Confirm booking") : "Continue"}
            onPress={handleNext}
            disabled={submitting}
            style={step > 0 ? styles.footerBtn : styles.footerBtnFull}
          />
        </View>
      }
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {step !== 1 ? (
        <ScreenIllustration name="receiver" height={260} />
      ) : (
        <ScreenIllustration name="receiver" height={240} maxWidth={320} />
      )}

      <Text style={styles.step}>Step 2 of 3 · {STEPS[step]}</Text>
      <Text style={styles.title}>Parcel details</Text>
      <Text style={styles.origin}>Drop-off: {origin.name}</Text>

      <View style={styles.stepDots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      {step === 0 && (
        <>
          <Input
            label="Sender name"
            value={form.senderName}
            onChangeText={(v) => setForm((f) => ({ ...f, senderName: v }))}
            error={errors.senderName}
            autoCapitalize="words"
          />
          <Input
            label="Sender phone"
            value={form.senderPhone}
            onChangeText={(v) => setForm((f) => ({ ...f, senderPhone: v }))}
            error={errors.senderPhone}
            keyboardType="phone-pad"
          />
        </>
      )}

      {step === 1 && (
        <>
          <Input
            label="Recipient name"
            value={form.recipientName}
            onChangeText={(v) => setForm((f) => ({ ...f, recipientName: v }))}
            error={errors.recipientName}
            autoCapitalize="words"
          />
          <Input
            label="Recipient phone"
            value={form.recipientPhone}
            onChangeText={(v) => setForm((f) => ({ ...f, recipientPhone: v }))}
            error={errors.recipientPhone}
            keyboardType="phone-pad"
          />
          <DestinationStationPicker
            stations={destinations}
            value={form.destinationStationId}
            onChange={(destinationStationId) =>
              setForm((f) => ({ ...f, destinationStationId }))
            }
            error={errors.destinationStationId}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.hint}>
            One booking, one tracking ID — add every item you are dropping off.
          </Text>
          {form.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                {form.items.length > 1 && (
                  <Pressable
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        items: f.items.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.fieldLabel}>Parcel type</Text>
              <View style={styles.typeRow}>
                {PARCEL_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => {
                      const items = [...form.items];
                      items[index] = { ...items[index], parcelType: t.value };
                      setForm((f) => ({ ...f, items }));
                    }}
                    style={[
                      styles.typeChip,
                      item.parcelType === t.value && styles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        item.parcelType === t.value && styles.typeChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Input
                label="Description"
                value={item.description}
                onChangeText={(v) => {
                  const items = [...form.items];
                  items[index] = { ...items[index], description: v };
                  setForm((f) => ({ ...f, items }));
                }}
                error={errors[`item-${index}`]}
                multiline
                style={{ minHeight: 72, textAlignVertical: "top" }}
              />
              <Pressable
                onPress={() => {
                  const items = [...form.items];
                  items[index] = { ...items[index], fragile: !items[index].fragile };
                  setForm((f) => ({ ...f, items }));
                }}
                style={styles.fragileRow}
              >
                <Ionicons
                  name={item.fragile ? "checkbox" : "square-outline"}
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.fragileText}>Fragile — handle with care</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))}
            style={styles.addItemBtn}
          >
            <Text style={styles.addItemText}>+ Add another item</Text>
          </Pressable>
        </>
      )}

      {step === 3 && destStation && (
        <View style={styles.reviewCard}>
          {[
            ["Sender", `${form.senderName} · ${form.senderPhone}`],
            ["Recipient", `${form.recipientName} · ${form.recipientPhone}`],
            ["Route", `${origin.name} → ${destStation.name}`],
          ].map(([k, v]) => (
            <View key={k} style={styles.reviewRow}>
              <Text style={styles.reviewKey}>{k}</Text>
              <Text style={styles.reviewVal}>{v}</Text>
            </View>
          ))}
          <Text style={[styles.reviewKey, { marginTop: 8 }]}>
            Items ({form.items.length})
          </Text>
          {form.items.map((item, index) => (
            <Text key={index} style={styles.reviewVal}>
              {formatItemLabel({ ...item, id: String(index) }, index)}
            </Text>
          ))}
        </View>
      )}

      {errors.submit ? (
        <Text style={styles.submitError}>{errors.submit}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, alignSelf: "flex-start" },
  backText: { fontFamily: fonts.display, color: colors.primary, fontWeight: "600", fontSize: 15 },
  headerImage: { width: "100%", height: 100, marginBottom: 8 },
  step: { fontFamily: fonts.display, fontSize: 10, fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: colors.foreground, marginTop: 4 },
  origin: { fontSize: 13, color: colors.muted, marginBottom: 12 },
  stepDots: { flexDirection: "row", gap: 6, marginBottom: 16 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  fieldLabel: { fontFamily: fonts.display, fontSize: 11, fontWeight: "600", color: colors.muted, textTransform: "uppercase", marginBottom: 8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, color: colors.muted },
  typeChipTextActive: { color: "#fff", fontWeight: "700" },
  fragileRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  fragileText: { fontSize: 14, color: colors.foreground },
  hint: { fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 18 },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  itemTitle: { fontFamily: fonts.display, fontSize: 14, fontWeight: "700", color: colors.foreground },
  removeText: { fontFamily: fonts.display, fontSize: 12, fontWeight: "600", color: colors.danger },
  addItemBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary + "66",
    backgroundColor: colors.primary + "10",
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  addItemText: { fontFamily: fonts.display, fontSize: 14, fontWeight: "700", color: colors.primary },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 12 },
  reviewRow: { gap: 2 },
  reviewKey: { fontFamily: fonts.display, fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
  reviewVal: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  submitError: {
    marginTop: 12,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 18,
    textAlign: "center",
  },
  footerRow: { flexDirection: "row", gap: 10 },
  footerBtn: { flex: 1 },
  footerBtnFull: { flex: 1 },
});
