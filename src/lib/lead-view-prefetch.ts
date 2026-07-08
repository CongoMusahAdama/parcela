const LEAD_VIEW_LOADERS: Record<string, () => Promise<unknown>> = {
  "/lead/dashboard": () => import("@/components/lead/LeadDashboardView"),
  "/lead/team": () => import("@/components/lead/LeadTeamView"),
  "/lead/analytics": () => import("@/components/lead/LeadAnalyticsView"),
  "/lead/reports": () => import("@/components/lead/LeadReportsView"),
};

export function prefetchLeadView(href: string) {
  const load = LEAD_VIEW_LOADERS[href];
  if (load) void load();
}

export function prefetchAllLeadViews() {
  return Promise.all(Object.values(LEAD_VIEW_LOADERS).map((load) => load())).catch(
    () => undefined,
  );
}
