import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ADMIN_REPORT_MODULES, ADMIN_REPORTS_HUB } from "@/lib/admin-reports";

export function AdminReportsHubView() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Reports
        </p>
        <h1 className="font-display mt-2 text-2xl font-bold text-foreground">
          {ADMIN_REPORTS_HUB.label}
        </h1>
        <p className="font-body mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {ADMIN_REPORTS_HUB.description} Pick a report below — each one has its own dedicated page
          for viewing and export.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {ADMIN_REPORT_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.id}
              href={module.href}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--staff-accent-muted)",
                    color: "var(--staff-accent)",
                  }}
                >
                  <Icon className="size-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-foreground">{module.label}</h2>
                  <p className="font-body mt-1 text-xs font-medium text-muted">{module.summary}</p>
                  <p className="font-body mt-2 text-sm leading-relaxed text-muted">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="font-display mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--staff-accent)]">
                Open report
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
