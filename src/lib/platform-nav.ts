import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  Users,
  UserCog,
} from "lucide-react";

export type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type PlatformNavSection = {
  title: string;
  items: PlatformNavItem[];
};

export const PLATFORM_NAV_SECTIONS: PlatformNavSection[] = [
  {
    title: "Control",
    items: [
      {
        label: "Overview",
        href: "/platform/dashboard",
        icon: LayoutDashboard,
        description: "Live operators, HQ access, and setup status.",
      },
      {
        label: "Operators",
        href: "/platform/operators",
        icon: Building2,
        description: "Onboard and configure any transport service.",
      },
      {
        label: "HQ admins",
        href: "/platform/hq-admins",
        icon: UserCog,
        description: "Issue HQ logins after a transport is configured.",
      },
      {
        label: "Users",
        href: "/platform/users",
        icon: Users,
        description: "All logins across transports — reset when someone is locked out.",
      },
    ],
  },
  {
    title: "Record",
    items: [
      {
        label: "Audit",
        href: "/platform/audit",
        icon: ScrollText,
        description: "Who was onboarded, reset, or suspended.",
      },
    ],
  },
];

export const PLATFORM_NAV_ITEMS = PLATFORM_NAV_SECTIONS.flatMap((s) => s.items);

export function getPlatformNavItem(pathname: string): PlatformNavItem | undefined {
  return PLATFORM_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
