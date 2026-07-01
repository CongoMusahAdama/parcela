import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii, touchMin } from "@/constants/theme";

type HomeActionButtonProps = {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: "primary" | "secondary";
  onPress: () => void;
  loading?: boolean;
};

export function HomeActionButton({
  title,
  description,
  icon,
  variant,
  onPress,
  loading = false,
}: HomeActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        loading && styles.loading,
      ]}
    >
      <View style={[styles.iconWrap, isPrimary ? styles.iconPrimary : styles.iconSecondary]}>
        {loading ? (
          <ActivityIndicator size="small" color={isPrimary ? "#fff" : colors.primary} />
        ) : (
          <Ionicons name={icon} size={20} color={isPrimary ? "#fff" : colors.primary} />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, !isPrimary && styles.titleSecondary]}>{title}</Text>
        {description ? (
          <Text style={[styles.desc, !isPrimary && styles.descSecondary]}>{description}</Text>
        ) : null}
      </View>

      <View style={[styles.arrow, isPrimary ? styles.arrowPrimary : styles.arrowSecondary]}>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={isPrimary ? colors.primary : "#fff"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchMin + 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    gap: 12,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  loading: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPrimary: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  iconSecondary: {
    backgroundColor: colors.primary + "12",
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "#fff",
    lineHeight: 20,
  },
  titleSecondary: {
    color: colors.primaryDark,
  },
  desc: {
    fontFamily: fonts.body,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.82)",
  },
  descSecondary: {
    color: colors.muted,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowPrimary: {
    backgroundColor: "#fff",
  },
  arrowSecondary: {
    backgroundColor: colors.primary,
  },
});
