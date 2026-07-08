"use client";

import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

type StaffPlaceholderViewProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function StaffPlaceholderView({ title, description, icon: Icon }: StaffPlaceholderViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
        >
          <Icon className="size-7" strokeWidth={2.25} />
        </div>
        <h1 className="font-display mt-5 text-2xl font-bold text-foreground">{title}</h1>
        <p className="font-body mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <div
          className="font-body mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
          style={{
            background: "var(--staff-accent-muted)",
            color: "var(--staff-accent-dark)",
          }}
        >
          <Construction className="size-3.5" />
          Coming in the next build
        </div>
      </div>
    </div>
  );
}
