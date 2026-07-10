import { Image, type ImageSource } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import type { Operator } from "@/types/parcel";
import { APP_ACCENT, getOperatorLabel, getOperatorLogoSource } from "@/lib/operators";
import { colors, fonts } from "@/constants/theme";

type OperatorLogoProps = {
  operator: Operator;
  variant?: "inline" | "watermark";
  height?: number;
};

function OperatorInitialsMark({ operator, height }: { operator: string; height: number }) {
  const initials = getOperatorLabel(operator)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || operator.slice(0, 2).toUpperCase();

  return (
    <View
      style={[
        styles.initials,
        {
          height,
          minWidth: height * 1.6,
          backgroundColor: APP_ACCENT,
        },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize: height * 0.38 }]}>{initials}</Text>
    </View>
  );
}

export function OperatorLogo({
  operator,
  variant = "inline",
  height = 36,
}: OperatorLogoProps) {
  const source = getOperatorLogoSource(operator);

  if (!source) {
    if (variant === "watermark") {
      return (
        <View style={styles.watermarkWrap} pointerEvents="none">
          <OperatorInitialsMark operator={operator} height={120} />
        </View>
      );
    }
    return <OperatorInitialsMark operator={operator} height={height} />;
  }

  const imageSource = source as ImageSource;

  if (variant === "watermark") {
    return (
      <View style={styles.watermarkWrap} pointerEvents="none">
        <Image
          source={imageSource}
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
      source={imageSource}
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
    opacity: 0.22,
  },
  initials: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    opacity: 0.22,
  },
  initialsText: {
    fontFamily: fonts.display,
    fontWeight: "800",
    color: "#fff",
  },
});
