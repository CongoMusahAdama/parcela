import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii, spacing } from "@/constants/theme";

const STEPS = [
  {
    icon: "location-outline" as const,
    title: "Choose a station",
    description: "Pick the nearest bus station for drop-off.",
  },
  {
    icon: "cube-outline" as const,
    title: "Enter parcel details",
    description: "Add sender, recipient, and parcel info.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Drop off & go",
    description: "Take your parcel with your booking reference.",
  },
];

const STEP_STAGGER_MS = 200;
const STEP_START_DELAY_MS = 520;

function AnimatedStep({
  index,
  isLast,
  children,
}: {
  index: number;
  isLast: boolean;
  children: ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = STEP_START_DELAY_MS + index * STEP_STAGGER_MS;
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.row,
        isLast && styles.rowLast,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function HowItWorksSteps() {
  const headingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headingOpacity, {
      toValue: 1,
      duration: 400,
      delay: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headingOpacity]);

  return (
    <View style={styles.card}>
      <Animated.Text style={[styles.heading, { opacity: headingOpacity }]}>
        How it works
      </Animated.Text>
      <View style={styles.list}>
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <AnimatedStep key={step.title} index={index} isLast={isLast}>
              <View style={styles.rail}>
                <View style={styles.badge}>
                  <Ionicons name={step.icon} size={18} color={colors.primary} />
                </View>
                {!isLast ? <View style={styles.connector} /> : null}
              </View>
              <View style={[styles.copy, isLast && styles.copyLast]}>
                <View style={styles.titleRow}>
                  <View style={styles.stepPill}>
                    <Text style={styles.stepPillText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.title}>{step.title}</Text>
                </View>
                <Text style={styles.description}>{step.description}</Text>
              </View>
            </AnimatedStep>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  list: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
  },
  rowLast: {
    marginBottom: 0,
  },
  rail: {
    alignItems: "center",
    width: 40,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + "14",
    borderWidth: 1,
    borderColor: colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 6,
    borderRadius: 1,
    backgroundColor: colors.primary + "28",
  },
  copy: {
    flex: 1,
    paddingBottom: 18,
  },
  copyLast: {
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepPillText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: "#fff",
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 20,
  },
  description: {
    fontFamily: fonts.body,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
});
