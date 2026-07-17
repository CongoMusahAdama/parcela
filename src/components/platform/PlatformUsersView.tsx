"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Users,
  Edit2,
  Shield,
  Phone,
  Mail,
  Building,
  MapPin,
  Check,
  Save,
} from "lucide-react";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { PlatformModalShell } from "@/components/platform/PlatformModalShell";
import {
  PlatformUserRoleTabs,
  USER_TABLE_COLSPAN,
  platformUserRoleColumnLabel,
  platformUserRoleTabMeta,
} from "@/components/platform/PlatformUserRoleColumns";
import {
  PlatformTablePagination,
  PlatformTableSnCell,
  PlatformTableSnHeader,
} from "@/components/platform/PlatformTablePagination";
import { PlatformTableToolbar } from "@/components/platform/PlatformTableToolbar";
import {
  formatPlatformWhen,
  getPlatformUserStats,
  platformUserRoleLabel,
  platformUserStatusLabel,
  type PlatformUserRole,
  type PlatformUserRow,
  type PlatformUserStatus,
} from "@/lib/platform-demo";
import { platformCredentialSuccessText } from "@/lib/platform-credentials-message";
import { platformRowNumber, usePlatformPagination } from "@/lib/platform-pagination";
import { showConfirmDialog, showSuccessAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | PlatformUserStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All status" },
  { id: "active", label: "Active" },
  { id: "locked", label: "Locked" },
  { id: "pending_setup", label: "Setup pending" },
  { id: "inactive", label: "Inactive" },
];

function userStatusTone(status: PlatformUserStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "locked") return "bg-red-50 text-red-800 ring-red-200";
  if (status === "pending_setup") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

export function PlatformUsersView() {
  const { users, operators, updateUser, resetUserLogin } = usePlatformData();
  const [query, setQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [activeRoleTab, setActiveRoleTab] = useState<PlatformUserRole>("hq_admin");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [selectedUser, setSelectedUser] = useState<PlatformUserRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<PlatformUserStatus>("active");

  const stats = getPlatformUserStats(users);
  const roleCounts = useMemo(
    () => ({
      hq_admin: users.filter((u) => u.role === "hq_admin").length,
      branch_lead: users.filter((u) => u.role === "branch_lead").length,
      counter_staff: users.filter((u) => u.role === "counter_staff").length,
    }),
    [users],
  );
  const operatorOptions = useMemo(
    () =>
      Array.from(
        new Map(
          [...operators, ...users.map((u) => ({ code: u.operatorCode, name: u.operatorName }))]
            .map((o) => [o.code, o.name] as const),
        ).entries(),
      ).map(([code, name]) => ({ code, name })),
    [users, operators],
  );

  const activeTabMeta = platformUserRoleTabMeta(activeRoleTab);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((row) => {
      if (row.role !== activeRoleTab) return false;
      if (operatorFilter !== "all" && row.operatorCode !== operatorFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.operatorCode.toLowerCase().includes(q) ||
        row.operatorName.toLowerCase().includes(q) ||
        (row.stationName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, query, operatorFilter, activeRoleTab, statusFilter]);

  const listPagination = usePlatformPagination(
    filtered,
    8,
    `${query}|${operatorFilter}|${activeRoleTab}|${statusFilter}`,
  );

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
    <main className="operator-portal-main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--platform-orange)]">
            Support
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Users</h1>
          <p className="font-body mt-2 max-w-2xl text-sm text-stone-500">
            HQ admins, branch leads, and counter staff — each role in its own tab. Select a profile
            to view details, edit settings, or reset logins.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-600 shadow-sm">
          <Users className="size-4 text-[var(--platform-orange)]" />
          <span className="font-display text-xs font-bold uppercase tracking-wide">
            {stats.total} accounts
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total users", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Locked", value: stats.locked },
          { label: "Setup pending", value: stats.pending },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {card.label}
            </p>
            <p className="font-display mt-1 text-2xl font-bold text-stone-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex flex-wrap gap-2">
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="font-display rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-700 outline-none focus:border-[var(--platform-orange)]"
          >
            <option value="all">All transports</option>
            {operatorOptions.map((op) => (
              <option key={op.code} value={op.code}>
                {op.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="font-display rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-700 outline-none focus:border-[var(--platform-orange)]"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <PlatformUserRoleTabs
          activeRole={activeRoleTab}
          onChange={setActiveRoleTab}
          counts={roleCounts}
        />

        <div className="border-b border-stone-100 px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">
                {activeTabMeta.label}
              </h2>
              <p className="font-body mt-0.5 text-sm text-stone-500">{activeTabMeta.description}</p>
            </div>
            <span
              className={cn(
                "font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                activeTabMeta.tone,
              )}
            >
              {filtered.length} shown
            </span>
          </div>
        </div>

        <PlatformTableToolbar
          value={query}
          onChange={setQuery}
          placeholder="Search name, email, phone, station, or transport…"
          resultCount={filtered.length}
          totalCount={users.filter((u) => u.role === activeRoleTab).length}
        />

        {filtered.length > 0 ? (
          <div className="space-y-2.5 p-3 xl:hidden">
            {listPagination.pageItems.map((row, index) => (
              <article
                key={row.id}
                className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-stone-900">{row.displayName}</p>
                    <p className="font-mono truncate text-[11px] text-stone-500">{row.email}</p>
                    <p className="font-body text-[11px] text-stone-400">{row.phone}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-display inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
                      userStatusTone(row.status),
                    )}
                  >
                    {platformUserStatusLabel(row.status)}
                  </span>
                </div>
                <p className="font-body mt-2 text-xs text-stone-600">
                  {row.operatorName}
                  <span className="font-mono text-[10px] text-stone-400"> · {row.operatorCode}</span>
                </p>
                <p className="font-body mt-1 text-xs text-stone-500">
                  {row.stationName ?? (row.role === "hq_admin" ? "HQ (All stations)" : "—")}
                </p>
                <p className="font-body mt-1 text-[10px] text-stone-400">
                  Last sign-in: {formatPlatformWhen(row.lastSignInAt)}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenUser(row)}
                  className="font-display mt-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-700 shadow-sm"
                >
                  <Edit2 className="size-3" />
                  View / Edit
                </button>
              </article>
            ))}
          </div>
        ) : null}

        <div className="hidden xl:block operator-portal-table-scroll overflow-x-auto">
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
                  <td colSpan={USER_TABLE_COLSPAN} className="px-4 py-12 text-center">
                    <p className="font-display text-sm font-bold text-stone-700">
                      No {activeTabMeta.label.toLowerCase()} match
                    </p>
                    <p className="font-body mt-1 text-sm text-stone-500">
                      Try another tab or adjust your search and filters.
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
                      {row.stationName ?? (row.role === "hq_admin" ? "HQ (All stations)" : "—")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                          userStatusTone(row.status),
                        )}
                      >
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
                        className="font-display inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-700 shadow-sm transition-colors hover:border-[var(--platform-orange)]/50 hover:bg-[var(--platform-orange-soft)] hover:text-[var(--platform-orange-dark)]"
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

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center xl:hidden">
            <p className="font-display text-sm font-bold text-stone-700">
              No {activeTabMeta.label.toLowerCase()} match
            </p>
            <p className="font-body mt-1 text-sm text-stone-500">
              Try another tab or adjust your search and filters.
            </p>
          </div>
        ) : null}

        <PlatformTablePagination
          currentPage={listPagination.currentPage}
          totalPages={listPagination.totalPages}
          pageStart={listPagination.pageStart}
          pageEnd={listPagination.pageEnd}
          totalItems={listPagination.totalItems}
          onPageChange={listPagination.setPage}
        />
      </section>

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
                    <span className="font-body text-sm text-stone-900">
                      {selectedUser.stationName ?? "HQ (All stations)"}
                    </span>
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
    </main>
  );
}
