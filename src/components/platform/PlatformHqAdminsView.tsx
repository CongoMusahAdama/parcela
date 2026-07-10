"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Edit2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  UserCog,
  Users,
} from "lucide-react";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { PlatformModalShell } from "@/components/platform/PlatformModalShell";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import {
  PlatformTablePagination,
  PlatformTableSnCell,
  PlatformTableSnHeader,
} from "@/components/platform/PlatformTablePagination";
import { PlatformTableToolbar } from "@/components/platform/PlatformTableToolbar";
import {
  formatPlatformWhen,
  getHqNetworkForOperator,
  platformUserRoleLabel,
  platformUserStatusLabel,
  type PlatformHqAdminRow,
  type PlatformUserStatus,
} from "@/lib/platform-demo";
import { platformCredentialSuccessText } from "@/lib/platform-credentials-message";
import { platformRowNumber, usePlatformPagination } from "@/lib/platform-pagination";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { cn } from "@/lib/utils";

const inputClass =
  "font-body w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]";

const labelClass =
  "font-display mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500";

function hqStatusTone(status: PlatformHqAdminRow["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "pending_setup") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

function hqStatusLabel(status: PlatformHqAdminRow["status"]) {
  if (status === "active") return "Active";
  if (status === "pending_setup") return "Setup pending";
  return "Inactive";
}

function userStatusTone(status: PlatformUserStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "locked") return "bg-red-50 text-red-800 ring-red-200";
  if (status === "pending_setup") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

type DetailTab = "profile" | "organization";

export function PlatformHqAdminsView() {
  const { hqAdmins, operators, users, updateHqAdmin, issueHqCredentials, resetHqPassword } =
    usePlatformData();
  const rows = hqAdmins;
  const [query, setQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("all");

  const [selected, setSelected] = useState<PlatformHqAdminRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<PlatformHqAdminRow["status"]>("active");
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (operatorFilter !== "all" && row.operatorCode !== operatorFilter) return false;
      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.includes(q) ||
        row.operatorCode.toLowerCase().includes(q)
      );
    });
  }, [rows, query, operatorFilter]);

  const listPagination = usePlatformPagination(filtered, 8, `${query}|${operatorFilter}`);

  const network = useMemo(() => {
    if (!selected) return null;
    return getHqNetworkForOperator(selected.operatorCode, rows, users, operators);
  }, [selected, rows, users, operators]);

  function openAdmin(row: PlatformHqAdminRow) {
    setSelected(row);
    setEditName(row.displayName);
    setEditEmail(row.email);
    setEditPhone(row.phone);
    setEditStatus(row.status);
    setIsEditing(false);
    setDetailTab("profile");
  }

  function closeModal() {
    setSelected(null);
    setIsEditing(false);
    setDetailTab("profile");
  }

  async function handleSaveEdit() {
    if (!selected) return;

    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    const phone = editPhone.trim();

    if (!name) {
      await showValidationAlert({ title: "Name required", text: "Enter the HQ admin's full name." });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await showValidationAlert({
        title: "Valid email required",
        text: "Login email must be a valid address.",
      });
      return;
    }
    if (!phone) {
      await showValidationAlert({ title: "Phone required", text: "Enter a contact phone number." });
      return;
    }

    const duplicate = rows.some((r) => r.id !== selected.id && r.email.toLowerCase() === email);
    if (duplicate) {
      await showValidationAlert({
        title: "Email in use",
        text: "Another HQ admin already uses this login email.",
      });
      return;
    }

    await updateHqAdmin(selected.id, {
      displayName: name,
      email,
      phone,
      status: editStatus,
    });

    setSelected((prev) =>
      prev ? { ...prev, displayName: name, email, phone, status: editStatus } : null,
    );
    setIsEditing(false);

    await showSuccessAlert({
      title: "HQ admin updated",
      text: "Login and contact details saved.",
      confirmButtonColor: "#10367D",
    });
  }

  async function handleIssueLogin(row: PlatformHqAdminRow) {
    const ok = await showConfirmDialog({
      title: "Issue HQ login?",
      text: `Prepare first-time credentials for ${row.displayName} (${row.email}) on ${row.operatorCode}.`,
      confirmText: "Issue login",
      confirmButtonColor: "#10367D",
    });
    if (!ok) return;

    const result = await issueHqCredentials(row.id);
    setSelected((prev) =>
      prev && prev.id === row.id ? { ...prev, status: "active" } : prev,
    );

    await showSuccessAlert({
      title: result.smsSent ? "HQ login sent" : "HQ login ready",
      text: platformCredentialSuccessText(result),
      confirmButtonColor: "#10367D",
    });
  }

  async function handleResetLogin(row: PlatformHqAdminRow) {
    const ok = await showConfirmDialog({
      title: "Reset HQ login?",
      text: `Issue a temporary password for ${row.displayName} (${row.email}) on ${row.operatorCode}. Use when they forgot their password or are locked out.`,
      confirmText: "Reset login",
      confirmButtonColor: "#10367D",
    });
    if (!ok) return;

    const result = await resetHqPassword(row.id);
    setSelected((prev) =>
      prev && prev.id === row.id ? { ...prev, status: "pending_setup" } : prev,
    );

    await showSuccessAlert({
      title: result.smsSent ? "Login reset sent" : "Login reset",
      text: platformCredentialSuccessText(result),
      confirmButtonColor: "#10367D",
    });
  }

  const operatorName =
    selected &&
    (operators.find((o) => o.code === selected.operatorCode)?.name ??
      selected.operatorCode);

  const detailTabs: { id: DetailTab; label: string }[] = [
    { id: "profile", label: "Profile & login" },
    { id: "organization", label: "HQ & branches" },
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--platform-orange)]">
            Access
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
            HQ admins
          </h1>
          <p className="font-body mt-2 max-w-2xl text-sm text-stone-500">
            Headquarters accounts for each transport. Edit login details, issue first-time credentials,
            or reset passwords when someone is locked out.
          </p>
        </div>
        <Link
          href="/platform/users"
          className="font-display inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-700 shadow-sm hover:border-[var(--platform-orange)]/40 hover:bg-[var(--platform-orange-soft)]"
        >
          All users
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <select
          value={operatorFilter}
          onChange={(e) => setOperatorFilter(e.target.value)}
          className="font-display rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-700 outline-none focus:border-[var(--platform-orange)]"
        >
          <option value="all">All transports</option>
          {operators.map((op) => (
            <option key={op.code} value={op.code}>
              {op.name}
            </option>
          ))}
        </select>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <PlatformTableToolbar
          value={query}
          onChange={setQuery}
          placeholder="Search HQ name, email, or transport…"
          resultCount={filtered.length}
          totalCount={rows.length}
        />
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-left">
            <thead>
              <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                <PlatformTableSnHeader />
                <th className="font-display px-4 py-3 font-bold">HQ admin</th>
                <th className="font-display px-4 py-3 font-bold">Transport</th>
                <th className="font-display px-4 py-3 font-bold">Phone</th>
                <th className="font-display px-4 py-3 font-bold">Status</th>
                <th className="font-display px-4 py-3 font-bold">Last sign-in</th>
                <th className="font-display px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <UserCog className="mx-auto size-8 text-stone-300" />
                    <p className="font-body mt-3 text-sm text-stone-500">No HQ admins match.</p>
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
                    </td>
                    <td className="font-display px-4 py-3.5 text-sm font-semibold text-stone-800">
                      {row.operatorCode}
                    </td>
                    <td className="font-body px-4 py-3.5 text-sm text-stone-700">{row.phone}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                          hqStatusTone(row.status),
                        )}
                      >
                        {hqStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="font-body px-4 py-3.5 text-xs text-stone-500">
                      {formatPlatformWhen(row.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAdmin(row)}
                          className="font-display inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-700 shadow-sm transition-colors hover:border-[var(--platform-orange)]/50 hover:bg-[var(--platform-orange-soft)] hover:text-[var(--platform-orange-dark)]"
                        >
                          <Edit2 className="size-3" />
                          View / Edit
                        </button>
                        {row.status === "pending_setup" ? (
                          <button
                            type="button"
                            onClick={() => void handleIssueLogin(row)}
                            className="font-display inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 transition-colors hover:bg-amber-100"
                          >
                            <KeyRound className="size-3.5" />
                            Issue login
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleResetLogin(row)}
                            className="font-display inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <KeyRound className="size-3.5" />
                            Reset
                          </button>
                        )}
                      </div>
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
      </section>

      {selected && network ? (
        <PlatformModalShell
          onClose={closeModal}
          eyebrow="HQ headquarters view"
          title={selected.displayName}
          subtitle={`${operatorName} · ${selected.operatorCode}`}
          maxWidthClass="max-w-3xl"
          leading={
            network.operator ? (
              <PlatformOperatorMark
                code={network.operator.code}
                name={network.operator.name}
                brandColor={network.operator.brandColor}
                size="md"
              />
            ) : undefined
          }
          headerExtra={
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "HQ admins", value: `${network.stats.hqActive}/${network.stats.hqTotal} active` },
                  { label: "Branches", value: `${network.stats.branchesActive}/${network.stats.branchTotal} live` },
                  { label: "Field staff", value: `${network.stats.staffActive}/${network.stats.staffTotal} active` },
                  { label: "Seeded stations", value: String(network.operator?.stationCount ?? "—") },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="font-display text-[9px] font-bold uppercase tracking-wide text-stone-400">
                      {stat.label}
                    </p>
                    <p className="font-display mt-0.5 text-sm font-bold text-stone-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              {!isEditing ? (
                <div className="mt-4 flex gap-1 rounded-xl bg-stone-100/80 p-1">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id)}
                      className={cn(
                        "font-display flex-1 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-all",
                        detailTab === tab.id
                          ? "bg-white text-[var(--platform-orange-dark)] shadow-sm"
                          : "text-stone-500 hover:text-stone-700",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {!isEditing && selected.status === "pending_setup" ? (
                  <button
                    type="button"
                    onClick={() => void handleIssueLogin(selected)}
                    className="font-display inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
                  >
                    <KeyRound className="size-3.5" />
                    Issue login
                  </button>
                ) : null}
                {!isEditing && selected.status !== "pending_setup" ? (
                  <button
                    type="button"
                    onClick={() => void handleResetLogin(selected)}
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
                      onClick={() => void handleSaveEdit()}
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
          {isEditing || detailTab === "profile" ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="hq-edit-name" className={labelClass}>
                      Full name
                    </label>
                    <input
                      id="hq-edit-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="hq-edit-email" className={labelClass}>
                      Login email
                    </label>
                    <input
                      id="hq-edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={cn(inputClass, "font-mono")}
                      placeholder="hq@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="hq-edit-phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      id="hq-edit-phone"
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="hq-edit-status" className={labelClass}>
                      Account status
                    </label>
                    <select
                      id="hq-edit-status"
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as PlatformHqAdminRow["status"])
                      }
                      className="font-display w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 outline-none focus:border-[var(--platform-orange)]"
                    >
                      <option value="active">Active</option>
                      <option value="pending_setup">Setup pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 px-4 py-2">
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Mail className="size-4 shrink-0" />
                      <span className="font-body text-xs">Login email</span>
                    </div>
                    <span className="font-mono text-right text-sm text-stone-900">
                      {selected.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Phone className="size-4 shrink-0" />
                      <span className="font-body text-xs">Phone</span>
                    </div>
                    <span className="font-body text-sm text-stone-900">{selected.phone}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Check className="size-4 shrink-0" />
                      <span className="font-body text-xs">Status</span>
                    </div>
                    <span
                      className={cn(
                        "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        hqStatusTone(selected.status),
                      )}
                    >
                      {hqStatusLabel(selected.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2 text-stone-500">
                      <UserCog className="size-4 shrink-0" />
                      <span className="font-body text-xs">Last sign-in</span>
                    </div>
                    <span className="font-body text-sm text-stone-900">
                      {formatPlatformWhen(selected.lastSignInAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-display text-sm font-bold text-stone-900">HQ team</h4>
                      <span className="font-body text-xs text-stone-500">
                        {network.stats.hqActive} of {network.stats.hqTotal} active
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-stone-200">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
                            <PlatformTableSnHeader />
                            <th className="font-display px-3 py-2.5 font-bold">Name</th>
                            <th className="font-display px-3 py-2.5 font-bold">Login</th>
                            <th className="font-display px-3 py-2.5 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {network.hqTeam.map((hq, index) => (
                            <tr
                              key={hq.id}
                              className={cn(
                                "border-t border-stone-100",
                                hq.id === selected.id && "bg-[var(--platform-orange-soft)]/60",
                              )}
                            >
                              <PlatformTableSnCell value={index + 1} />
                              <td className="px-3 py-3">
                                <p className="font-display font-semibold text-stone-900">
                                  {hq.displayName}
                                  {hq.id === selected.id ? (
                                    <span className="ml-2 text-[10px] font-bold uppercase text-[var(--platform-orange-dark)]">
                                      Viewing
                                    </span>
                                  ) : null}
                                </p>
                                <p className="font-body text-xs text-stone-500">{hq.phone}</p>
                              </td>
                              <td className="px-3 py-3 font-mono text-xs text-stone-600">
                                {hq.email}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={cn(
                                    "font-display inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                    hqStatusTone(hq.status),
                                  )}
                                >
                                  {hqStatusLabel(hq.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-display text-sm font-bold text-stone-900">
                        Branches & staff
                      </h4>
                      <span className="font-body text-xs text-stone-500">
                        {network.stats.branchesActive} branches operating
                      </span>
                    </div>
                    {network.branches.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
                        <MapPin className="mx-auto size-7 text-stone-300" />
                        <p className="font-body mt-2 text-sm text-stone-500">
                          No branch leads or counter staff yet. HQ creates them after go-live.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {network.branches.map((branch) => (
                          <div
                            key={branch.stationName}
                            className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/80 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-[var(--platform-orange)]" />
                                <p className="font-display text-sm font-bold text-stone-900">
                                  {branch.stationName}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                  branch.isActive
                                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                    : "bg-stone-100 text-stone-600 ring-stone-200",
                                )}
                              >
                                {branch.isActive ? "Active branch" : "Inactive"}
                              </span>
                            </div>
                            <div className="divide-y divide-stone-100 px-4 py-1">
                              {branch.lead ? (
                                <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                                  <div>
                                    <p className="font-display text-sm font-semibold text-stone-900">
                                      {branch.lead.displayName}
                                    </p>
                                    <p className="font-body text-xs text-stone-500">
                                      {platformUserRoleLabel(branch.lead.role)} · {branch.lead.email}
                                    </p>
                                  </div>
                                  <span
                                    className={cn(
                                      "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                      userStatusTone(branch.lead.status),
                                    )}
                                  >
                                    {platformUserStatusLabel(branch.lead.status)}
                                  </span>
                                </div>
                              ) : (
                                <div className="py-3">
                                  <p className="font-body text-sm text-stone-500">No branch lead assigned</p>
                                </div>
                              )}
                              {branch.staff.length > 0 ? (
                                <div className="py-3">
                                  <p className="font-display mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">
                                    Counter staff ({branch.activeCount}/{branch.totalCount} active)
                                  </p>
                                  <ul className="space-y-2">
                                    {branch.staff.map((member) => (
                                      <li
                                        key={member.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2"
                                      >
                                        <div>
                                          <p className="font-display text-sm font-semibold text-stone-800">
                                            {member.displayName}
                                          </p>
                                          <p className="font-mono text-[11px] text-stone-500">
                                            {member.email}
                                          </p>
                                        </div>
                                        <span
                                          className={cn(
                                            "font-display inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                            userStatusTone(member.status),
                                          )}
                                        >
                                          {platformUserStatusLabel(member.status)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-600">
                    <Users className="size-4 shrink-0" />
                    <p className="font-body text-xs leading-relaxed">
                      Need to edit or reset a branch lead or counter staff? Use{" "}
                      <Link
                        href="/platform/users"
                        className="font-semibold text-[var(--platform-orange-dark)] underline-offset-2 hover:underline"
                      >
                        Users
                      </Link>{" "}
                      for full profile support.
                    </p>
                  </div>
                </div>
              )}
        </PlatformModalShell>
      ) : null}
    </main>
  );
}
