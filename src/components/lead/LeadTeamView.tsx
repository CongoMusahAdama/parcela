"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil, Trash2, UserPlus, UserX } from "lucide-react";
import { LeadAddStaffModal } from "@/components/lead/LeadAddStaffModal";
import { LeadEditStaffModal } from "@/components/lead/LeadEditStaffModal";
import { LeadStaffDetailModal } from "@/components/lead/LeadStaffDetailModal";
import { StaffTablePagination } from "@/components/staff/StaffTablePagination";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { fetchLeadTeam, deleteLeadTeamMemberApi, updateLeadTeamMemberApi } from "@/lib/lead-api";
import { formatLeadDateTime } from "@/lib/lead-format";
import { getLeadFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { LeadTeamMember } from "@/types/lead";

export function LeadTeamView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, staff } = useLeadSession();
  const [team, setTeam] = useState<LeadTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<LeadTeamMember | null>(null);
  const [editMember, setEditMember] = useState<LeadTeamMember | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const openAddModal = async () => {
    const locks = await loadOperatorLockStatus(staff.operator);
    if (locks.leadOpsLocked) {
      await showValidationAlert({
        title: "Operations frozen by HQ",
        text: getLeadFreezeMessage(staff.operator),
      });
      return;
    }
    setAddModalOpen(true);
  };

  const loadTeam = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await fetchLeadTeam(token);
      setTeam(data);
    } catch (err) {
      if (!options?.silent) {
        await showValidationAlert({
          title: "Could not load staff",
          text: err instanceof Error ? err.message : "Please try again.",
        });
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadTeam({ silent: true });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadTeam]);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      void openAddModal();
      router.replace("/lead/team");
    }
  }, [searchParams, router]);

  async function toggleActive(member: LeadTeamMember) {
    const locks = await loadOperatorLockStatus(staff.operator);
    if (locks.leadOpsLocked) {
      await showValidationAlert({
        title: "Operations frozen by HQ",
        text: getLeadFreezeMessage(staff.operator),
      });
      return;
    }

    const disabling = member.active !== false;
    const confirmed = await showConfirmDialog({
      title: disabling ? "Disable this staff member?" : "Re-enable this staff member?",
      text: disabling
        ? `${member.displayName} will no longer appear on the active counter staff list.`
        : `${member.displayName} can sign in at the counter again.`,
      confirmText: disabling ? "Yes, disable" : "Yes, enable",
      cancelText: "Cancel",
      icon: "warning",
      confirmButtonColor: disabling ? "#dc2626" : "#0d9488",
    });

    if (!confirmed) return;

    try {
      const updated = await updateLeadTeamMemberApi(member.id, { active: !disabling }, token);
      setTeam((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setDetailMember((current) => (current?.id === updated.id ? updated : current));
      await showSuccessAlert({
        title: disabling ? "Staff disabled" : "Staff enabled",
        text: `${updated.displayName} is now ${updated.active === false ? "inactive" : "active"}.`,
      });
    } catch (err) {
      await showValidationAlert({
        title: "Update failed",
        text: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  function handleMemberUpdated(updated: LeadTeamMember) {
    setTeam((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setDetailMember((current) => (current?.id === updated.id ? updated : current));
  }

  async function deleteMember(member: LeadTeamMember) {
    const locks = await loadOperatorLockStatus(staff.operator);
    if (locks.leadOpsLocked) {
      await showValidationAlert({
        title: "Operations frozen by HQ",
        text: getLeadFreezeMessage(staff.operator),
      });
      return;
    }

    const confirmed = await showConfirmDialog({
      title: "Delete this staff member?",
      text: `${member.displayName} will be removed from ${member.stationName}. This cannot be undone.`,
      confirmText: "Yes, delete",
      cancelText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmed) return;

    try {
      await deleteLeadTeamMemberApi(member.id, token);
      setTeam((current) => current.filter((item) => item.id !== member.id));
      setDetailMember((current) => (current?.id === member.id ? null : current));
      setEditMember((current) => (current?.id === member.id ? null : current));
      await showSuccessAlert({
        title: "Staff deleted",
        text: `${member.displayName} was removed from your branch.`,
      });
    } catch (err) {
      await showValidationAlert({
        title: "Delete failed",
        text: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const onlineCount = team.filter((member) => member.online).length;
  const totalPages = Math.max(1, Math.ceil(team.length / pageSize));
  const paginatedTeam = useMemo(
    () => team.slice((page - 1) * pageSize, page * pageSize),
    [team, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [team.length]);

  return (
    <>
      <main className="px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Manage staff</h1>
            <p className="font-body mt-1 text-sm text-muted">
              {loading
                ? "Loading counter staff…"
                : `${team.length} staff · ${onlineCount} online now`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void openAddModal()}
            className="font-display inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white sm:w-auto"
            style={{ background: "var(--staff-accent)" }}
          >
            <UserPlus className="size-4" />
            Add staff
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
            Loading staff…
          </div>
        ) : team.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-display text-lg font-bold text-foreground">No counter staff yet</p>
            <p className="font-body mt-2 text-sm text-muted">Add your first staff member to get started.</p>
            <button
              type="button"
              onClick={() => void openAddModal()}
              className="font-display mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              <UserPlus className="size-4" />
              Add staff
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 md:hidden">
              {paginatedTeam.map((member) => {
                const inactive = member.active === false;
                return (
                  <article
                    key={member.id}
                    className="rounded-xl border border-border bg-surface p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display truncate text-sm font-bold text-foreground">
                          {member.displayName}
                        </p>
                        <p className="font-body truncate text-xs text-muted">{member.phone ?? "—"}</p>
                        <p className="font-body truncate text-[11px] text-muted">{member.stationName}</p>
                      </div>
                      <span
                        className={`font-display shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          inactive ? "bg-slate-100 text-slate-600" : "staff-status-ready"
                        }`}
                      >
                        {inactive ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span
                        className={`font-display inline-flex items-center gap-1 font-semibold ${
                          member.online ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            member.online ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {member.online ? "Online" : "Offline"}
                      </span>
                      <span className="text-muted">
                        Today: <strong className="text-foreground">{member.parcelsHandledToday}</strong>
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailMember(member)}
                        className="font-display inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-foreground"
                      >
                        <Eye className="size-3.5" />
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMember(member)}
                        className="font-display inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-foreground"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMember(member)}
                        className="font-display inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
              <StaffTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={team.length}
                pageSize={pageSize}
                itemLabel="staff"
                onPageChange={setPage}
              />
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider">
                    {["Staff", "Terminal", "Phone", "Account", "Online", "Last login", "Last logout", "Today", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="font-display sticky top-0 z-10 px-4 py-3 font-bold text-foreground/80 shadow-[inset_0_-1px_0_var(--color-border)]"
                          style={{ background: "var(--staff-accent-muted)" }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeam.map((member) => {
                    const inactive = member.active === false;
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-[#f8fafc]"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-display text-sm font-bold text-foreground">
                            {member.displayName}
                          </p>
                          <p className="font-body mt-0.5 text-xs text-muted">{member.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-display text-sm font-semibold text-foreground">
                            {member.stationName}
                          </p>
                          <p className="font-body mt-0.5 text-xs text-muted">{member.stationCode}</p>
                        </td>
                        <td className="font-body px-4 py-3.5 text-sm text-foreground">
                          {member.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              inactive ? "bg-slate-100 text-slate-600" : "staff-status-ready"
                            }`}
                          >
                            {inactive ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-display inline-flex items-center gap-1.5 text-xs font-semibold ${
                              member.online ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            <span
                              className={`size-2 rounded-full ${
                                member.online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                              }`}
                            />
                            {member.online ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="font-body px-4 py-3.5 text-sm text-muted">
                          {formatLeadDateTime(member.lastLoginAt)}
                        </td>
                        <td className="font-body px-4 py-3.5 text-sm text-muted">
                          {member.online ? "—" : formatLeadDateTime(member.lastLogoutAt)}
                        </td>
                        <td className="font-display px-4 py-3.5 text-sm font-bold text-foreground">
                          {member.parcelsHandledToday}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailMember(member)}
                              className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                            >
                              <Eye className="size-3.5" />
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditMember(member)}
                              className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleActive(member)}
                              className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                            >
                              <UserX className="size-3.5" />
                              {inactive ? "Enable" : "Disable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteMember(member)}
                              className="font-display inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <StaffTablePagination
              page={page}
              totalPages={totalPages}
              totalItems={team.length}
              pageSize={pageSize}
              itemLabel="staff"
              onPageChange={setPage}
            />
          </div>
          </>
        )}
      </main>

      <LeadAddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={() => void loadTeam()}
      />

      <LeadEditStaffModal
        member={editMember}
        onClose={() => setEditMember(null)}
        onUpdated={handleMemberUpdated}
      />

      <LeadStaffDetailModal
        member={detailMember}
        onClose={() => setDetailMember(null)}
        onEdit={(member) => {
          setDetailMember(null);
          setEditMember(member);
        }}
        onToggleActive={(member) => void toggleActive(member)}
        onDelete={(member) => void deleteMember(member)}
      />
    </>
  );
}
