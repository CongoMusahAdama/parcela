import type { ParcelTrackStatus } from "@/types/parcel";

export function getTrackStatusStepLabel(status: ParcelTrackStatus): string {
  if (status === "collected") return "Complete";
  return "Step 2 of 4";
}
