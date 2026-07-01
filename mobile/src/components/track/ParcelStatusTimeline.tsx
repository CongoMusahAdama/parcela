import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";
import type { ParcelTrackStatus } from "@/types/parcel";
import { colors, fonts, radii } from "@/constants/theme";

const STATUS_ORDER: ParcelTrackStatus[] = [
  "pending_dropoff",
  "in_transit",
  "arrived",
  "ready_for_collection",
  "collected",
];

type ParcelStatusTimelineProps = {
  status: ParcelTrackStatus;
};

export function ParcelStatusTimeline({ status }: ParcelStatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <View style={styles.card}>
      {STATUS_ORDER.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_ORDER.length - 1;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.track}>
              <View
                style={[
                  styles.dot,
                  isComplete && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                  !isComplete && !isCurrent && styles.dotUpcoming,
                ]}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : isCurrent ? (
                  <View style={styles.dotInner} />
                ) : null}
              </View>
              {!isLast && (
                <View style={[styles.line, index < currentIndex && styles.lineDone]} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                !isLast && styles.labelSpaced,
                isComplete && styles.labelDone,
                isCurrent && styles.labelCurrent,
                !isComplete && !isCurrent && styles.labelUpcoming,
              ]}
            >
              {TRACK_STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 22;
const LINE_H = 18;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  track: {
    width: DOT,
    alignItems: "center",
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  dotUpcoming: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  line: {
    width: 2,
    height: LINE_H,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  lineDone: {
    backgroundColor: colors.primary + "99",
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  labelSpaced: {
    paddingBottom: LINE_H + 4,
  },
  labelDone: {
    fontFamily: fonts.display,
    fontWeight: "600",
    color: colors.foreground,
  },
  labelCurrent: {
    fontFamily: fonts.display,
    fontWeight: "700",
    color: colors.primary,
  },
  labelUpcoming: {
    color: colors.muted,
  },
});
