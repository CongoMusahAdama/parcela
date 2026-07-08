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
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StaffPlaceholderView
        title={item.label}
        description={item.description}
        icon={item.icon}
      />
    </main>
  );
}
