import { apiFetch } from "@/lib/api-client";
import type {
  AdminNetworkOverview,
  AdminParcelListResult,
  AdminSession,
} from "@/types/admin";
import type { Operator, Station } from "@/types/parcel";

export type AdminStationRow = Station & {
  leadName: string | null;
  leadPhone: string | null;
  leadEmail: string | null;
  leadActive: boolean;
  totalStaff: number;
};

export type AdminLeadAccount = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  active: boolean;
  role: "station_lead";
  operator: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  location: string;
};

export type AdminPersonAccount = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  active: boolean;
  role: "station_lead" | "station_staff";
  operator: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  location: string;
  online: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
};

export type OperatorControlLocks = {
  bookingsLocked: boolean;
  staffOpsLocked: boolean;
  leadOpsLocked: boolean;
};

export type OperatorControlSettings = {
  smsAlertsEnabled: boolean;
  emailDigestEnabled: boolean;
  requireLeadApprovalForStaff: boolean;
  maintenanceBanner: string;
};

export type OperatorControlAuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  severity: "info" | "warning" | "critical";
};

export type OperatorControlsPayload = OperatorControlLocks &
  OperatorControlSettings & {
    operator: Operator;
    configured: boolean;
    audit: OperatorControlAuditEntry[];
  };

export type AdminReportColumn = { key: string; label: string };
export type AdminReportRow = Record<string, string | number | null | undefined>;
export type AdminReportSummaryMetric = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type AdminReportResult = {
  columns: AdminReportColumn[];
  rows: AdminReportRow[];
  summary: AdminReportSummaryMetric[];
};

export type UpsertLeadResult = {
  lead: AdminLeadAccount;
  smsSent: boolean;
};

export async function adminLoginApi(email: string, password: string): Promise<AdminSession> {
  return apiFetch<AdminSession>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function adminLogoutApi(): Promise<void> {
  await apiFetch("/admin/logout", { method: "POST" });
}

export async function fetchAdminSession(): Promise<AdminSession> {
  return apiFetch<AdminSession>("/admin/session");
}

export async function completeAdminSetupApi(operator: string): Promise<{
  ok: boolean;
  settings: OperatorControlsPayload;
  admin: AdminSession["admin"];
}> {
  return apiFetch("/admin/setup/complete", {
    method: "POST",
    body: JSON.stringify({ operator }),
  });
}

export async function fetchAdminOverview(): Promise<AdminNetworkOverview> {
  return apiFetch<AdminNetworkOverview>("/admin/overview");
}

export async function fetchAdminParcels(filters?: {
  q?: string;
  status?: string;
  city?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<AdminParcelListResult> {
  const params = new URLSearchParams();
  if (filters?.q?.trim()) params.set("q", filters.q.trim());
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.city && filters.city !== "all") params.set("city", filters.city);
  if (filters?.branchId && filters.branchId !== "all") params.set("branchId", filters.branchId);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiFetch<AdminParcelListResult>(`/admin/parcels${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminStations(): Promise<AdminStationRow[]> {
  return apiFetch<AdminStationRow[]>("/admin/stations");
}

export async function fetchAdminLeads(): Promise<AdminLeadAccount[]> {
  return apiFetch<AdminLeadAccount[]>("/admin/leads");
}

export async function upsertAdminLeadApi(body: {
  stationId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
}): Promise<UpsertLeadResult> {
  return apiFetch<UpsertLeadResult>("/admin/leads", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removeAdminLeadApi(stationId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/admin/leads/${encodeURIComponent(stationId)}`, {
    method: "DELETE",
  });
}

export async function sendAdminLeadCredentialsApi(
  stationId: string,
): Promise<UpsertLeadResult> {
  return apiFetch<UpsertLeadResult>(
    `/admin/leads/${encodeURIComponent(stationId)}/send-credentials`,
    { method: "POST" },
  );
}

export async function fetchAdminPeople(q?: string): Promise<AdminPersonAccount[]> {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return apiFetch<AdminPersonAccount[]>(`/admin/people${query}`);
}

export async function setAdminPersonActiveApi(
  id: string,
  active: boolean,
): Promise<AdminPersonAccount> {
  return apiFetch<AdminPersonAccount>(`/admin/people/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function fetchOperatorControls(): Promise<OperatorControlsPayload> {
  return apiFetch<OperatorControlsPayload>("/admin/operator-controls");
}

export async function patchOperatorLocksApi(
  locks: Partial<OperatorControlLocks>,
): Promise<OperatorControlsPayload> {
  return apiFetch<OperatorControlsPayload>("/admin/operator-controls/locks", {
    method: "PATCH",
    body: JSON.stringify(locks),
  });
}

export async function patchOperatorSettingsApi(
  settings: Partial<OperatorControlSettings>,
): Promise<OperatorControlsPayload> {
  return apiFetch<OperatorControlsPayload>("/admin/operator-controls/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

/** Public lock status for staff/lead banners and booking gate (no HQ cookie required). */
export async function fetchOperatorLockStatus(
  operator: string,
): Promise<OperatorControlLocks & { operator: string; maintenanceBanner: string }> {
  return apiFetch(
    `/admin/operator-controls/status?operator=${encodeURIComponent(operator)}`,
  );
}

export async function fetchAdminReport(
  moduleId: string,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    city?: string;
    branchId?: string;
  },
): Promise<AdminReportResult> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.city && filters.city !== "all") params.set("city", filters.city);
  if (filters.branchId && filters.branchId !== "all") params.set("branchId", filters.branchId);
  const qs = params.toString();
  return apiFetch<AdminReportResult>(
    `/admin/reports/${encodeURIComponent(moduleId)}${qs ? `?${qs}` : ""}`,
  );
}
