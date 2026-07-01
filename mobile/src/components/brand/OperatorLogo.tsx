import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import type { Operator } from "@/types/parcel";
import { OPERATOR_LOGOS } from "@/lib/operators";

type OperatorLogoProps = {
  operator: Operator;
  variant?: "inline" | "watermark";
  height?: number;
};

export function OperatorLogo({
  operator,
  variant = "inline",
  height = 36,
}: OperatorLogoProps) {
  const source = OPERATOR_LOGOS[operator];

  if (variant === "watermark") {
    return (
      <View style={styles.watermarkWrap} pointerEvents="none">
        <Image
          source={source}
          style={styles.watermark}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ height, width: height * 2.8, maxWidth: 160 }}
      contentFit="contain"
      transition={0}
      cachePolicy="memory-disk"
    />
  );
}

const styles = StyleSheet.create({
  watermarkWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  watermark: {
    width: "88%",
    height: 168,
    opacity: 0.28,
  },
});
