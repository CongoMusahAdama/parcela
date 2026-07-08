import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { lookupParcel } from "@/lib/tracking";
import { goBackOrTrackHome } from "@/lib/track-navigation";
import { useSweetAlert } from "@/lib/sweetalert";
import { colors, fonts } from "@/constants/theme";

export default function TrackEntryScreen() {
  const router = useRouter();
  const sweetAlert = useSweetAlert();
  const [code, setCode] = useState("");

  async function handleTrack() {
    const trimmed = code.trim();
    if (!trimmed) {
      await sweetAlert.error({
        title: "Enter a pickup code",
        text: "Use the code printed on the receipt the sender shared with you.",
      });
      return;
    }

    const parcel = await lookupParcel(trimmed);
    if (!parcel) {
      await sweetAlert.error({
        title: "Parcel not found",
        text: "Check the pickup code and try again.",
        confirmText: "Try again",
      });
      return;
    }

    router.push({ pathname: "/track/status", params: { code: parcel.pickupCode } });
  }

  return (
    <Screen
      footer={<Button label="Track parcel" onPress={handleTrack} disabled={!code.trim()} />}
    >
      <Pressable onPress={() => goBackOrTrackHome(router)} style={styles.back}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <ScreenIllustration name="receiver1" height={300} maxWidth={340} />

      <Text style={styles.step}>Step 1 of 4</Text>
      <Text style={styles.title}>Track your parcel</Text>
      <Text style={styles.subtitle}>
        Enter the pickup code from the receipt the sender gave you.
      </Text>

      <Input
        label="Pickup code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="e.g. PKP-XXXX"
        returnKeyType="search"
        onSubmitEditing={handleTrack}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, alignSelf: "flex-start" },
  backText: { fontFamily: fonts.display, color: colors.primary, fontWeight: "600", fontSize: 15 },
  headerImage: { width: "100%", height: 140, marginBottom: 8 },
  step: { fontFamily: fonts.display, fontSize: 10, fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: colors.foreground, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 8 },
});
