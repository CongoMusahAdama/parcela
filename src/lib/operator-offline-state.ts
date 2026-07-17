import { clearStaffMutationQueue } from "@/lib/staff-mutation-queue";

export const STAFF_PARCEL_CACHE_KEY = "parcela_staff_parcels_cache_v1";

/** Clear cached parcels and queued counter actions on sign-out. */
export function clearOperatorOfflineState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STAFF_PARCEL_CACHE_KEY);
  } catch {
    // ignore
  }
  clearStaffMutationQueue();
}
