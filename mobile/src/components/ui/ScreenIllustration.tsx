import { Image, type ImageProps } from "expo-image";
import { StyleSheet } from "react-native";
import type { ImageKey } from "@/lib/images";
import { images } from "@/lib/images";

type ScreenIllustrationProps = {
  name: ImageKey;
  height: number;
  width?: number | `${number}%`;
  maxWidth?: number;
  priority?: ImageProps["priority"];
  contentFit?: ImageProps["contentFit"];
};

export function ScreenIllustration({
  name,
  height,
  width = "100%",
  maxWidth,
  priority = "high",
  contentFit = "contain",
}: ScreenIllustrationProps) {
  return (
    <Image
      source={images[name]}
      style={[styles.image, { height, width }, maxWidth != null && { maxWidth, alignSelf: "center" }]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={name}
      transition={120}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
  },
});
