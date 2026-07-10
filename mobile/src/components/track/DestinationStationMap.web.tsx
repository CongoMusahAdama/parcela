import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Operator } from "@/types/parcel";
import { colors, fonts, radii } from "@/constants/theme";

type DestinationStationMapProps = {
  lat: number;
  lng: number;
  name: string;
  operator?: Operator;
};

export function DestinationStationMap({ lat, lng, name, operator }: DestinationStationMapProps) {
  const accent = colors.primary;

  return (
    <View style={styles.wrap}>
      <View style={[styles.placeholder, { borderColor: accent + "44" }]}>
        <Ionicons name="location" size={24} color={accent} />
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.coords}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
        <Text style={styles.note}>Map preview available in Expo Go on your phone.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  placeholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.foreground,
    textAlign: "center",
  },
  coords: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  note: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
  },
});
