import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/constants/theme";
import { images } from "@/lib/images";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const sizes = { sm: 32, md: 40, lg: 52 };

export function Logo({ size = "md", showWordmark = true }: LogoProps) {
  const h = sizes[size];
  return (
    <View style={styles.row}>
      <Image
        source={images.logo}
        style={{ height: h, width: h * 1.2 }}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
      />
      {showWordmark ? (
        <Text style={[styles.wordmark, size === "lg" && styles.wordmarkLg]}>PARCELA</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 2,
    marginLeft: -4,
    flexShrink: 0,
    // letterSpacing extends past the last glyph; without padding the final "A" gets clipped
    paddingRight: 6,
  },
  wordmarkLg: {
    fontSize: 14,
    letterSpacing: 2.5,
    paddingRight: 8,
  },
});
