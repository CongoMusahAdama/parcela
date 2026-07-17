"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAdminLeads,
  fetchAdminOverview,
  fetchAdminPeople,
  fetchAdminStations,
  type AdminLeadAccount,
  type AdminPersonAccount,
  type AdminStationRow,
} from "@/lib/admin-api";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import type { AdminNetworkOverview } from "@/types/admin";

const EMPTY_OVERVIEW: AdminNetworkOverview = {
  operatorLabel: "Operator",
  branchCount: 0,
  activeLeads: 0,
  activeStaff: 0,
  totalParcels: 0,
  totalCollected: 0,
  inTransit: 0,
  readyForCollection: 0,
  alerts: [],
  branches: [],
};

type AdminDataContextValue = {
  overview: AdminNetworkOverview;
  stations: AdminStationRow[];
  leads: AdminLeadAccount[];
  people: AdminPersonAccount[];
  coreLoading: boolean;
  peopleLoading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshCore: (options?: { silent?: boolean }) => Promise<void>;
  refreshPeople: (options?: { silent?: boolean }) => Promise<void>;
  refreshAll: (options?: { silent?: boolean }) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return ctx;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdminSession();
  const operator = admin.operator;

  const [overview, setOverview] = useState<AdminNetworkOverview>(EMPTY_OVERVIEW);
  const [stations, setStations] = useState<AdminStationRow[]>([]);
  const [leads, setLeads] = useState<AdminLeadAccount[]>([]);
  const [people, setPeople] = useState<AdminPersonAccount[]>([]);
  const [coreLoading, setCoreLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coreInFlight = useRef(false);
  const peopleInFlight = useRef(false);
  const peopleLoaded = useRef(false);

  const refreshCore = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!operator) {
        setOverview(EMPTY_OVERVIEW);
        setStations([]);
        setLeads([]);
        setCoreLoading(false);
        return;
      }
      if (coreInFlight.current) return;
      coreInFlight.current = true;
      if (!options?.silent) setCoreLoading(true);
      else setRefreshing(true);
      try {
        const [nextOverview, nextStations, nextLeads] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminStations(),
          fetchAdminLeads(),
        ]);
        setOverview(nextOverview);
        setStations(nextStations);
        setLeads(nextLeads);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load HQ data");
      } finally {
        coreInFlight.current = false;
        setCoreLoading(false);
        setRefreshing(false);
      }
    },
    [operator],
  );

  const refreshPeople = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!operator) {
        setPeople([]);
        peopleLoaded.current = false;
        return;
      }
      if (peopleInFlight.current) return;
      peopleInFlight.current = true;
      if (!options?.silent) setPeopleLoading(true);
      else setRefreshing(true);
      try {
        const nextPeople = await fetchAdminPeople();
        setPeople(nextPeople);
        peopleLoaded.current = true;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load people");
      } finally {
        peopleInFlight.current = false;
        setPeopleLoading(false);
        setRefreshing(false);
      }
    },
    [operator],
  );

  const refreshAll = useCallback(
    async (options?: { silent?: boolean }) => {
      await Promise.all([refreshCore(options), refreshPeople(options)]);
    },
    [refreshCore, refreshPeople],
  );

  useEffect(() => {
    peopleLoaded.current = false;
    setPeople([]);
    void refreshCore();
  }, [refreshCore]);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      overview,
      stations,
      leads,
      people,
      coreLoading,
      peopleLoading,
      refreshing,
      error,
      refreshCore,
      refreshPeople,
      refreshAll,
    }),
    [
      overview,
      stations,
      leads,
      people,
      coreLoading,
      peopleLoading,
      refreshing,
      error,
      refreshCore,
      refreshPeople,
      refreshAll,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

/** Load people directory once when a view mounts (lazy). */
export function useEnsureAdminPeople() {
  const { people, peopleLoading, refreshPeople } = useAdminData();
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current || people.length > 0 || peopleLoading) return;
    requested.current = true;
    void refreshPeople();
  }, [people.length, peopleLoading, refreshPeople]);
}
