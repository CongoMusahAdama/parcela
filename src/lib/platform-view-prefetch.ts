const PLATFORM_VIEW_LOADERS: Record<string, () => Promise<unknown>> = {
  "/platform/dashboard": () => import("@/components/platform/PlatformOverviewView"),
  "/platform/operators": () => import("@/components/platform/PlatformOperatorsView"),
  "/platform/hq-admins": () => import("@/components/platform/PlatformHqAdminsView"),
  "/platform/users": () => import("@/components/platform/PlatformUsersView"),
  "/platform/audit": () => import("@/components/platform/PlatformAuditView"),
};

export function prefetchPlatformView(href: string) {
  const load = PLATFORM_VIEW_LOADERS[href];
  if (load) void load();
}

export function prefetchAllPlatformViews() {
  return Promise.all(Object.values(PLATFORM_VIEW_LOADERS).map((load) => load())).catch(
    () => undefined,
  );
}
