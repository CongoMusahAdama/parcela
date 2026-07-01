import type { Operator } from "@/types/parcel";

export const SUPPORTED_OPERATORS = ["VIP", "STC"] as const satisfies readonly Operator[];

export const OPERATOR_LABELS: Record<Operator, string> = {
  VIP: "VIP",
  STC: "STC",
};

export const OPERATOR_ACCENT: Record<Operator, string> = {
  VIP: "#DC2626",
  STC: "#065F46",
};

export const OPERATOR_LOGOS: Record<Operator, number> = {
  VIP: require("../../assets/operators/vip.jpg"),
  STC: require("../../assets/operators/stc.png"),
};

export function isSupportedOperator(value: string): value is Operator {
  return SUPPORTED_OPERATORS.includes(value as Operator);
}
