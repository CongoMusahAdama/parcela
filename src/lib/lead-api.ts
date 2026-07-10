import {
  LEAD_USE_DEMO_DATA,
  demoCreateLeadTeamMemberApi,
  demoDeleteLeadTeamMemberApi,
  demoFetchLeadBranchStations,
  demoFetchLeadParcels,
  demoFetchLeadSummary,
  demoFetchLeadTeam,
  demoLeadLoginApi,
  demoUpdateLeadTeamMemberApi,
} from "@/lib/lead-demo";
import { apiFetch } from "@/lib/api-client";
import type { BranchSummary, CreateTeamMemberResult, LeadSession, LeadTeamMember } from "@/types/lead";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import type { Station } from "@/types/parcel";

export type LeadBranchStations = {
  branchCity: string;
  stations: Station[];
};

function isDemoLeadToken(token?: string): boolean {
  return Boolean(token?.startsWith("demo-lead-"));
}

function shouldUseDemoLeadData(demoToken?: string): boolean {
  return LEAD_USE_DEMO_DATA || isDemoLeadToken(demoToken);
}

export async function leadLoginApi(phone: string, pin: string): Promise<LeadSession> {
  if (LEAD_USE_DEMO_DATA) {
    return demoLeadLoginApi(phone, pin);
  }

  return apiFetch<LeadSession>("/lead/login", {
    method: "POST",
    body: JSON.stringify({ phone, pin }),
  });
}

export async function leadLogoutApi(): Promise<void> {
  if (LEAD_USE_DEMO_DATA) return;
  try {
    await apiFetch("/lead/logout", { method: "POST" });
  } catch {
    // HQ demo sessions have no server cookie — ignore logout API failures.
  }
}

export async function fetchLeadSession(): Promise<LeadSession> {
  if (LEAD_USE_DEMO_DATA) {
    throw new Error("Session endpoint is not available in demo mode");
  }
  return apiFetch<LeadSession>("/lead/session");
}

export async function fetchLeadSummary(demoToken?: string): Promise<BranchSummary> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoFetchLeadSummary(demoToken);
  }
  return apiFetch<BranchSummary>("/lead/summary");
}

export async function fetchLeadParcels(demoToken?: string): Promise<StaffParcelSummary[]> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoFetchLeadParcels(demoToken);
  }
  return apiFetch<StaffParcelSummary[]>("/lead/parcels");
}

export async function fetchLeadTeam(demoToken?: string): Promise<LeadTeamMember[]> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoFetchLeadTeam(demoToken);
  }
  return apiFetch<LeadTeamMember[]>("/lead/team");
}

export async function fetchLeadBranchStations(demoToken?: string): Promise<LeadBranchStations> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoFetchLeadBranchStations(demoToken);
  }
  return apiFetch<LeadBranchStations>("/lead/stations");
}

export async function createLeadTeamMemberApi(
  body: { displayName: string; email: string; phone: string; stationId?: string },
  demoToken?: string,
): Promise<CreateTeamMemberResult> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoCreateLeadTeamMemberApi(demoToken, body);
  }
  return apiFetch<CreateTeamMemberResult>("/lead/team", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type UpdateTeamMemberBody = {
  displayName?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

export async function updateLeadTeamMemberApi(
  memberId: string,
  body: UpdateTeamMemberBody,
  demoToken?: string,
): Promise<LeadTeamMember> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoUpdateLeadTeamMemberApi(demoToken, memberId, body);
  }
  return apiFetch<LeadTeamMember>(`/lead/team/${encodeURIComponent(memberId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteLeadTeamMemberApi(
  memberId: string,
  demoToken?: string,
): Promise<{ ok: boolean; deletedId: string }> {
  if (shouldUseDemoLeadData(demoToken)) {
    if (!demoToken) throw new Error("Demo session required");
    return demoDeleteLeadTeamMemberApi(demoToken, memberId);
  }
  return apiFetch<{ ok: boolean; deletedId: string }>(
    `/lead/team/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
  );
}
