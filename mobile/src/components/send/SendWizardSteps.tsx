import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/constants/theme";

const STEPS = [
  { id: 1, label: "Station" },
  { id: 2, label: "Details" },
  { id: 3, label: "Confirm" },
] as const;

type SendWizardStepsProps = {
  current: 1 | 2 | 3;
};

export function SendWizardSteps({ current }: SendWizardStepsProps) {
  const progress = current > 1 ? ((current - 1) / (STEPS.length - 1)) * 100 : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${progress}%` }]} />
      </View>
      <View style={styles.row}>
        {STEPS.map((step) => {
          const isComplete = step.id < current;
          const isCurrent = step.id === current;
          return (
            <View key={step.id} style={styles.step}>
              <View
                style={[
                  styles.circle,
                  (isComplete || isCurrent) && styles.circleActive,
                  !isComplete && !isCurrent && styles.circleMuted,
                ]}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.circleNum,
                      (isComplete || isCurrent) && styles.circleNumActive,
                    ]}
                  >
                    {step.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isCurrent && styles.labelCurrent,
                  isComplete && !isCurrent && styles.labelDone,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  track: {
    position: "absolute",
    left: "16.67%",
    right: "16.67%",
    top: 19,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  progress: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  step: { flex: 1, alignItems: "center" },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  circleMuted: {
    backgroundColor: colors.background,
  },
  circleNum: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  circleNumActive: {
    color: "#fff",
  },
  label: {
    fontFamily: fonts.display,
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  labelCurrent: {
    color: colors.primary,
  },
  labelDone: {
    color: colors.foreground,
  },
});
