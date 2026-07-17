"use client";

import { notFound } from "next/navigation";
import { StaffPlaceholderView } from "@/components/staff/StaffPlaceholderView";
import { getStaffNavItem } from "@/lib/staff-nav";

type StaffFeaturePageProps = {
  href: string;
};

export function StaffFeaturePage({ href }: StaffFeaturePageProps) {
  const item = getStaffNavItem(href);
  if (!item) notFound();

  return (
    <main className="operator-portal-main">
      <StaffPlaceholderView
        title={item.label}
        description={item.description}
        icon={item.icon}
      />
    </main>
  );
}
