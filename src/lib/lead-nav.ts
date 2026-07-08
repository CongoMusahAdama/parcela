import type { LucideIcon } from "lucide-react";
import { BarChart3, FileText, LayoutDashboard, Users } from "lucide-react";

export type LeadNavItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
};

export const LEAD_NAV_ITEMS: LeadNavItem[] = [
  {
    label: "Branch overview",
    shortLabel: "Home",
    href: "/lead/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Manage staff",
    shortLabel: "Staff",
    href: "/lead/team",
    icon: Users,
  },
  {
    label: "Analytics",
    shortLabel: "Numbers",
    href: "/lead/analytics",
    icon: BarChart3,
  },
  {
    label: "Reports",
    shortLabel: "Reports",
    href: "/lead/reports",
    icon: FileText,
  },
];

export function getLeadNavItem(href: string): LeadNavItem | undefined {
  return LEAD_NAV_ITEMS.find((item) => item.href === href);
}
