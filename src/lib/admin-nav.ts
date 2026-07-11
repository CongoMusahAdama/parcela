import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import { ADMIN_REPORT_MODULES, ADMIN_REPORTS_HUB } from "@/lib/admin-reports";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Shown when operator setup is still pending. */
  badge?: string;
  emphasizeWhenUnconfigured?: boolean;
  /** Only highlight on exact path — use for section index pages like /admin/reports. */
  matchExact?: boolean;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
  /** Hide this section once transport setup is complete. */
  hideWhenConfigured?: boolean;
  /** Folder row — children stay hidden until expanded. */
  collapsible?: boolean;
  folderItem?: AdminNavItem;
};

export const ADMIN_SETUP_ITEM: AdminNavItem = {
  label: "Admin setup",
  href: "/admin/setup",
  icon: Settings,
  description: "Configure your transport application — branches and branch leads.",
  badge: "Start here",
  emphasizeWhenUnconfigured: true,
};

export const ADMIN_REPORTS_FOLDER: AdminNavItem = {
  label: "Reports",
  href: ADMIN_REPORTS_HUB.href,
  icon: FileText,
  description: ADMIN_REPORTS_HUB.description,
  matchExact: true,
};

export const ADMIN_REPORT_CHILD_ITEMS: AdminNavItem[] = ADMIN_REPORT_MODULES.map((module) => ({
  label: module.label,
  href: module.href,
  icon: module.icon,
  description: module.description,
}));

/** @deprecated Use folder + children — kept for hub/prefetch helpers. */
export const ADMIN_REPORT_NAV_ITEMS: AdminNavItem[] = [
  ADMIN_REPORTS_FOLDER,
  ...ADMIN_REPORT_CHILD_ITEMS,
];

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Network",
    items: [
      {
        label: "Overview",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        description: "Operator-wide KPIs, branch snapshots, and alerts.",
      },
      ADMIN_SETUP_ITEM,
    ],
  },
  {
    title: "Branches",
    items: [
      {
        label: "All stations",
        href: "/admin/branches",
        icon: Building2,
        description: "View and manage terminals across your operator network.",
      },
      {
        label: "Branch leads",
        href: "/admin/leads",
        icon: UserCog,
        description: "Create and assign branch leads to stations.",
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        label: "Roles directory",
        href: "/admin/people",
        icon: Users,
        description: "All leads and counter staff across branches.",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        label: "Insights",
        href: "/admin/analytics",
        icon: BarChart3,
        description: "Compare branches, trends, and performance.",
      },
    ],
  },
  {
    title: "Reports",
    collapsible: true,
    folderItem: ADMIN_REPORTS_FOLDER,
    items: ADMIN_REPORT_CHILD_ITEMS,
  },
  {
    title: "Platform",
    items: [
      {
        label: "Operator controls",
        href: "/admin/platform",
        icon: Shield,
        description: "Emergency locks and operator-wide settings.",
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.collapsible && section.folderItem
    ? [section.folderItem, ...section.items]
    : section.items,
);

export function getAdminNavItem(href: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((item) => item.href === href);
}
