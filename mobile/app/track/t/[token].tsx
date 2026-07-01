import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { lookupParcelByToken } from "@/lib/tracking";
import { colors, fonts } from "@/constants/theme";

export default function TrackLinkScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      router.replace("/track");
      return;
    }
    lookupParcelByToken(token).then((parcel) => {
      if (!parcel) {
        router.replace("/track");
        return;
      }
      router.replace({ pathname: "/track/status", params: { code: parcel.pickupCode } });
    });
  }, [token, router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>Opening your parcel...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
});
