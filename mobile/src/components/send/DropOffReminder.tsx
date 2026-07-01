import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "@/constants/theme";

type DropOffReminderProps = {
  stationName: string;
};

export function DropOffReminder({ stationName }: DropOffReminderProps) {
  return (
    <View style={styles.banner}>
      <Ionicons name="location-outline" size={15} color={colors.primary} />
      <Text style={styles.text}>
        Show this receipt at <Text style={styles.station}>{stationName}</Text> when you drop off.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  station: {
    fontWeight: "600",
    color: colors.foreground,
  },
});
