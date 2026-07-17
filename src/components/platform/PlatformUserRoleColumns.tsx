"use client";

import { Building2, MapPin, Users } from "lucide-react";
import type { PlatformUserRole } from "@/lib/platform-demo";
import { cn } from "@/lib/utils";

export type PlatformUserRoleFilter = PlatformUserRole;

export const USER_TABLE_COLSPAN = 7;

export const USER_ROLE_TABS: {
  id: PlatformUserRole;
  label: string;
  short: string;
  description: string;
  icon: typeof Building2;
  tone: string;
}[] = [
  {
    id: "hq_admin",
    label: "HQ admins",
    short: "HQ admin",
    description: "Headquarters administrators who run each transport service",
    icon: Building2,
    tone: "bg-sky-50 text-sky-900 ring-sky-200",
  },
  {
    id: "branch_lead",
    label: "Branch leads",
    short: "Branch lead",
    description: "Terminal and branch managers at each station",
    icon: MapPin,
    tone: "bg-violet-50 text-violet-900 ring-violet-200",
  },
  {
    id: "counter_staff",
    label: "Staff",
    short: "Counter staff",
    description: "Counter staff who book and release parcels daily",
    icon: Users,
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
  },
];

export function PlatformUserRoleTabs({
  activeRole,
  onChange,
  counts,
}: {
  activeRole: PlatformUserRole;
  onChange: (role: PlatformUserRole) => void;
  counts: Record<PlatformUserRole, number>;
}) {
  return (
    <div className="operator-portal-tabs flex items-center gap-1 border-b border-stone-100 bg-stone-50/60 px-4 py-3">
      {USER_ROLE_TABS.map((tab) => {
        const active = activeRole === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "font-display shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all",
              active
                ? "text-white shadow-md"
                : "text-stone-500 hover:bg-[var(--platform-orange-soft)] hover:text-[var(--platform-orange-dark)]",
            )}
            style={active ? { background: "var(--platform-orange)" } : undefined}
          >
            <Icon className="size-3.5" strokeWidth={2.25} />
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                active ? "bg-white/20" : "bg-white/80 text-stone-500",
              )}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function platformUserRoleColumnLabel(role: PlatformUserRole) {
  return USER_ROLE_TABS.find((tab) => tab.id === role)?.short ?? role;
}

export function platformUserRoleTabMeta(role: PlatformUserRole) {
  return USER_ROLE_TABS.find((tab) => tab.id === role) ?? USER_ROLE_TABS[0];
}
