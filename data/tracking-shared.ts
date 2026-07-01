type ParcelTrackStatus =
  | "pending_dropoff"
  | "in_transit"
  | "arrived"
  | "ready_for_collection"
  | "collected";

export const HOLDING_GRACE_DAYS = 3;
export const DAILY_PENALTY_GHS = 5;

export type HoldingPenalty = {
  isOverdue: boolean;
  daysOverdue: number;
  dailyRateGhs: number;
  totalPenaltyGhs: number;
  graceDays: number;
  deadline: Date;
};

const COLLECTABLE: ParcelTrackStatus[] = ["arrived", "ready_for_collection"];

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 3)} *** ${digits.slice(-4)}`;
}

export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "***";
  return parts
    .map((part) => (part.length <= 1 ? `${part}***` : `${part[0]}${"*".repeat(Math.min(3, part.length - 1))}`))
    .join(" ");
}

export function deriveTrackingToken(bookingReference: string): string {
  const clean = bookingReference.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return clean.slice(-10).toLowerCase();
}

export function calculateHoldingPenalty(
  arrivedAt: string | undefined,
  status: ParcelTrackStatus,
  now: Date = new Date()
): HoldingPenalty | null {
  if (!arrivedAt || !COLLECTABLE.includes(status)) return null;

  const arrived = new Date(arrivedAt);
  if (Number.isNaN(arrived.getTime())) return null;

  const deadline = new Date(arrived);
  deadline.setDate(deadline.getDate() + HOLDING_GRACE_DAYS);

  if (now <= deadline) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      dailyRateGhs: DAILY_PENALTY_GHS,
      totalPenaltyGhs: 0,
      graceDays: HOLDING_GRACE_DAYS,
      deadline,
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOverdue = Math.ceil((now.getTime() - deadline.getTime()) / msPerDay);

  return {
    isOverdue: true,
    daysOverdue,
    dailyRateGhs: DAILY_PENALTY_GHS,
    totalPenaltyGhs: daysOverdue * DAILY_PENALTY_GHS,
    graceDays: HOLDING_GRACE_DAYS,
    deadline,
  };
}

export function formatExpectedArrival(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function formatPenaltyDeadline(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
