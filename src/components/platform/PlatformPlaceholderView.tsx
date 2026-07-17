"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

type PlatformPlaceholderViewProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PlatformPlaceholderView({
  title,
  description,
  icon: Icon,
}: PlatformPlaceholderViewProps) {
  return (
    <main className="operator-portal-main">
      <Link
        href="/platform/dashboard"
        className="font-display inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500 transition-colors hover:text-[var(--platform-orange)]"
      >
        <ArrowLeft className="size-3.5" />
        Overview
      </Link>
      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center shadow-sm">
        <span
          className="mx-auto flex size-12 items-center justify-center rounded-2xl"
          style={{
            background: "var(--platform-orange-soft)",
            color: "var(--platform-orange)",
          }}
        >
          <Icon className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="font-display mt-4 text-xl font-bold text-stone-900">{title}</h1>
        <p className="font-body mx-auto mt-2 max-w-md text-sm text-stone-500">{description}</p>
        <p className="font-display mt-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Coming in the next build
        </p>
      </div>
    </main>
  );
}
