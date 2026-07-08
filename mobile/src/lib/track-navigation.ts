import type { Router } from "expo-router";
import type { ParcelTrackStatus } from "@/types/parcel";

export function goBackOrTrackHome(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/track");
}

export function getTrackStatusStepLabel(status: ParcelTrackStatus): string {
  if (status === "collected") return "Complete";
  return "Step 2 of 4";
}
