import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "@/components/brand/Logo";
import { useSplashGate } from "@/contexts/SplashGate";
import { images, preloadAppImages } from "@/lib/images";
import { colors, fonts } from "@/constants/theme";

const DURATION_MS = 7800;
const FADE_DURATION_MS = 650;
const DOT_DURATION_MS = 720;
const DOT_STAGGER_MS = 280;

SplashScreen.preventAutoHideAsync().catch(() => {});

function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
  ];

  useEffect(() => {
    const loops = dots.map((opacity, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * DOT_STAGGER_MS),
          Animated.timing(opacity, {
            toValue: 1,
            duration: DOT_DURATION_MS,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: DOT_DURATION_MS,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.delay((dots.length - 1 - index) * DOT_STAGGER_MS),
        ])
      )
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dots]);

  return (
    <View style={styles.dotsRow}>
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity,
              transform: [
                {
                  scale: opacity.interpolate({
                    inputRange: [0.25, 1],
                    outputRange: [0.85, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function SplashOverlay() {
  const { markDone } = useSplashGate();
  const [visible, setVisible] = useState(true);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;

    preloadAppImages()
      .catch(() => {})
      .finally(() => {
        if (mounted) SplashScreen.hideAsync().catch(() => {});
      });

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();

    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS - FADE_DURATION_MS - 400,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: false,
    });
    progressAnim.start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    const fadeTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        markDone();
      });
    }, DURATION_MS - FADE_DURATION_MS);

    return () => {
      mounted = false;
      breathe.stop();
      shimmerLoop.stop();
      progressAnim.stop();
      clearTimeout(fadeTimer);
    };
  }, [logoScale, markDone, overlayOpacity, progress, shimmer]);

  if (!visible) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto">
      <Image
        source={images.collection}
        style={styles.bg}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
      />

      <View style={[styles.logoWrap, { paddingTop: Math.max(72, insets.top + 52) }]}>
        <Animated.View style={[styles.logoScale, { transform: [{ scale: logoScale }] }]}>
          <Logo size="lg" />
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(40, insets.bottom + 24) }]}>
        <View style={styles.loaderHeader}>
          <Text style={styles.loadingLabel}>Getting ready</Text>
          <LoadingDots />
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          <Animated.View style={[styles.progressGlow, { opacity: shimmerOpacity }]} />
        </View>

        <Text style={styles.loadingHint}>Please wait a moment</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "#fff",
  },
  bg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoScale: {
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 40,
    alignItems: "center",
    gap: 16,
  },
  loaderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingLabel: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressTrack: {
    width: "100%",
    maxWidth: 260,
    height: 3,
    borderRadius: 4,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
  },
  loadingHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
