"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const DEMO_STEPS = [
  { n: 1, label: "Create lead", href: "/admin/leads" },
  { n: 2, label: "Setup coverage", href: "/admin/setup" },
  { n: 3, label: "Insights", href: "/admin/analytics" },
  { n: 4, label: "Report", href: "/admin/reports/activities" },
  { n: 5, label: "Emergency lock", href: "/admin/platform" },
] as const;

export function AdminDemoWalkthrough() {
  return (
    <section className="mt-4 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
          Try this next
        </p>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {DEMO_STEPS.map((step, index) => (
            <div key={step.n} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ArrowRight className="hidden size-3 text-muted/50 sm:block" aria-hidden />
              ) : null}
              <Link
                href={step.href}
                className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
              >
                <span
                  className="flex size-4 items-center justify-center rounded text-[9px] font-bold text-white"
                  style={{ background: "var(--staff-accent)" }}
                >
                  {step.n}
                </span>
                {step.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
