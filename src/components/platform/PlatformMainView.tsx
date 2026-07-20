"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, RefreshCw } from "lucide-react";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { usePlatformNav } from "@/components/platform/PlatformNavContext";
import { PlatformViewLoader } from "@/components/platform/PlatformViewLoader";
import { PLATFORM_NAV_ITEMS } from "@/lib/platform-nav";

const PlatformOverviewView = dynamic(
  () =>
    import("@/components/platform/PlatformOverviewView").then((mod) => ({
      default: mod.PlatformOverviewView,
    })),
  { loading: () => <PlatformViewLoader message="Loading overview" /> },
);

const PlatformOperatorsView = dynamic(
  () =>
    import("@/components/platform/PlatformOperatorsView").then((mod) => ({
      default: mod.PlatformOperatorsView,
    })),
  { loading: () => <PlatformViewLoader message="Loading operators" /> },
);

const PlatformHqAdminsView = dynamic(
  () =>
    import("@/components/platform/PlatformHqAdminsView").then((mod) => ({
      default: mod.PlatformHqAdminsView,
    })),
  { loading: () => <PlatformViewLoader message="Loading HQ admins" /> },
);

const PlatformUsersView = dynamic(
  () =>
    import("@/components/platform/PlatformUsersView").then((mod) => ({
      default: mod.PlatformUsersView,
    })),
  { loading: () => <PlatformViewLoader message="Loading users" /> },
);

const PlatformAuditView = dynamic(
  () =>
    import("@/components/platform/PlatformAuditView").then((mod) => ({
      default: mod.PlatformAuditView,
    })),
  { loading: () => <PlatformViewLoader message="Loading audit log" /> },
);

const PlatformNotificationsView = dynamic(
  () =>
    import("@/components/platform/PlatformNotificationsView").then((mod) => ({
      default: mod.PlatformNotificationsView,
    })),
  { loading: () => <PlatformViewLoader message="Loading notifications" /> },
);

const PLATFORM_VIEWS: Record<string, ComponentType> = {
  "/platform/dashboard": PlatformOverviewView,
  "/platform/operators": PlatformOperatorsView,
  "/platform/hq-admins": PlatformHqAdminsView,
  "/platform/users": PlatformUsersView,
  "/platform/notifications": PlatformNotificationsView,
  "/platform/audit": PlatformAuditView,
};

export function PlatformMainView() {
  const { activePath } = usePlatformNav();
  const { loading, error, refresh } = usePlatformData();
  const View = PLATFORM_VIEWS[activePath];

  if (loading && !error) {
    return <PlatformViewLoader message="Syncing platform workspace" />;
  }

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div className="max-w-md space-y-2">
          <p className="font-display text-lg font-bold text-stone-900">Could not load platform data</p>
          <p className="font-body text-sm text-stone-600">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!View) {
    const fallback = PLATFORM_NAV_ITEMS[0]?.href ?? "/platform/dashboard";
    return <PlatformOverviewView key={fallback} />;
  }

  return <View key={activePath} />;
}
