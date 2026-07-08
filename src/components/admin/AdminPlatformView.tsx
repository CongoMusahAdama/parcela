"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  Lock,
  LockOpen,
  Mail,
  Save,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { getAdminOperator } from "@/lib/admin-operator";
import { OPERATOR_ACCENT, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import {
  countActiveLocks,
  loadOperatorControls,
  saveOperatorSettings,
  setOperatorLock,
  type OperatorControlAuditEntry,
  type OperatorControlLocks,
  type OperatorControlSettings,
} from "@/lib/operator-controls";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

const LOCK_CARDS: Array<{
  key: keyof OperatorControlLocks;
  title: string;
  description: string;
  impact: string;
}> = [
  {
    key: "bookingsLocked",
    title: "Public bookings",
    description: "Stop new sender bookings on the public site for this operator.",
    impact: "Senders cannot create new parcel bookings until unlocked.",
  },
  {
    key: "staffOpsLocked",
    title: "Staff operations",
    description: "Freeze verify, log, arrive, and release actions at every terminal.",
    impact: "Counter staff can sign in but cannot move parcels.",
  },
  {
    key: "leadOpsLocked",
    title: "Lead operations",
    description: "Freeze branch lead team management across all stations.",
    impact: "Leads cannot create, edit, or deactivate staff until unlocked.",
  },
];

function formatAuditTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminPlatformView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const companyName = operator
    ? OPERATOR_REPORT_BRAND[operator].companyName
    : "Your transport";

  const [locks, setLocks] = useState<OperatorControlLocks | null>(null);
  const [settings, setSettings] = useState<OperatorControlSettings | null>(null);
  const [audit, setAudit] = useState<OperatorControlAuditEntry[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toggling, setToggling] = useState<keyof OperatorControlLocks | null>(null);

  useEffect(() => {
    if (!operator) {
      setLocks(null);
      setSettings(null);
      setAudit([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const payload = await loadOperatorControls();
        if (cancelled) return;
        setLocks({
          bookingsLocked: payload.bookingsLocked,
          staffOpsLocked: payload.staffOpsLocked,
          leadOpsLocked: payload.leadOpsLocked,
        });
        setSettings({
          smsAlertsEnabled: payload.smsAlertsEnabled,
          emailDigestEnabled: payload.emailDigestEnabled,
          requireLeadApprovalForStaff: payload.requireLeadApprovalForStaff,
          maintenanceBanner: payload.maintenanceBanner,
        });
        setAudit(payload.audit ?? []);
      } catch (error) {
        if (!cancelled) {
          void showValidationAlert({
            title: "Unable to load controls",
            text: error instanceof Error ? error.message : "Try again in a moment.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [operator]);

  const activeLocks = locks ? countActiveLocks(locks) : 0;
  const networkStatus = activeLocks === 0 ? "Normal" : activeLocks === 3 ? "Full freeze" : "Partial freeze";

  const statusTone = useMemo(() => {
    if (activeLocks === 0) return "emerald";
    if (activeLocks === 3) return "red";
    return "amber";
  }, [activeLocks]);

  if (!operator) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-xl font-bold text-foreground">Operator controls</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Complete Admin setup first so locks apply only to your transport.
        </p>
        <Link
          href="/admin/setup"
          className="font-display mt-4 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          Go to Admin setup
        </Link>
      </main>
    );
  }

  const toggleLock = async (key: keyof OperatorControlLocks) => {
    if (!locks) return;
    const nextValue = !locks[key];
    const card = LOCK_CARDS.find((c) => c.key === key)!;
    const confirmed = await showConfirmDialog({
      title: nextValue ? `Lock ${card.title.toLowerCase()}?` : `Unlock ${card.title.toLowerCase()}?`,
      text: nextValue
        ? `${card.impact} This applies to all ${operator} branches immediately.`
        : `Restore ${card.title.toLowerCase()} for all ${operator} branches.`,
      confirmText: nextValue ? "Lock now" : "Unlock now",
      cancelText: "Cancel",
      icon: nextValue ? "warning" : "question",
      confirmButtonColor: nextValue ? "#dc2626" : OPERATOR_ACCENT[operator],
    });
    if (!confirmed) return;

    setToggling(key);
    try {
      const updated = await setOperatorLock(operator, key, nextValue, admin.displayName);
      setLocks(updated);
      const refreshed = await loadOperatorControls();
      setAudit(refreshed.audit ?? []);
      await showSuccessAlert({
        title: nextValue ? "Locked" : "Unlocked",
        text: nextValue
          ? `${card.title} are now frozen across ${companyName}.`
          : `${card.title} are active again across ${companyName}.`,
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to update lock",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setToggling(null);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const saved = await saveOperatorSettings(operator, settings, admin.displayName);
      setSettings({
        smsAlertsEnabled: saved.smsAlertsEnabled,
        emailDigestEnabled: saved.emailDigestEnabled,
        requireLeadApprovalForStaff: saved.requireLeadApprovalForStaff,
        maintenanceBanner: saved.maintenanceBanner,
      });
      setAudit(saved.audit ?? []);
      await showSuccessAlert({
        title: "Settings saved",
        text: `Operator controls for ${companyName} were updated.`,
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to save settings",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (!locks || !settings) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <p className="font-body text-sm text-muted">Loading operator controls…</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Operator controls
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              Emergency locks and network-wide settings for {companyName}. Use only when HQ needs to
              freeze or restore operations quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/people"
              className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
            >
              <Users className="size-4" />
              Roles directory
            </Link>
            <Link
              href="/admin/branches"
              className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              <Building2 className="size-4" />
              All stations
            </Link>
          </div>
        </div>

        {activeLocks > 0 && (
          <div
            className={cn(
              "mt-5 flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3",
              statusTone === "red"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                statusTone === "red" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800",
              )}
            >
              <ShieldAlert className="size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-display text-sm font-bold",
                  statusTone === "red" ? "text-red-900" : "text-amber-900",
                )}
              >
                {networkStatus} — {activeLocks} lock{activeLocks === 1 ? "" : "s"} active
              </p>
              <p
                className={cn(
                  "font-body text-[11px]",
                  statusTone === "red" ? "text-red-800/80" : "text-amber-800/80",
                )}
              >
                Review the emergency locks below. Unlock only when it is safe to resume operations.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Network status",
              value: networkStatus,
              icon: Shield,
              tone: statusTone,
            },
            {
              label: "Active locks",
              value: String(activeLocks),
              icon: Lock,
              tone: activeLocks > 0 ? "amber" : "emerald",
            },
            {
              label: "SMS alerts",
              value: settings.smsAlertsEnabled ? "On" : "Off",
              icon: Bell,
              tone: settings.smsAlertsEnabled ? "emerald" : "slate",
            },
            {
              label: "Email digest",
              value: settings.emailDigestEnabled ? "On" : "Off",
              icon: Mail,
              tone: settings.emailDigestEnabled ? "emerald" : "slate",
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    tone === "red" && "bg-red-100 text-red-700",
                    tone === "amber" && "bg-amber-100 text-amber-800",
                    tone === "emerald" && "bg-emerald-100 text-emerald-700",
                    tone === "slate" && "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-none text-foreground">
                    {value}
                  </p>
                  <p className="font-body mt-1 text-[11px] leading-tight text-muted">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  Emergency locks
                </h2>
                <p className="font-body mt-1 text-xs text-muted">
                  Freeze part of the network without deactivating individual accounts. Each lock is
                  logged in the audit trail.
                </p>
              </div>
              <ul className="divide-y divide-border">
                {LOCK_CARDS.map((card) => {
                  const locked = locks[card.key];
                  return (
                    <li
                      key={card.key}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-sm font-bold text-foreground">
                            {card.title}
                          </p>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                              locked
                                ? "bg-red-50 text-red-700 ring-red-200"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-200",
                            )}
                          >
                            {locked ? "Locked" : "Active"}
                          </span>
                        </div>
                        <p className="font-body mt-1 text-sm text-muted">{card.description}</p>
                        <p className="font-body mt-2 text-[11px] text-muted">{card.impact}</p>
                      </div>
                      <button
                        type="button"
                        disabled={toggling === card.key}
                        onClick={() => void toggleLock(card.key)}
                        className={cn(
                          "font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60",
                          locked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700",
                        )}
                      >
                        {locked ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                        {toggling === card.key
                          ? "Updating…"
                          : locked
                            ? "Unlock"
                            : "Lock now"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  Network settings
                </h2>
                <p className="font-body mt-1 text-xs text-muted">
                  Operator-wide preferences. Individual account deactivation stays on Roles
                  directory.
                </p>
              </div>
              <div className="space-y-4 px-4 py-4 sm:px-5">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={settings.smsAlertsEnabled}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, smsAlertsEnabled: e.target.checked } : s))
                    }
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span>
                    <span className="font-display block text-xs font-bold uppercase tracking-wide text-foreground">
                      SMS alerts
                    </span>
                    <span className="font-body mt-0.5 block text-[11px] text-muted">
                      Send operational SMS for delays, unlocks, and emergency freezes.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={settings.emailDigestEnabled}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, emailDigestEnabled: e.target.checked } : s))
                    }
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span>
                    <span className="font-display block text-xs font-bold uppercase tracking-wide text-foreground">
                      Daily email digest
                    </span>
                    <span className="font-body mt-0.5 block text-[11px] text-muted">
                      Morning summary of network volume, delays, and unassigned leads.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={settings.requireLeadApprovalForStaff}
                    onChange={(e) =>
                      setSettings((s) =>
                        s ? { ...s, requireLeadApprovalForStaff: e.target.checked } : s,
                      )
                    }
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span>
                    <span className="font-display block text-xs font-bold uppercase tracking-wide text-foreground">
                      Lead approval for new staff
                    </span>
                    <span className="font-body mt-0.5 block text-[11px] text-muted">
                      Branch leads must confirm before a new counter staff account goes live.
                    </span>
                  </span>
                </label>

                <div>
                  <label
                    htmlFor="maintenance-banner"
                    className="font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Maintenance banner{" "}
                    <span className="normal-case tracking-normal text-muted/70">(optional)</span>
                  </label>
                  <textarea
                    id="maintenance-banner"
                    rows={3}
                    value={settings.maintenanceBanner}
                    onChange={(e) =>
                      setSettings((s) => (s ? { ...s, maintenanceBanner: e.target.value } : s))
                    }
                    placeholder="e.g. Scheduled maintenance tonight 11pm–1am. Expect brief delays."
                    className="font-body w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-[var(--staff-accent)]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveSettings()}
                    disabled={savingSettings}
                    className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    <Save className="size-3.5" />
                    {savingSettings ? "Saving…" : "Save settings"}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  When to use locks
                </h3>
              </div>
              <ul className="font-body mt-3 space-y-2 text-sm text-muted">
                <li>Suspected fraud or compromised staff accounts</li>
                <li>Major outage while HQ investigates</li>
                <li>Operator-wide policy freeze before a rollout</li>
              </ul>
              <p className="font-body mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-muted">
                To deactivate one person only, open{" "}
                <Link href="/admin/people" className="font-semibold text-foreground underline">
                  Roles directory
                </Link>{" "}
                instead of locking the whole network.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-surface shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Audit trail
                </h3>
                <p className="font-body mt-1 text-[11px] text-muted">
                  Recent control actions for {operator}.
                </p>
              </div>
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {audit.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-muted">No actions yet.</li>
                ) : (
                  audit.map((entry) => (
                    <li key={entry.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-sm font-semibold text-foreground">
                          {entry.action}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            entry.severity === "critical"
                              ? "bg-red-50 text-red-700 ring-red-200"
                              : entry.severity === "warning"
                                ? "bg-amber-50 text-amber-800 ring-amber-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200",
                          )}
                        >
                          {entry.severity}
                        </span>
                      </div>
                      <p className="font-body mt-1 text-[11px] text-muted">{entry.detail}</p>
                      <p className="font-body mt-1.5 text-[10px] text-muted">
                        {entry.actor} · {formatAuditTime(entry.at)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
