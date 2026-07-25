const STAFF_VIEW_LOADERS: Record<string, () => Promise<unknown>> = {
  "/staff/dashboard": () => import("@/components/staff/StaffDashboardView"),
  "/staff/walk-in": () => import("@/components/staff/StaffWalkInView"),
  "/staff/pending": () => import("@/components/staff/StaffPendingView"),
  "/staff/verify": () => import("@/components/staff/StaffVerifyView"),
  "/staff/in-transit": () => import("@/components/staff/StaffInTransitView"),
  "/staff/arrived": () => import("@/components/staff/StaffArrivedView"),
  "/staff/collection": () => import("@/components/staff/StaffCollectionView"),
  "/staff/release": () => import("@/components/staff/StaffReleaseView"),
  "/staff/search": () => import("@/components/staff/StaffSearchView"),
  "/staff/station-qr": () => import("@/components/staff/StaffStationQrView"),
  "/staff/reports": () => import("@/components/staff/StaffReportsView"),
};

export function prefetchStaffView(href: string) {
  const load = STAFF_VIEW_LOADERS[href];
  if (load) void load();
}

export function prefetchAllStaffViews() {
  return Promise.all(Object.values(STAFF_VIEW_LOADERS).map((load) => load())).catch(() => undefined);
}
