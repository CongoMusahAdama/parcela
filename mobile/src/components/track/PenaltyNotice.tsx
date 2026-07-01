import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateHoldingPenalty,
  DAILY_PENALTY_GHS,
  formatPenaltyDeadline,
  HOLDING_GRACE_DAYS,
} from "@/lib/tracking-shared";
import type { ParcelTrackStatus } from "@/types/parcel";
import { colors, fonts, radii } from "@/constants/theme";

type PenaltyNoticeProps = {
  arrivedAt?: string;
  status: ParcelTrackStatus;
  embedded?: boolean;
};

export function PenaltyNotice({ arrivedAt, status, embedded = false }: PenaltyNoticeProps) {
  const penalty = calculateHoldingPenalty(arrivedAt, status);
  if (!penalty) return null;

  if (!penalty.isOverdue) {
    return (
      <View style={[styles.grace, embedded && styles.embedded]}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <View style={styles.body}>
          <Text style={styles.title}>Free holding period</Text>
          <Text style={styles.text}>
            Collect by {formatPenaltyDeadline(penalty.deadline)} ({HOLDING_GRACE_DAYS} days after
            arrival). After that, GHS {DAILY_PENALTY_GHS} per day applies.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.overdue, embedded && styles.embedded]}>
      <Ionicons name="warning" size={18} color={colors.danger} />
      <View style={styles.body}>
        <Text style={styles.overdueTitle}>Storage fees apply</Text>
        <Text style={styles.text}>
          {penalty.daysOverdue} day{penalty.daysOverdue === 1 ? "" : "s"} past the free period.
          Estimated fee: GHS {penalty.totalPenaltyGhs.toFixed(0)} (GHS {penalty.dailyRateGhs}/day).
          Pay at the station before collection.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grace: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 12,
  },
  overdue: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger + "44",
    backgroundColor: colors.danger + "10",
    marginTop: 12,
  },
  embedded: {
    marginTop: 0,
  },
  body: { flex: 1, gap: 4 },
  title: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.foreground,
  },
  overdueTitle: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.danger,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
});
