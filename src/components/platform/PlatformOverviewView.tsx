"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  LogOut,
  MapPin,
  Plus,
  ScrollText,
  UserCog,
  Users,
  KeyRound,
  Edit2,
  Shield,
  Phone,
  Mail,
  Building,
  Check,
  Save,
} from "lucide-react";
import { PlatformModalShell } from "@/components/platform/PlatformModalShell";
import {
  PlatformSubscriptionCountdown,
  PlatformSubscriptionReminderPills,
} from "@/components/platform/PlatformSubscriptionCountdown";
import {
  PlatformUserRoleTabs,
  USER_TABLE_COLSPAN,
  platformUserRoleColumnLabel,
  platformUserRoleTabMeta,
} from "@/components/platform/PlatformUserRoleColumns";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import { PlatformActivityDonutChart } from "@/components/platform/PlatformActivityDonutChart";
import {
  PlatformTablePagination,
  PlatformTableSnCell,
  PlatformTableSnHeader,
} from "@/components/platform/PlatformTablePagination";
import { PlatformTableToolbar } from "@/components/platform/PlatformTableToolbar";
import { usePlatformSession } from "@/components/platform/PlatformShell";
import { StaffLiveClock } from "@/components/staff/StaffLiveClock";
import {
  formatPlatformWhen,
  getPlatformAuditKind,
  getOperatorSubscriptionSnapshot,
  getPlatformSubscriptionStats,
  getPlatformSupportQueue,
  operatorStatusLabel,
  platformSubscriptionPlanLabel,
  platformAuditKindLabel,
  platformSupportKindLabel,
  SUBSCRIPTION_REMINDER_DAYS,
  type PlatformAuditRow,
  type PlatformRenewalReminder,
  platformUserRoleLabel,
  platformUserStatusLabel,
  type PlatformHqAdminRow,
  type PlatformOperatorRow,
  type PlatformOperatorStatus,
  type PlatformSupportKind,
  type PlatformUserRole,
  type PlatformUserRow,
  type PlatformUserStatus,
} from "@/lib/platform-demo";
import { platformCredentialSuccessText } from "@/lib/platform-credentials-message";
import { revokeAllPlatformSessionsApi } from "@/lib/platform-api";
import { signOutPlatform } from "@/lib/platform-auth";
import { platformRowNumber, usePlatformPagination } from "@/lib/platform-pagination";
import { PLATFORM_THEME } from "@/lib/platform-theme";
import { cn } from "@/lib/utils";
import { showConfirmDialog, showSuccessAlert } from "@/lib/sweetalert";

function operatorStatusTone(status: PlatformOperatorStatus) {
  if (status === "configured") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "configure") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (status === "suspended") return "bg-red-50 text-red-800 ring-red-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

function hqStatusTone(status: PlatformHqAdminRow["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-800";
  if (status === "pending_setup") return "bg-amber-50 text-amber-900";
  return "bg-stone-100 text-stone-600";
}

function hqStatusLabel(status: PlatformHqAdminRow["status"]) {
  if (status === "active") return "Active";
  if (status === "pending_setup") return "Setup pending";
  return "Inactive";
}

function supportKindTone(kind: PlatformSupportKind) {
  if (kind === "locked_user") return "bg-red-50 text-red-800 ring-red-200";
  if (kind === "configure_operator") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (kind === "pending_hq") return "bg-orange-50 text-orange-900 ring-orange-200";
  if (kind === "subscription_renewal") return "bg-violet-50 text-violet-900 ring-violet-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

function OperatorRow({ row, serialNumber }: { row: PlatformOperatorRow; serialNumber: number }) {
  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50/80">
      <PlatformTableSnCell value={serialNumber} />
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <PlatformOperatorMark
            code={row.code}
            name={row.name}
            brandColor={row.brandColor}
            logoDataUrl={row.logoDataUrl}
          />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-stone-900">{row.name}</p>
            <p className="font-mono text-[11px] text-stone-500">{row.code}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
            operatorStatusTone(row.status),
          )}
        >
          {operatorStatusLabel(row.status)}
        </span>
      </td>
      <td className="font-body px-4 py-3.5 text-sm text-stone-700">{row.stationCount}</td>
      <td className="font-body px-4 py-3.5 text-sm text-stone-700">{row.hqAdminCount}</td>
      <td className="font-body px-4 py-3.5 text-sm text-stone-500">
        {row.primaryAdminEmail ?? "—"}
      </td>
      <td className="font-body px-4 py-3.5 text-xs text-stone-500">
        {formatPlatformWhen(row.updatedAt)}
      </td>
      <td className="px-4 py-3.5 text-right">
        <Link
          href="/platform/operators"
          className="font-display inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)] hover:bg-[var(--platform-orange-soft)]"
        >
          Open
          <ArrowRight className="size-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export function PlatformOverviewView() {
  const router = useRouter();
  const { admin } = usePlatformSession();
  const { operators, hqAdmins, users, audit, stats, sendRenewalReminder, loading } =
    usePlatformData();
  const subscriptionStats = getPlatformSubscriptionStats(operators);
  const firstName = admin.displayName.split(" ")[0] || "there";
  const attention = operators.filter((o) => o.status === "configure" || o.status === "draft");
  const subscriptionAlerts = useMemo(
    () =>
      operators
        .map((operator) => ({
          operator,
          snapshot: getOperatorSubscriptionSnapshot(operator),
        }))
        .filter(
          ({ snapshot }) =>
            snapshot.status === "expiring" ||
            snapshot.status === "expired" ||
            snapshot.dueReminder !== null,
        )
        .sort(
          (a, b) => (a.snapshot.daysRemaining ?? 999) - (b.snapshot.daysRemaining ?? 999),
        ),
    [operators],
  );

  async function handleSendRenewalReminder(operatorId: string, reminder: PlatformRenewalReminder) {
    const result = await sendRenewalReminder(operatorId, reminder);
    await showSuccessAlert({
      title: result.renewalSmsSent ? "Renewal reminder sent" : "Renewal reminder queued",
      text: result.renewalSmsSent
        ? `${SUBSCRIPTION_REMINDER_DAYS[reminder]}-day countdown SMS sent to the transport billing contact.`
        : `${SUBSCRIPTION_REMINDER_DAYS[reminder]}-day reminder recorded, but SMS could not be sent — check the operator contact phone.`,
      confirmButtonColor: "#1e3a5f",
    });
  }

  async function handleRevokeAllSessions() {
    const confirmed = await showConfirmDialog({
      title: "Sign out everyone?",
      text: "This immediately signs out all HQ, lead, staff, and platform users. Everyone must sign in again.",
      confirmText: "Sign out all",
      cancelText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmed) return;

    await revokeAllPlatformSessionsApi();
    await signOutPlatform();
    await showSuccessAlert({
      title: "Everyone signed out",
      text: "All portal sessions were ended. Sign in again to continue.",
      confirmButtonColor: "#1e3a5f",
    });
    router.replace("/platform/login");
  }

  const metricCards = [
    {
      label: "Configured",
      value: stats.operatorsConfigured,
      hint: `${stats.operatorsTotal} operators`,
      icon: Building2,
    },
    {
      label: "HQ admins",
      value: stats.hqAdminsActive,
      hint: `${stats.hqAdminsPending} pending setup`,
      icon: UserCog,
    },
    {
      label: "Configure",
      value: stats.operatorsConfigure,
      hint: "Needs your action",
      icon: AlertCircle,
    },
    {
      label: "Stations",
      value: stats.stationsSeeded,
      hint: "Across all operators",
      icon: MapPin,
    },
    {
      label: "Paid licences",
      value: subscriptionStats.active + subscriptionStats.expiring,
      hint: `${subscriptionStats.expiring} renewing soon`,
      icon: CreditCard,
    },
    {
      label: "Portal users",
      value: stats.usersActive,
      hint: `${stats.usersTotal} total logins`,
      icon: Users,
    },
  ] as const;

  return (
    <main className="operator-portal-main flex min-h-0 flex-1 flex-col overflow-hidden">
      <section
        className="relative shrink-0 overflow-hidden rounded-2xl px-4 py-4 text-white shadow-md sm:px-5 sm:py-4"
        style={{ background: PLATFORM_THEME.headerGradient }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-14 size-40 rounded-full bg-white/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 size-32 rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
              Platform control
            </p>
            <h1 className="font-display mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Welcome back, {firstName}
            </h1>
            <p className="font-body mt-1.5 max-w-lg text-xs leading-snug text-white/85 sm:text-sm">
              Onboard transport services, configure them, and hand over HQ logins.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/platform/operators"
                className="font-display inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)] shadow-sm"
              >
                <Plus className="size-3.5" />
                Onboard transport
              </Link>
              <Link
                href="/platform/hq-admins"
                className="font-display inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white"
              >
                Manage HQ admins
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 flex-row gap-2 sm:gap-3">
            <div
              className={cn(
                "rounded-xl border px-3 py-2 sm:min-w-[120px]",
                subscriptionStats.remindersDue > 0
                  ? "border-amber-200/60 bg-amber-500/30"
                  : "border-white/25 bg-white/15",
              )}
            >
              <p className="font-display text-2xl font-bold leading-none tracking-tight text-white">
                {subscriptionStats.remindersDue}
              </p>
              <p className="font-display mt-1 text-[9px] font-bold uppercase tracking-wide text-white/80">
                Reminders due
              </p>
            </div>

            <div className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-left sm:min-w-[120px] sm:text-right">
              <div className="[&_p]:!mt-0 [&_p]:!text-2xl [&_p]:!font-bold [&_p]:!text-white [&_p]:!tracking-tight">
                <StaffLiveClock compact timeFirst showDate={false} />
              </div>
              <p className="font-display mt-1 text-[9px] font-bold uppercase tracking-wide text-white/80">
                Accra time
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[var(--platform-canvas)] pt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
        {metricCards.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display truncate text-[9px] font-bold uppercase tracking-wide text-stone-500">
                  {label}
                </p>
                <p className="font-display mt-0.5 text-xl font-bold text-stone-900">{value}</p>
                <p className="font-body mt-0.5 truncate text-[10px] leading-tight text-stone-500">
                  {hint}
                </p>
              </div>
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "var(--platform-orange-soft)",
                  color: "var(--platform-orange)",
                }}
              >
                <Icon className="size-3.5" strokeWidth={2.25} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.65fr)]">
        {/* ── Tabbed tables ── */}
        <OverviewTabPanel
          supportQueue={getPlatformSupportQueue(operators)}
          operators={operators}
          hqAdmins={hqAdmins}
          users={users}
          audit={audit}
          onSendRenewalReminder={handleSendRenewalReminder}
        />

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-stone-900">Annual subscriptions</h2>
              <CreditCard className="size-4 text-[var(--platform-orange)]" />
            </div>
            <p className="font-body mt-1 text-xs text-stone-500">
              Track who paid for the year and send 30 / 14 / 7 / 1-day renewal countdowns.
            </p>
            {subscriptionAlerts.length === 0 ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <p className="font-body text-sm">All paid licences are current. No reminders due.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {subscriptionAlerts.map(({ operator, snapshot }) => (
                  <li
                    key={operator.id}
                    className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <PlatformOperatorMark
                        code={operator.code}
                        name={operator.name}
                        brandColor={operator.brandColor}
                        logoDataUrl={operator.logoDataUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold text-stone-900">{operator.name}</p>
                        <PlatformSubscriptionCountdown snapshot={snapshot} compact showProgress={false} />
                        <div className="mt-2">
                          <PlatformSubscriptionReminderPills
                            sent={operator.renewalRemindersSent}
                            due={snapshot.dueReminder}
                          />
                        </div>
                        {snapshot.dueReminder ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleSendRenewalReminder(operator.id, snapshot.dueReminder!)
                            }
                            className="font-display mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)] hover:underline"
                          >
                            Send {SUBSCRIPTION_REMINDER_DAYS[snapshot.dueReminder]}-day reminder
                            <ArrowRight className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-stone-900">Needs attention</h2>
              <AlertCircle className="size-4 text-amber-600" />
            </div>
            {attention.length === 0 ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <p className="font-body text-sm">All operators are configured.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {attention.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-3"
                  >
                    <p className="font-display text-sm font-semibold text-stone-900">{row.name}</p>
                    <p className="font-body mt-0.5 text-xs text-stone-600">
                      {row.primaryAdminEmail
                        ? `Finish configuration, then issue HQ logins to ${row.primaryAdminEmail}`
                        : "No HQ admin assigned yet"}
                    </p>
                    <Link
                      href="/platform/operators"
                      className="font-display mt-2 inline-flex text-[10px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
                    >
                      Configure →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-stone-900">Quick actions</h2>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                href="/platform/operators"
                className="font-display flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-[var(--platform-orange)]/40 hover:bg-[var(--platform-orange-soft)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ background: "var(--platform-orange-soft)", color: "var(--platform-orange)" }}
                >
                  <Building2 className="size-4" />
                </span>
                Onboard transport service
              </Link>
              <Link
                href="/platform/hq-admins"
                className="font-display flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-[var(--platform-orange)]/40 hover:bg-[var(--platform-orange-soft)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ background: "var(--platform-orange-soft)", color: "var(--platform-orange)" }}
                >
                  <UserCog className="size-4" />
                </span>
                Create HQ admin
              </Link>
              <Link
                href="/platform/users"
                className="font-display flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-[var(--platform-orange)]/40 hover:bg-[var(--platform-orange-soft)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ background: "var(--platform-orange-soft)", color: "var(--platform-orange)" }}
                >
                  <Users className="size-4" />
                </span>
                Manage user accounts
              </Link>
              <Link
                href="/platform/audit"
                className="font-display flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-[var(--platform-orange)]/40 hover:bg-[var(--platform-orange-soft)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ background: "var(--platform-orange-soft)", color: "var(--platform-orange)" }}
                >
                  <ScrollText className="size-4" />
                </span>
                Open audit log
              </Link>
              <button
                type="button"
                onClick={() => void handleRevokeAllSessions()}
                className="font-display flex w-full items-center gap-3 rounded-xl border border-red-200 px-3 py-3 text-left text-sm font-semibold text-red-800 transition-colors hover:bg-red-50"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <LogOut className="size-4" />
                </span>
                Sign out all users now
              </button>
            </div>
          </section>
        </div>
      </div>
      </div>
    </main>
  );
}
// ── OverviewTabPanel ──────────────────────────────────────────────────────────

type OverviewTab = "transports" | "subscriptions" | "support" | "hq-admins" | "users" | "activity";

const OVERVIEW_TABS: { id: OverviewTab; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "transports", label: "Transports" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "support", label: "Support" },
  { id: "hq-admins", label: "HQ Admins" },
  { id: "users", label: "Users" },
];

function OverviewTabPanel({
  supportQueue,
  operators,
  hqAdmins,
  users,
  audit,
  onSendRenewalReminder,
}: {
  supportQueue: ReturnType<typeof getPlatformSupportQueue>;
  operators: PlatformOperatorRow[];
  hqAdmins: PlatformHqAdminRow[];
  users: PlatformUserRow[];
  audit: PlatformAuditRow[];
  onSendRenewalReminder: (operatorId: string, reminder: PlatformRenewalReminder) => void;
}) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("activity");
  const [tableQuery, setTableQuery] = useState("");

  useEffect(() => {
    setTableQuery("");
  }, [activeTab]);

  const filteredTransports = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.region.toLowerCase().includes(q) ||
        operatorStatusLabel(row.status).toLowerCase().includes(q) ||
        (row.primaryAdminEmail?.toLowerCase().includes(q) ?? false),
    );
  }, [operators, tableQuery]);

  const filteredSubscriptions = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((row) => {
      const snapshot = getOperatorSubscriptionSnapshot(row);
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        platformSubscriptionPlanLabel(row.subscriptionPlan).toLowerCase().includes(q) ||
        snapshot.expiresLabel.toLowerCase().includes(q)
      );
    });
  }, [operators, tableQuery]);

  const filteredSupport = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return supportQueue;
    return supportQueue.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.operatorCode.toLowerCase().includes(q) ||
        platformSupportKindLabel(item.kind).toLowerCase().includes(q),
    );
  }, [supportQueue, tableQuery]);

  const filteredHqAdmins = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return hqAdmins;
    return hqAdmins.filter(
      (person) =>
        person.displayName.toLowerCase().includes(q) ||
        person.email.toLowerCase().includes(q) ||
        person.operatorCode.toLowerCase().includes(q) ||
        hqStatusLabel(person.status).toLowerCase().includes(q),
    );
  }, [hqAdmins, tableQuery]);

  const filteredActivity = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return audit;
    return audit.filter(
      (entry) =>
        entry.action.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q) ||
        platformAuditKindLabel(getPlatformAuditKind(entry.action)).toLowerCase().includes(q),
    );
  }, [audit, tableQuery]);

  const transportsPagination = usePlatformPagination(filteredTransports, 6, `${activeTab}-transports|${tableQuery}`);
  const subscriptionsPagination = usePlatformPagination(filteredSubscriptions, 6, `${activeTab}-subscriptions|${tableQuery}`);
  const supportPagination = usePlatformPagination(filteredSupport, 6, `${activeTab}-support|${tableQuery}`);
  const hqPagination = usePlatformPagination(filteredHqAdmins, 6, `${activeTab}-hq|${tableQuery}`);

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="operator-portal-tabs flex items-center gap-1 border-b border-stone-100 bg-stone-50/60 px-4 py-3">
        {OVERVIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "font-display shrink-0 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all",
              activeTab === tab.id
                ? "text-white shadow-md"
                : "text-stone-500 hover:bg-[var(--platform-orange-soft)] hover:text-[var(--platform-orange-dark)]",
            )}
            style={
              activeTab === tab.id
                ? { background: "var(--platform-orange)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Transports tab ── */}
      {activeTab === "transports" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">Transports</h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">Services you onboard and configure on Parcela</p>
            </div>
            <Link
              href="/platform/operators"
              className="font-display inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <PlatformTableToolbar
            value={tableQuery}
            onChange={setTableQuery}
            placeholder="Search transports, codes, region, or HQ email…"
            resultCount={filteredTransports.length}
            totalCount={operators.length}
          />
          <div className="operator-portal-table-scroll overflow-x-auto">
            <table className="min-w-[720px] w-full text-left">
              <thead>
                <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                  <PlatformTableSnHeader />
                  <th className="font-display px-4 py-3 font-bold">Operator</th>
                  <th className="font-display px-4 py-3 font-bold">Status</th>
                  <th className="font-display px-4 py-3 font-bold">Stations</th>
                  <th className="font-display px-4 py-3 font-bold">HQ admins</th>
                  <th className="font-display px-4 py-3 font-bold">Primary HQ</th>
                  <th className="font-display px-4 py-3 font-bold">Updated</th>
                  <th className="font-display px-4 py-3 font-bold" />
                </tr>
              </thead>
              <tbody>
                {filteredTransports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <p className="font-body text-sm text-stone-500">No transports match your search.</p>
                    </td>
                  </tr>
                ) : (
                  transportsPagination.pageItems.map((row, index) => (
                    <OperatorRow
                      key={row.id}
                      row={row}
                      serialNumber={platformRowNumber(
                        transportsPagination.currentPage,
                        transportsPagination.pageSize,
                        index,
                      )}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredTransports.length > 0 ? (
          <PlatformTablePagination
            currentPage={transportsPagination.currentPage}
            totalPages={transportsPagination.totalPages}
            pageStart={transportsPagination.pageStart}
            pageEnd={transportsPagination.pageEnd}
            totalItems={transportsPagination.totalItems}
            onPageChange={transportsPagination.setPage}
          />
          ) : null}
        </>
      )}

      {/* ── Subscriptions tab ── */}
      {activeTab === "subscriptions" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">Annual subscriptions</h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">
                Who paid for Parcela this year, when it expires, and which countdown emails are due
              </p>
            </div>
          </div>
          <PlatformTableToolbar
            value={tableQuery}
            onChange={setTableQuery}
            placeholder="Search transport, plan, or expiry…"
            resultCount={filteredSubscriptions.length}
            totalCount={operators.length}
          />
          <div className="operator-portal-table-scroll overflow-x-auto">
            <table className="min-w-[960px] w-full text-left">
              <thead>
                <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                  <PlatformTableSnHeader />
                  <th className="font-display px-4 py-3 font-bold">Transport</th>
                  <th className="font-display px-4 py-3 font-bold">Plan</th>
                  <th className="font-display px-4 py-3 font-bold">Paid</th>
                  <th className="font-display px-4 py-3 font-bold">Expires</th>
                  <th className="font-display px-4 py-3 font-bold">Countdown</th>
                  <th className="font-display px-4 py-3 font-bold">Reminders</th>
                  <th className="font-display px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <p className="font-body text-sm text-stone-500">No subscriptions match your search.</p>
                    </td>
                  </tr>
                ) : (
                subscriptionsPagination.pageItems.map((row, index) => {
                  const snapshot = getOperatorSubscriptionSnapshot(row);
                  return (
                    <tr key={row.id} className="border-t border-stone-100 hover:bg-stone-50/80">
                      <PlatformTableSnCell
                        value={platformRowNumber(
                          subscriptionsPagination.currentPage,
                          subscriptionsPagination.pageSize,
                          index,
                        )}
                      />
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <PlatformOperatorMark
                            code={row.code}
                            name={row.name}
                            brandColor={row.brandColor}
                            logoDataUrl={row.logoDataUrl}
                            size="sm"
                          />
                          <div>
                            <p className="font-display text-sm font-bold text-stone-900">{row.name}</p>
                            <p className="font-mono text-[11px] text-stone-500">{row.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-body px-4 py-3.5 text-sm text-stone-700">
                        {platformSubscriptionPlanLabel(row.subscriptionPlan)}
                        {row.subscriptionAmountGhs ? (
                          <p className="font-mono text-[11px] text-stone-500">
                            GHS {row.subscriptionAmountGhs.toLocaleString()}
                          </p>
                        ) : null}
                      </td>
                      <td className="font-body px-4 py-3.5 text-xs text-stone-500">{snapshot.paidLabel}</td>
                      <td className="font-body px-4 py-3.5 text-xs text-stone-500">{snapshot.expiresLabel}</td>
                      <td className="px-4 py-3.5">
                        <PlatformSubscriptionCountdown
                          snapshot={snapshot}
                          compact
                          showProgress={snapshot.status !== "unpaid"}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <PlatformSubscriptionReminderPills
                          sent={row.renewalRemindersSent}
                          due={snapshot.dueReminder}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        {snapshot.dueReminder ? (
                          <button
                            type="button"
                            onClick={() => onSendRenewalReminder(row.id, snapshot.dueReminder!)}
                            className="font-display inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
                          >
                            <Mail className="size-3" />
                            Send reminder
                          </button>
                        ) : snapshot.status === "unpaid" ? (
                          <span className="font-body text-xs text-stone-400">Awaiting payment</span>
                        ) : (
                          <span className="font-body text-xs text-emerald-700">Up to date</span>
                        )}
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
          {filteredSubscriptions.length > 0 ? (
          <PlatformTablePagination
            currentPage={subscriptionsPagination.currentPage}
            totalPages={subscriptionsPagination.totalPages}
            pageStart={subscriptionsPagination.pageStart}
            pageEnd={subscriptionsPagination.pageEnd}
            totalItems={subscriptionsPagination.totalItems}
            onPageChange={subscriptionsPagination.setPage}
          />
          ) : null}
        </>
      )}

      {/* ── Support tab ── */}
      {activeTab === "support" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">Support queue</h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">
                Locked logins, pending setups, and operators that need your action
              </p>
            </div>
            <Link
              href="/platform/users"
              className="font-display inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
            >
              Open users <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <PlatformTableToolbar
            value={tableQuery}
            onChange={setTableQuery}
            placeholder="Search support items, transport, or type…"
            resultCount={filteredSupport.length}
            totalCount={supportQueue.length}
          />
          <div className="operator-portal-table-scroll overflow-x-auto">
            {filteredSupport.length === 0 ? (
              <div className="flex items-start gap-2 px-5 pb-6 pt-2">
                <div className="flex w-full items-start gap-2 rounded-xl bg-stone-50 px-4 py-4 text-stone-600">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <p className="font-body text-sm">
                    {supportQueue.length === 0
                      ? "Nothing needs attention right now."
                      : "No support items match your search."}
                  </p>
                </div>
              </div>
            ) : (
              <table className="min-w-[640px] w-full text-left">
                <thead>
                  <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                    <PlatformTableSnHeader />
                    <th className="font-display px-4 py-3 font-bold">Type</th>
                    <th className="font-display px-4 py-3 font-bold">Subject</th>
                    <th className="font-display px-4 py-3 font-bold">Transport</th>
                    <th className="font-display px-4 py-3 font-bold">Detail</th>
                    <th className="font-display px-4 py-3 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {supportPagination.pageItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50/80">
                      <PlatformTableSnCell
                        value={platformRowNumber(
                          supportPagination.currentPage,
                          supportPagination.pageSize,
                          index,
                        )}
                      />
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            supportKindTone(item.kind),
                          )}
                        >
                          {platformSupportKindLabel(item.kind)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-display text-sm font-semibold text-stone-900">{item.title}</p>
                      </td>
                      <td className="font-display px-4 py-3.5 text-sm font-semibold text-stone-800">
                        {item.operatorCode}
                      </td>
                      <td className="font-body max-w-xs px-4 py-3.5 text-sm text-stone-600">
                        {item.subtitle}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={item.href}
                          className="font-display inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)] hover:bg-[var(--platform-orange-soft)]"
                        >
                          {item.actionLabel}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {filteredSupport.length > 0 ? (
            <PlatformTablePagination
              currentPage={supportPagination.currentPage}
              totalPages={supportPagination.totalPages}
              pageStart={supportPagination.pageStart}
              pageEnd={supportPagination.pageEnd}
              totalItems={supportPagination.totalItems}
              onPageChange={supportPagination.setPage}
            />
          ) : null}
        </>
      )}

      {/* ── HQ Admins tab ── */}
      {activeTab === "hq-admins" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">HQ Admins</h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">People who run operator headquarters</p>
            </div>
            <Link
              href="/platform/hq-admins"
              className="font-display inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
            >
              Manage <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <PlatformTableToolbar
            value={tableQuery}
            onChange={setTableQuery}
            placeholder="Search HQ name, email, or transport…"
            resultCount={filteredHqAdmins.length}
            totalCount={hqAdmins.length}
          />
          <div className="operator-portal-table-scroll overflow-x-auto">
            <table className="min-w-[520px] w-full text-left">
              <thead>
                <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                  <PlatformTableSnHeader />
                  <th className="font-display px-4 py-3 font-bold">HQ admin</th>
                  <th className="font-display px-4 py-3 font-bold">Transport</th>
                  <th className="font-display px-4 py-3 font-bold">Status</th>
                  <th className="font-display px-4 py-3 font-bold">Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {filteredHqAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <p className="font-body text-sm text-stone-500">No HQ admins match your search.</p>
                    </td>
                  </tr>
                ) : (
                hqPagination.pageItems.map((person, index) => (
                  <tr key={person.id} className="border-t border-stone-100 hover:bg-stone-50/80">
                    <PlatformTableSnCell
                      value={platformRowNumber(
                        hqPagination.currentPage,
                        hqPagination.pageSize,
                        index,
                      )}
                    />
                    <td className="px-4 py-3.5">
                      <p className="font-display text-sm font-semibold text-stone-900">{person.displayName}</p>
                      <p className="font-mono truncate text-[11px] text-stone-500">{person.email}</p>
                    </td>
                    <td className="font-display px-4 py-3.5 text-sm font-semibold text-stone-800">{person.operatorCode}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", hqStatusTone(person.status))}>
                        {hqStatusLabel(person.status)}
                      </span>
                    </td>
                    <td className="font-body px-4 py-3.5 text-xs text-stone-500">{formatPlatformWhen(person.lastSignInAt)}</td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
          {filteredHqAdmins.length > 0 ? (
          <PlatformTablePagination
            currentPage={hqPagination.currentPage}
            totalPages={hqPagination.totalPages}
            pageStart={hqPagination.pageStart}
            pageEnd={hqPagination.pageEnd}
            totalItems={hqPagination.totalItems}
            onPageChange={hqPagination.setPage}
          />
          ) : null}
        </>
      )}

      {/* ── Users tab ── */}
      {activeTab === "users" && (
        <PlatformUsersSection
          users={users}
          tableQuery={tableQuery}
          onTableQueryChange={setTableQuery}
        />
      )}

      {/* ── Activity tab ── */}
      {activeTab === "activity" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">Platform activity</h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">
                Breakdown of onboarding, configuration, credentials, and access events
              </p>
            </div>
            <Link
              href="/platform/audit"
              className="font-display inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
            >
              Full audit log <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <PlatformTableToolbar
            value={tableQuery}
            onChange={setTableQuery}
            placeholder="Filter activity by action, detail, or category…"
            resultCount={filteredActivity.length}
            totalCount={audit.length}
          />
          <PlatformActivityDonutChart rows={filteredActivity} />
        </>
      )}
    </section>
  );
}


function PlatformUsersSection({
  users,
  tableQuery: externalQuery,
  onTableQueryChange,
}: {
  users: PlatformUserRow[];
  tableQuery?: string;
  onTableQueryChange?: (value: string) => void;
} = { users: [] }) {
  const { updateUser, resetUserLogin } = usePlatformData();
  const [internalQuery, setInternalQuery] = useState("");
  const query = externalQuery ?? internalQuery;
  const setQuery = onTableQueryChange ?? setInternalQuery;
  const [activeRoleTab, setActiveRoleTab] = useState<PlatformUserRole>("hq_admin");
  const [selectedUser, setSelectedUser] = useState<PlatformUserRow | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<PlatformUserStatus>("active");

  const roleCounts = useMemo(
    () => ({
      hq_admin: users.filter((u) => u.role === "hq_admin").length,
      branch_lead: users.filter((u) => u.role === "branch_lead").length,
      counter_staff: users.filter((u) => u.role === "counter_staff").length,
    }),
    [users],
  );

  const activeTabMeta = platformUserRoleTabMeta(activeRoleTab);
  const roleUsers = useMemo(
    () => users.filter((u) => u.role === activeRoleTab),
    [users, activeRoleTab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roleUsers.filter((row) => {
      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.operatorName.toLowerCase().includes(q) ||
        row.operatorCode.toLowerCase().includes(q) ||
        (row.stationName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [roleUsers, query]);

  const listPagination = usePlatformPagination(filtered, 6, `${query}|${activeRoleTab}`);

  function handleOpenUser(row: PlatformUserRow) {
    setSelectedUser(row);
    setEditName(row.displayName);
    setEditPhone(row.phone);
    setEditStatus(row.status);
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    if (!selectedUser) return;
    await updateUser(selectedUser.id, {
      displayName: editName,
      phone: editPhone,
      status: editStatus,
    });
    setSelectedUser((prev) =>
      prev
        ? {
            ...prev,
            displayName: editName,
            phone: editPhone,
            status: editStatus,
          }
        : null,
    );
    setIsEditing(false);
    await showSuccessAlert({
      title: "User updated",
      text: "User profile details updated successfully.",
      confirmButtonColor: "#fd7e14",
    });
  }

  async function handleResetLogin(row: PlatformUserRow) {
    const ok = await showConfirmDialog({
      title: "Reset login?",
      text: `Issue a temporary password for ${row.displayName} (${row.email}) on ${row.operatorName}. Use this when they cannot sign in.`,
      confirmText: "Reset login",
      confirmButtonColor: "#fd7e14",
    });
    if (!ok) return;

    const result = await resetUserLogin(row.id);
    const targetStatus =
      row.status === "locked" || row.status === "inactive" ? "pending_setup" : row.status;

    setSelectedUser((prev) =>
      prev && prev.id === row.id
        ? {
            ...prev,
            status: targetStatus,
          }
        : prev,
    );

    await showSuccessAlert({
      title: result.smsSent ? "Login reset sent" : "Login reset",
      text: platformCredentialSuccessText(result),
      confirmButtonColor: "#fd7e14",
    });
  }

  return (
    <>
      <PlatformUserRoleTabs
        activeRole={activeRoleTab}
        onChange={setActiveRoleTab}
        counts={roleCounts}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <div>
          <h2 className="font-display text-base font-bold text-stone-900">{activeTabMeta.label}</h2>
          <p className="font-body mt-0.5 text-sm text-stone-500">{activeTabMeta.description}</p>
        </div>
        <Link
          href="/platform/users"
          className="font-display inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--platform-orange-dark)]"
        >
          View all users
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <PlatformTableToolbar
        value={query}
        onChange={setQuery}
        placeholder="Search users by name, email, phone, or transport…"
        resultCount={filtered.length}
        totalCount={roleUsers.length}
      />

      <div className="operator-portal-table-scroll overflow-x-auto">
        <table className="min-w-[880px] w-full text-left">
          <thead>
            <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
              <PlatformTableSnHeader />
              <th className="font-display px-4 py-3 font-bold">User</th>
              <th className="font-display px-4 py-3 font-bold">Transport</th>
              <th className="font-display px-4 py-3 font-bold">Station</th>
              <th className="font-display px-4 py-3 font-bold">Status</th>
              <th className="font-display px-4 py-3 font-bold">Last sign-in</th>
              <th className="font-display px-4 py-3 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={USER_TABLE_COLSPAN} className="px-4 py-10 text-center">
                  <p className="font-body text-sm text-stone-500">
                    No {activeTabMeta.label.toLowerCase()} match search query.
                  </p>
                </td>
              </tr>
            ) : (
              listPagination.pageItems.map((row, index) => (
                <tr key={row.id} className="border-t border-stone-100 hover:bg-stone-50/80">
                  <PlatformTableSnCell
                    value={platformRowNumber(
                      listPagination.currentPage,
                      listPagination.pageSize,
                      index,
                    )}
                  />
                  <td className="px-4 py-3.5">
                    <p className="font-display text-sm font-bold text-stone-900">
                      {row.displayName}
                    </p>
                    <p className="font-mono text-[11px] text-stone-500">{row.email}</p>
                    <p className="font-body text-[11px] text-stone-400">{row.phone}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-display text-sm font-semibold text-stone-800">
                      {row.operatorName}
                    </p>
                    <p className="font-mono text-[11px] text-stone-500">{row.operatorCode}</p>
                  </td>
                  <td className="font-body px-4 py-3.5 text-sm text-stone-700">
                    {row.stationName ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-display inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-200">
                      {platformUserStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="font-body px-4 py-3.5 text-xs text-stone-500">
                    {formatPlatformWhen(row.lastSignInAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleOpenUser(row)}
                      className="font-display inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-700 transition-colors hover:border-[var(--platform-orange)]/50 hover:bg-[var(--platform-orange-soft)] hover:text-[var(--platform-orange-dark)] shadow-sm"
                    >
                      <Edit2 className="size-3" />
                      View / Edit
                    </button>
                  </td>
                </tr>
              ))
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

      {selectedUser ? (
        <PlatformModalShell
          onClose={() => setSelectedUser(null)}
          eyebrow="User profile"
          title={selectedUser.displayName}
          subtitle={`${selectedUser.operatorName} · ${platformUserRoleColumnLabel(selectedUser.role)}`}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => void handleResetLogin(selectedUser)}
                    className="font-display inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 shadow-sm hover:border-red-200 hover:text-red-600"
                  >
                    <KeyRound className="size-3.5" />
                    Reset login
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="font-display rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-stone-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="font-display inline-flex items-center gap-1.5 rounded-xl bg-[var(--platform-orange)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
                    >
                      <Save className="size-3.5" />
                      Save details
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="font-display inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-stone-800"
                  >
                    <Edit2 className="size-3.5" />
                    Edit profile
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="font-display mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="font-body w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--platform-orange)]"
                    />
                  </div>

                  <div>
                    <label className="font-display mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="font-body w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--platform-orange)]"
                    />
                  </div>

                  <div>
                    <label className="font-display mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as PlatformUserStatus)}
                      className="font-display w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 outline-none focus:border-[var(--platform-orange)]"
                    >
                      <option value="active">Active</option>
                      <option value="locked">Locked</option>
                      <option value="pending_setup">Setup Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="font-display inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-stone-700">
                      <Shield className="size-3.5 text-stone-500" />
                      {platformUserRoleLabel(selectedUser.role)}
                    </span>
                    <span className="font-display inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                      <Building className="size-3.5 text-orange-500" />
                      {selectedUser.operatorName} ({selectedUser.operatorCode})
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 px-4 py-2">
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Mail className="size-4" />
                        <span className="font-body text-xs">Email</span>
                      </div>
                      <span className="font-mono text-sm text-stone-900">{selectedUser.email}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Phone className="size-4" />
                        <span className="font-body text-xs">Phone</span>
                      </div>
                      <span className="font-body text-sm text-stone-900">{selectedUser.phone}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-stone-500">
                        <MapPin className="size-4" />
                        <span className="font-body text-xs">Station</span>
                      </div>
                      <span className="font-body text-sm text-stone-900">{selectedUser.stationName ?? "HQ (All stations)"}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-stone-500">
                        <Check className="size-4" />
                        <span className="font-body text-xs">Status</span>
                      </div>
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-stone-800">
                        {platformUserStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </PlatformModalShell>
      ) : null}
    </>
  );
}
