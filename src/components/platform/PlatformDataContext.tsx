"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  PlatformAuditRow,
  PlatformHqAdminRow,
  PlatformOperatorRow,
  PlatformRenewalReminder,
  PlatformUserRow,
} from "@/lib/platform-demo";
import {
  addOperatorTerminalsApi,
  createTransportOperatorApi,
  deleteTransportOperatorApi,
  fetchOperatorTerminalsApi,
  fetchPlatformWorkspace,
  issueHqCredentialsApi,
  markOperatorConfiguredApi,
  recordConfigurationLetterApi,
  resetHqPasswordApi,
  resetPlatformUserLoginApi,
  sendRenewalReminderApi,
  toggleOperatorSuspendApi,
  updateHqAdminApi,
  updatePlatformUserApi,
  type AddOperatorTerminalsResult,
  type CreateTransportOperatorPayload,
  type DeleteTransportOperatorResult,
  type OperatorTerminalInput,
  type OperatorTerminalRow,
  type PlatformCredentialResult,
  type PlatformWorkspace,
  type PlatformWorkspaceStats,
} from "@/lib/platform-api";

type PlatformDataContextValue = {
  operators: PlatformOperatorRow[];
  hqAdmins: PlatformHqAdminRow[];
  users: PlatformUserRow[];
  audit: PlatformAuditRow[];
  stats: PlatformWorkspaceStats;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  createOperator: (payload: CreateTransportOperatorPayload) => Promise<PlatformOperatorRow & { hqSmsSent?: boolean }>;
  markConfigured: (operatorId: string) => Promise<PlatformOperatorRow>;
  toggleSuspend: (operatorId: string) => Promise<PlatformOperatorRow>;
  deleteOperator: (operatorId: string) => Promise<DeleteTransportOperatorResult>;
  fetchOperatorTerminals: (operatorId: string) => Promise<OperatorTerminalRow[]>;
  addOperatorTerminals: (
    operatorId: string,
    terminals: OperatorTerminalInput[],
  ) => Promise<AddOperatorTerminalsResult>;
  sendRenewalReminder: (
    operatorId: string,
    reminder: PlatformRenewalReminder,
  ) => Promise<PlatformOperatorRow & { renewalSmsSent?: boolean }>;
  recordConfigurationLetter: (
    operatorId: string,
    agreementDate?: string,
  ) => Promise<PlatformOperatorRow & { letterSmsSent?: boolean }>;
  updateHqAdmin: (
    accountId: string,
    payload: Partial<Pick<PlatformHqAdminRow, "displayName" | "email" | "phone" | "status">>,
  ) => Promise<PlatformHqAdminRow>;
  issueHqCredentials: (accountId: string) => Promise<PlatformCredentialResult>;
  resetHqPassword: (accountId: string) => Promise<PlatformCredentialResult>;
  updateUser: (
    accountId: string,
    payload: Partial<Pick<PlatformUserRow, "displayName" | "email" | "phone" | "status">>,
  ) => Promise<PlatformUserRow>;
  resetUserLogin: (accountId: string) => Promise<PlatformCredentialResult>;
  patchOperatorLocal: (
    operatorId: string,
    patch: Partial<PlatformOperatorRow>,
  ) => void;
};

const EMPTY_STATS: PlatformWorkspaceStats = {
  operatorsTotal: 0,
  operatorsConfigured: 0,
  operatorsConfigure: 0,
  hqAdminsActive: 0,
  hqAdminsPending: 0,
  usersTotal: 0,
  usersActive: 0,
  stationsSeeded: 0,
};

const PlatformDataContext = createContext<PlatformDataContextValue | null>(null);

function applyWorkspace(setters: {
  setOperators: (rows: PlatformOperatorRow[]) => void;
  setHqAdmins: (rows: PlatformHqAdminRow[]) => void;
  setUsers: (rows: PlatformUserRow[]) => void;
  setAudit: (rows: PlatformAuditRow[]) => void;
  setStats: (stats: PlatformWorkspaceStats) => void;
}, workspace: PlatformWorkspace) {
  setters.setOperators(workspace.operators);
  setters.setHqAdmins(workspace.hqAdmins);
  setters.setUsers(workspace.users);
  setters.setAudit(workspace.audit);
  setters.setStats(workspace.stats);
}

export function PlatformDataProvider({ children }: { children: ReactNode }) {
  const [operators, setOperators] = useState<PlatformOperatorRow[]>([]);
  const [hqAdmins, setHqAdmins] = useState<PlatformHqAdminRow[]>([]);
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [audit, setAudit] = useState<PlatformAuditRow[]>([]);
  const [stats, setStats] = useState<PlatformWorkspaceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const workspace = await fetchPlatformWorkspace();
      applyWorkspace(
        { setOperators, setHqAdmins, setUsers, setAudit, setStats },
        workspace,
      );
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load platform data");
      }
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const afterMutation = useCallback(
    (updatedOperator?: PlatformOperatorRow) => {
      if (updatedOperator) {
        setOperators((prev) =>
          prev.map((row) => (row.id === updatedOperator.id ? updatedOperator : row)),
        );
      }
      void refresh({ silent: true });
    },
    [refresh],
  );

  const value = useMemo<PlatformDataContextValue>(
    () => ({
      operators,
      hqAdmins,
      users,
      audit,
      stats,
      loading,
      refreshing,
      error,
      refresh,
      async createOperator(payload) {
        const row = await createTransportOperatorApi(payload);
        afterMutation(row);
        return row;
      },
      async markConfigured(operatorId) {
        const row = await markOperatorConfiguredApi(operatorId);
        afterMutation(row);
        return row;
      },
      async toggleSuspend(operatorId) {
        const row = await toggleOperatorSuspendApi(operatorId);
        afterMutation(row);
        return row;
      },
      async deleteOperator(operatorId) {
        const result = await deleteTransportOperatorApi(operatorId);
        setOperators((prev) => prev.filter((row) => row.id !== operatorId));
        void refresh({ silent: true });
        return result;
      },
      async fetchOperatorTerminals(operatorId) {
        return fetchOperatorTerminalsApi(operatorId);
      },
      async addOperatorTerminals(operatorId, terminals) {
        const row = await addOperatorTerminalsApi(operatorId, terminals);
        afterMutation(row);
        return row;
      },
      async sendRenewalReminder(operatorId, reminder) {
        const row = await sendRenewalReminderApi(operatorId, reminder);
        afterMutation(row);
        return row;
      },
      async recordConfigurationLetter(operatorId, agreementDate) {
        const row = await recordConfigurationLetterApi(operatorId, agreementDate);
        afterMutation(row);
        return row;
      },
      async updateHqAdmin(accountId, payload) {
        const row = await updateHqAdminApi(accountId, payload);
        void refresh({ silent: true });
        return row;
      },
      async issueHqCredentials(accountId) {
        const result = await issueHqCredentialsApi(accountId);
        void refresh({ silent: true });
        return result;
      },
      async resetHqPassword(accountId) {
        const result = await resetHqPasswordApi(accountId);
        void refresh({ silent: true });
        return result;
      },
      async updateUser(accountId, payload) {
        const row = await updatePlatformUserApi(accountId, payload);
        void refresh({ silent: true });
        return row;
      },
      async resetUserLogin(accountId) {
        const result = await resetPlatformUserLoginApi(accountId);
        void refresh({ silent: true });
        return result;
      },
      patchOperatorLocal(operatorId, patch) {
        setOperators((prev) =>
          prev.map((row) => (row.id === operatorId ? { ...row, ...patch } : row)),
        );
      },
    }),
    [
      operators,
      hqAdmins,
      users,
      audit,
      stats,
      loading,
      refreshing,
      error,
      refresh,
      afterMutation,
    ],
  );

  return <PlatformDataContext.Provider value={value}>{children}</PlatformDataContext.Provider>;
}

export function usePlatformData() {
  const context = useContext(PlatformDataContext);
  if (!context) {
    throw new Error("usePlatformData must be used within PlatformDataProvider");
  }
  return context;
}
