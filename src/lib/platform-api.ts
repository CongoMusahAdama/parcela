import { apiFetch } from "@/lib/api-client";
import type {
  PlatformAuditRow,
  PlatformHqAdminRow,
  PlatformOperatorRow,
  PlatformRenewalReminder,
  PlatformUserRow,
} from "@/lib/platform-demo";
import type { PlatformSession } from "@/types/platform";

export type PlatformWorkspaceStats = {
  operatorsTotal: number;
  operatorsConfigured: number;
  operatorsConfigure: number;
  hqAdminsActive: number;
  hqAdminsPending: number;
  usersTotal: number;
  usersActive: number;
  stationsSeeded: number;
};

export type PlatformWorkspace = {
  operators: PlatformOperatorRow[];
  hqAdmins: PlatformHqAdminRow[];
  users: PlatformUserRow[];
  audit: PlatformAuditRow[];
  stats: PlatformWorkspaceStats;
};

export type PlatformCredentialResult = {
  ok: boolean;
  temporaryPassword: string;
  phone: string;
  smsSent: boolean;
};

export type CreateTransportOperatorResult = PlatformOperatorRow & {
  hqSmsSent?: boolean;
  hqTemporaryPassword?: string;
};

export type OperatorReminderResult = PlatformOperatorRow & {
  renewalSmsSent?: boolean;
};

export type OperatorLetterResult = PlatformOperatorRow & {
  letterSmsSent?: boolean;
};

export type DeleteTransportOperatorResult = {
  ok: boolean;
  operatorId: string;
  operatorCode: string;
  operatorName: string;
  removed: {
    staffAccounts: number;
    stations: number;
    parcels: number;
    operatorSettings: number;
  };
};

export type OperatorTerminalInput = {
  name: string;
  city: string;
};

export type OperatorTerminalRow = {
  id: string;
  name: string;
  city: string;
  code: string;
};

export type AddOperatorTerminalsResult = PlatformOperatorRow & {
  created: number;
  skipped: number;
};

export type CreateTransportOperatorPayload = {
  name: string;
  code: string;
  region: string;
  contactEmail?: string;
  contactPhone?: string;
  brandColor?: string;
  logoDataUrl?: string | null;
  cityCount: number;
  stationCount: number;
  terminals?: OperatorTerminalInput[];
  notes?: string;
  agreementDate: string;
  hqName: string;
  hqEmail: string;
  hqPhone?: string;
  issueLoginsNow?: boolean;
  subscriptionPlan: 'annual' | 'trial';
  subscriptionDuration: string;
  subscriptionPaidAt?: string;
  subscriptionAmountGhs?: number;
};

export type UpdateTransportOperatorPayload = {
  name?: string;
  region?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  brandColor?: string;
  logoDataUrl?: string | null;
  notes?: string;
  agreementDate?: string;
  status?: PlatformOperatorRow['status'];
  hqConfigured?: boolean;
  subscriptionPlan?: 'annual' | 'trial' | null;
  subscriptionPaidAt?: string;
  subscriptionExpiresAt?: string;
  subscriptionAmountGhs?: number;
};

export async function platformLoginApi(email: string, password: string): Promise<PlatformSession> {
  return apiFetch<PlatformSession>("/platform/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function platformLogoutApi(): Promise<void> {
  await apiFetch("/platform/logout", { method: "POST" });
}

export async function fetchPlatformSession(): Promise<PlatformSession> {
  return apiFetch<PlatformSession>("/platform/session");
}

export async function revokeAllPlatformSessionsApi(): Promise<{ ok: boolean; revokedAt: string }> {
  return apiFetch<{ ok: boolean; revokedAt: string }>("/platform/sessions/revoke-all", {
    method: "POST",
  });
}

export async function fetchPlatformWorkspace(): Promise<PlatformWorkspace> {
  return apiFetch<PlatformWorkspace>("/platform/workspace");
}

export async function fetchGhanaCitiesApi(): Promise<string[]> {
  return apiFetch<string[]>("/stations/cities/list");
}

export async function createTransportOperatorApi(
  payload: CreateTransportOperatorPayload,
): Promise<CreateTransportOperatorResult> {
  return apiFetch<CreateTransportOperatorResult>("/platform/operators", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTransportOperatorApi(
  operatorId: string,
  payload: UpdateTransportOperatorPayload,
): Promise<PlatformOperatorRow> {
  return apiFetch<PlatformOperatorRow>(`/platform/operators/${operatorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function markOperatorConfiguredApi(operatorId: string): Promise<PlatformOperatorRow> {
  return apiFetch<PlatformOperatorRow>(`/platform/operators/${operatorId}/mark-configured`, {
    method: "POST",
  });
}

export async function toggleOperatorSuspendApi(operatorId: string): Promise<PlatformOperatorRow> {
  return apiFetch<PlatformOperatorRow>(`/platform/operators/${operatorId}/toggle-suspend`, {
    method: "POST",
  });
}

export async function fetchOperatorTerminalsApi(
  operatorId: string,
): Promise<OperatorTerminalRow[]> {
  return apiFetch<OperatorTerminalRow[]>(`/platform/operators/${operatorId}/terminals`);
}

export async function addOperatorTerminalsApi(
  operatorId: string,
  terminals: OperatorTerminalInput[],
): Promise<AddOperatorTerminalsResult> {
  return apiFetch<AddOperatorTerminalsResult>(`/platform/operators/${operatorId}/terminals`, {
    method: "POST",
    body: JSON.stringify({ terminals }),
  });
}

export async function deleteTransportOperatorApi(
  operatorId: string,
): Promise<DeleteTransportOperatorResult> {
  return apiFetch<DeleteTransportOperatorResult>(
    `/platform/operators/${operatorId}/remove`,
    {
      method: "POST",
    },
  );
}

export async function sendRenewalReminderApi(
  operatorId: string,
  reminder: PlatformRenewalReminder,
): Promise<OperatorReminderResult> {
  return apiFetch<OperatorReminderResult>(`/platform/operators/${operatorId}/renewal-reminder`, {
    method: "POST",
    body: JSON.stringify({ reminder }),
  });
}

export async function recordConfigurationLetterApi(
  operatorId: string,
  agreementDate?: string,
): Promise<OperatorLetterResult> {
  return apiFetch<OperatorLetterResult>(`/platform/operators/${operatorId}/configuration-letter`, {
    method: "POST",
    body: JSON.stringify({ agreementDate }),
  });
}

export async function updateHqAdminApi(
  accountId: string,
  payload: Partial<Pick<PlatformHqAdminRow, "displayName" | "email" | "phone" | "status">>,
): Promise<PlatformHqAdminRow> {
  return apiFetch<PlatformHqAdminRow>(`/platform/hq-admins/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function issueHqCredentialsApi(accountId: string): Promise<PlatformCredentialResult> {
  return apiFetch<PlatformCredentialResult>(`/platform/hq-admins/${accountId}/issue-credentials`, {
    method: "POST",
  });
}

export async function resetHqPasswordApi(accountId: string): Promise<PlatformCredentialResult> {
  return apiFetch<PlatformCredentialResult>(`/platform/hq-admins/${accountId}/reset-password`, {
    method: "POST",
  });
}

export type DeleteHqAdminResult = {
  ok: boolean;
  id: string;
  email: string;
  operatorCode: string;
};

export async function deleteHqAdminApi(accountId: string): Promise<DeleteHqAdminResult> {
  return apiFetch<DeleteHqAdminResult>(`/platform/hq-admins/${accountId}/remove`, {
    method: "POST",
  });
}

export async function updatePlatformUserApi(
  accountId: string,
  payload: Partial<Pick<PlatformUserRow, "displayName" | "email" | "phone" | "status">>,
): Promise<PlatformUserRow> {
  return apiFetch<PlatformUserRow>(`/platform/users/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function resetPlatformUserLoginApi(accountId: string): Promise<PlatformCredentialResult> {
  return apiFetch<PlatformCredentialResult>(`/platform/users/${accountId}/reset-login`, {
    method: "POST",
  });
}

export type PlatformNotificationAudience = "staff" | "general";

export type PlatformNotificationRow = {
  id: string;
  title: string;
  body: string;
  audience: PlatformNotificationAudience;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  actorEmail: string | null;
  sentAt: string;
};

export async function listPlatformNotificationsApi(): Promise<PlatformNotificationRow[]> {
  return apiFetch<PlatformNotificationRow[]>("/platform/notifications");
}

export async function sendPlatformNotificationApi(payload: {
  title: string;
  body: string;
  audience: PlatformNotificationAudience;
}): Promise<PlatformNotificationRow> {
  return apiFetch<PlatformNotificationRow>("/platform/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
