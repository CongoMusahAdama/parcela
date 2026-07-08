const ADMIN_VIEW_LOADERS: Record<string, () => Promise<unknown>> = {
  "/admin/dashboard": () => import("@/components/admin/AdminDashboardView"),
  "/admin/setup": () => import("@/components/admin/AdminSetupView"),
  "/admin/branches": () => import("@/components/admin/AdminBranchesView"),
  "/admin/leads": () => import("@/components/admin/AdminLeadsView"),
  "/admin/people": () => import("@/components/admin/AdminPeopleView"),
  "/admin/analytics": () => import("@/components/admin/AdminAnalyticsView"),
  "/admin/reports": () => import("@/components/admin/AdminReportsHubView"),
  "/admin/reports/activities": () => import("@/components/admin/AdminReportModuleView"),
  "/admin/reports/parcel-register": () => import("@/components/admin/AdminReportModuleView"),
  "/admin/reports/cross-branch": () => import("@/components/admin/AdminReportModuleView"),
  "/admin/reports/delayed-parcels": () => import("@/components/admin/AdminReportModuleView"),
  "/admin/reports/branch-performance": () =>
    import("@/components/admin/AdminReportModuleView"),
  "/admin/platform": () => import("@/components/admin/AdminPlatformView"),
};

export function prefetchAdminView(href: string) {
  const load = ADMIN_VIEW_LOADERS[href];
  if (load) void load();
}

export function prefetchAllAdminViews() {
  return Promise.all(Object.values(ADMIN_VIEW_LOADERS).map((load) => load())).catch(
    () => undefined,
  );
}
