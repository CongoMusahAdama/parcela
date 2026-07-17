"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  KeyRound,
  Plus,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { PlatformModalShell } from "@/components/platform/PlatformModalShell";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import {
  PlatformTablePagination,
  PlatformTableSnCell,
  PlatformTableSnHeader,
} from "@/components/platform/PlatformTablePagination";
import { PlatformTableToolbar } from "@/components/platform/PlatformTableToolbar";
import {
  formatPlatformWhen,
  formatPlatformWhenRelative,
  getPlatformAuditKind,
  getPlatformAuditStats,
  parsePlatformAuditOperator,
  platformAuditKindLabel,
  type PlatformAuditKind,
  type PlatformAuditRow,
} from "@/lib/platform-demo";
import { platformRowNumber, usePlatformPagination } from "@/lib/platform-pagination";
import { cn } from "@/lib/utils";

type AuditKindFilter = "all" | PlatformAuditKind;

const AUDIT_KINDS: {
  id: PlatformAuditKind;
  label: string;
  icon: typeof Plus;
  tone: string;
  iconWrap: string;
}[] = [
  {
    id: "onboard",
    label: "Onboarding",
    icon: Plus,
    tone: "bg-sky-50 text-sky-900 ring-sky-200",
    iconWrap: "bg-sky-100 text-sky-700",
  },
  {
    id: "configure",
    label: "Configuration",
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "credentials",
    label: "Credentials",
    icon: KeyRound,
    tone: "bg-violet-50 text-violet-900 ring-violet-200",
    iconWrap: "bg-violet-100 text-violet-700",
  },
  {
    id: "access",
    label: "Access",
    icon: ShieldAlert,
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
    iconWrap: "bg-amber-100 text-amber-700",
  },
];

function auditKindConfig(kind: PlatformAuditKind) {
  return AUDIT_KINDS.find((item) => item.id === kind) ?? AUDIT_KINDS[0];
}

function AuditKindBadge({ kind, compact = false }: { kind: PlatformAuditKind; compact?: boolean }) {
  if (kind === "other") {
    return (
      <span className="font-display inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-700 ring-1 ring-inset ring-stone-200">
        <ScrollText className="size-3" />
        Other
      </span>
    );
  }

  const config = auditKindConfig(kind);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
        config.tone,
        compact && "px-2 py-0.5",
      )}
    >
      <Icon className="size-3 shrink-0" strokeWidth={2.25} />
      {platformAuditKindLabel(kind)}
    </span>
  );
}

function AuditKindFilterBar({
  value,
  onChange,
  stats,
  className,
}: {
  value: AuditKindFilter;
  onChange: (value: AuditKindFilter) => void;
  stats: ReturnType<typeof getPlatformAuditStats>;
  className?: string;
}) {
  const filters: { id: AuditKindFilter; label: string; count: number; icon?: typeof Plus; tone?: string }[] = [
    { id: "all", label: "All events", count: stats.total },
    ...AUDIT_KINDS.map((kind) => ({
      id: kind.id as AuditKindFilter,
      label: kind.label,
      count: stats[kind.id],
      icon: kind.icon,
      tone: kind.tone,
    })),
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {filters.map((filter) => {
        const active = value === filter.id;
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all",
              active
                ? filter.id === "all"
                  ? "bg-[var(--platform-orange)] text-white shadow-sm"
                  : cn("ring-1 ring-inset shadow-sm", filter.tone)
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {Icon ? <Icon className="size-3" strokeWidth={2.25} /> : null}
            {filter.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                active ? "bg-black/10" : "bg-white/80 text-stone-500",
              )}
            >
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PlatformAuditView() {
  const { audit, operators } = usePlatformData();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AuditKindFilter>("all");
  const [selected, setSelected] = useState<PlatformAuditRow | null>(null);

  const stats = getPlatformAuditStats(audit);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((row) => {
      const kind = getPlatformAuditKind(row.action);
      if (kindFilter !== "all" && kind !== kindFilter) return false;
      if (!q) return true;
      return (
        row.action.toLowerCase().includes(q) ||
        row.detail.toLowerCase().includes(q) ||
        platformAuditKindLabel(kind).toLowerCase().includes(q)
      );
    });
  }, [audit, query, kindFilter]);

  const listPagination = usePlatformPagination(filtered, 8, `${query}|${kindFilter}`);

  const selectedKind = selected ? getPlatformAuditKind(selected.action) : null;
  const selectedOperatorCode = selected ? parsePlatformAuditOperator(selected.detail) : null;
  const selectedOperator = selectedOperatorCode
    ? operators.find((row) => row.code === selectedOperatorCode)
    : null;

  return (
    <main className="operator-portal-main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--platform-orange)]">
            Record
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Audit log</h1>
          <p className="font-body mt-2 max-w-2xl text-sm text-stone-500">
            A complete trail of onboarding, configuration, credential handovers, and login support
            across every transport on Parcela.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-600 shadow-sm">
          <ScrollText className="size-4 text-[var(--platform-orange)]" />
          <span className="font-display text-xs font-bold uppercase tracking-wide">
            {stats.total} events logged
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total events",
            value: stats.total,
            hint: "All platform actions",
            icon: ScrollText,
            wrap: "bg-stone-100 text-stone-700",
          },
          {
            label: "Last 7 days",
            value: stats.thisWeek,
            hint: "Recent activity",
            icon: Clock3,
            wrap: "bg-sky-100 text-sky-700",
          },
          {
            label: "Onboarding",
            value: stats.onboard,
            hint: "Transports added",
            icon: Plus,
            wrap: "bg-violet-100 text-violet-700",
          },
          {
            label: "Access changes",
            value: stats.access + stats.credentials,
            hint: "Logins & credentials",
            icon: KeyRound,
            wrap: "bg-amber-100 text-amber-700",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {card.label}
                </p>
                <p className="font-display mt-1 text-2xl font-bold text-stone-900">{card.value}</p>
                <p className="font-body mt-0.5 text-xs text-stone-400">{card.hint}</p>
              </div>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  card.wrap,
                )}
              >
                <card.icon className="size-4" strokeWidth={2.25} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <AuditKindFilterBar value={kindFilter} onChange={setKindFilter} stats={stats} className="mt-4" />

      <section className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/70 px-5 py-3.5">
          <h2 className="font-display text-sm font-bold text-stone-900">Event history</h2>
          <p className="font-body mt-0.5 text-xs text-stone-500">
            Sorted newest first · click a row for details
          </p>
        </div>

        <PlatformTableToolbar
          value={query}
          onChange={setQuery}
          placeholder="Search events, transports, or emails…"
          resultCount={filtered.length}
          totalCount={audit.length}
        />

        {filtered.length > 0 ? (
          <div className="space-y-2.5 p-3 xl:hidden">
            {listPagination.pageItems.map((row, index) => {
              const kind = getPlatformAuditKind(row.action);
              const operatorCode = parsePlatformAuditOperator(row.detail);
              const operator = operatorCode
                ? operators.find((item) => item.code === operatorCode)
                : null;
              const relative = formatPlatformWhenRelative(row.at);

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row)}
                  className="w-full rounded-xl border border-stone-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-[var(--platform-orange)]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <AuditKindBadge kind={kind} compact />
                    <span className="font-body shrink-0 text-[10px] text-stone-400">
                      #
                      {platformRowNumber(
                        listPagination.currentPage,
                        listPagination.pageSize,
                        index,
                      )}
                    </span>
                  </div>
                  <p className="font-display mt-2 text-sm font-bold text-stone-900">{row.action}</p>
                  <p className="font-body mt-1 line-clamp-2 text-xs text-stone-600">{row.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
                    <span>{formatPlatformWhen(row.at)}</span>
                    {relative ? <span>· {relative}</span> : null}
                    {operator ? <span>· {operator.name}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="hidden xl:block operator-portal-table-scroll overflow-x-auto">
          <table className="min-w-[920px] w-full text-left">
            <thead>
              <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                <PlatformTableSnHeader />
                <th className="font-display px-4 py-3 font-bold">When</th>
                <th className="font-display px-4 py-3 font-bold">Category</th>
                <th className="font-display px-4 py-3 font-bold">Event</th>
                <th className="font-display px-4 py-3 font-bold">Transport</th>
                <th className="font-display px-4 py-3 font-bold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <ScrollText className="mx-auto size-8 text-stone-300" />
                    <p className="font-display mt-3 text-sm font-bold text-stone-700">
                      No audit entries match
                    </p>
                    <p className="font-body mt-1 text-sm text-stone-500">
                      Try a different category or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                listPagination.pageItems.map((row, index) => {
                  const kind = getPlatformAuditKind(row.action);
                  const operatorCode = parsePlatformAuditOperator(row.detail);
                  const operator = operatorCode
                    ? operators.find((item) => item.code === operatorCode)
                    : null;
                  const relative = formatPlatformWhenRelative(row.at);
                  const config = kind !== "other" ? auditKindConfig(kind) : null;
                  const KindIcon = config?.icon ?? ScrollText;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer border-t border-stone-100 transition-colors hover:bg-[var(--platform-orange-soft)]/50"
                    >
                      <PlatformTableSnCell
                        value={platformRowNumber(
                          listPagination.currentPage,
                          listPagination.pageSize,
                          index,
                        )}
                      />
                      <td className="px-4 py-3.5">
                        <p className="font-body whitespace-nowrap text-xs font-medium text-stone-800">
                          {formatPlatformWhen(row.at)}
                        </p>
                        {relative ? (
                          <p className="font-body mt-0.5 text-[11px] text-stone-400">{relative}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <AuditKindBadge kind={kind} compact />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                              config?.iconWrap ?? "bg-stone-100 text-stone-600",
                            )}
                          >
                            <KindIcon className="size-4" strokeWidth={2.25} />
                          </span>
                          <p className="font-display text-sm font-semibold text-stone-900">
                            {row.action}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {operator ? (
                          <div className="flex items-center gap-2">
                            <PlatformOperatorMark
                              code={operator.code}
                              name={operator.name}
                              brandColor={operator.brandColor}
                              logoDataUrl={operator.logoDataUrl}
                              size="sm"
                            />
                            <span className="font-display text-xs font-bold text-stone-700">
                              {operator.code}
                            </span>
                          </div>
                        ) : (
                          <span className="font-body text-sm text-stone-400">Platform</span>
                        )}
                      </td>
                      <td className="font-body max-w-xs px-4 py-3.5 text-sm text-stone-600">
                        {row.detail}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PlatformTablePagination
          currentPage={listPagination.currentPage}
          totalPages={listPagination.totalPages}
          pageStart={listPagination.pageStart}
          pageEnd={listPagination.pageEnd}
          totalItems={listPagination.totalItems}
          onPageChange={listPagination.setPage}
        />
      </section>

      {selected && selectedKind ? (
        <PlatformModalShell
          onClose={() => setSelected(null)}
          eyebrow="Audit event"
          title={selected.action}
          subtitle={formatPlatformWhen(selected.at)}
          maxWidthClass="max-w-lg"
          leading={
            selectedOperator ? (
              <PlatformOperatorMark
                code={selectedOperator.code}
                name={selectedOperator.name}
                brandColor={selectedOperator.brandColor}
                logoDataUrl={selectedOperator.logoDataUrl}
                size="md"
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Building2 className="size-5 text-white" />
              </span>
            )
          }
          footer={
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-display ml-auto rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-stone-800"
            >
              Close record
            </button>
          }
        >
          <div className="space-y-4">
            <AuditKindBadge kind={selectedKind} />

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <dl className="divide-y divide-stone-100">
                <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Detail
                  </dt>
                  <dd className="max-w-[16rem] text-right font-body text-sm text-stone-800">
                    {selected.detail}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Transport
                  </dt>
                  <dd className="font-display text-sm font-semibold text-stone-900">
                    {selectedOperator?.name ?? selectedOperatorCode ?? "Platform-wide"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Recorded
                  </dt>
                  <dd className="text-right">
                    <p className="font-body text-sm text-stone-800">
                      {formatPlatformWhen(selected.at)}
                    </p>
                    {formatPlatformWhenRelative(selected.at) ? (
                      <p className="font-body mt-0.5 text-xs text-stone-400">
                        {formatPlatformWhenRelative(selected.at)}
                      </p>
                    ) : null}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Event ID
                  </dt>
                  <dd className="font-mono text-xs text-stone-600">{selected.id}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3">
              <p className="font-body text-xs leading-relaxed text-stone-500">
                Audit entries are append-only. They show what Parcela platform staff did — onboarding
                transports, handing over HQ logins, or resetting access when someone is locked out.
              </p>
            </div>
          </div>
        </PlatformModalShell>
      ) : null}
    </main>
  );
}
