import { useRef, useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii } from "@/constants/theme";

type ScrollWithHintProps = ScrollViewProps & {
  children: ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  hintLabel?: string;
};

export function ScrollWithHint({
  children,
  wrapperStyle,
  hintLabel = "Scroll for more",
  style,
  contentContainerStyle,
  onScroll,
  onContentSizeChange,
  onLayout,
  ...rest
}: ScrollWithHintProps) {
  const viewportHeight = useRef(0);
  const [showHint, setShowHint] = useState(false);

  function updateHint(contentHeight: number, scrollY = 0) {
    const canScroll = contentHeight > viewportHeight.current + 8;
    const atBottom = scrollY + viewportHeight.current >= contentHeight - 24;
    setShowHint(canScroll && !atBottom);
  }

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <ScrollView
        style={style}
        contentContainerStyle={[
          contentContainerStyle,
          showHint && styles.contentWithHint,
        ]}
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportHeight.current = event.nativeEvent.layout.height;
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          updateHint(height);
          onContentSizeChange?.(width, height);
        }}
        onScroll={(event) => {
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
          updateHint(contentSize.height, contentOffset.y);
          onScroll?.(event);
        }}
        {...rest}
      >
        {children}
      </ScrollView>

      {showHint ? (
        <View style={styles.hintOverlay} pointerEvents="none">
          <View style={styles.hintFade} />
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>{hintLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  hintOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: 6,
  },
  hintFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: colors.background,
    opacity: 0.92,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + "33",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  hintText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    color: colors.primary,
  },
  contentWithHint: {
    paddingBottom: 40,
  },
});
