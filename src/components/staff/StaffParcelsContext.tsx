"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getNetworkErrorMessage } from "@/lib/network";
import {
  flushStaffMutationQueue,
  getStaffMutationQueue,
  subscribeStaffMutationQueue,
  type StaffQueuedMutation,
} from "@/lib/staff-mutation-queue";
import { fetchStaffParcels } from "@/lib/staff-api";
import { STAFF_PARCEL_CACHE_KEY } from "@/lib/operator-offline-state";
import type { StaffParcelSummary } from "@/types/staff-parcel";

const PARCEL_CACHE_KEY = STAFF_PARCEL_CACHE_KEY;

type StaffParcelsContextValue = {
  parcels: StaffParcelSummary[];
  loading: boolean;
  error: string | null;
  /** True when showing last successful sync because live fetch failed. */
  stale: boolean;
  online: boolean;
  pendingMutations: StaffQueuedMutation[];
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  flushQueue: () => Promise<void>;
};

const StaffParcelsContext = createContext<StaffParcelsContextValue | null>(null);

function readParcelCache(): StaffParcelSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PARCEL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StaffParcelSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeParcelCache(parcels: StaffParcelSummary[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PARCEL_CACHE_KEY, JSON.stringify(parcels));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function StaffParcelsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const online = useOnlineStatus();
  const [parcels, setParcels] = useState<StaffParcelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [pendingMutations, setPendingMutations] = useState<StaffQueuedMutation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const refreshInFlight = useRef(false);

  useEffect(() => {
    const cached = readParcelCache();
    if (cached.length > 0) {
      setParcels(cached);
      setStale(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => subscribeStaffMutationQueue(setPendingMutations), []);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await fetchStaffParcels();
      setParcels(data);
      writeParcelCache(data);
      setError(null);
      setStale(false);
    } catch (err) {
      const cached = readParcelCache();
      if (cached.length > 0) {
        setParcels(cached);
        setStale(true);
      }
      setError(getNetworkErrorMessage(err, "Could not load station parcels"));
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    const result = await flushStaffMutationQueue();
    if (result.synced > 0) {
      await refresh({ silent: true });
    }
  }, [refresh]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  useEffect(() => {
    function handleFocus() {
      void (async () => {
        if (getStaffMutationQueue().length > 0) {
          await flushStaffMutationQueue();
        }
        await refresh({ silent: true });
      })();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  const wasOnlineRef = useRef(online);
  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = online;
    // Only flush/refresh when connectivity returns (not on first mount).
    if (!online || wasOnline) return;
    void (async () => {
      if (getStaffMutationQueue().length > 0) {
        await flushStaffMutationQueue();
      }
      await refresh({ silent: true });
    })();
  }, [online, refresh]);

  const value = useMemo(
    () => ({
      parcels,
      loading,
      error,
      stale,
      online,
      pendingMutations,
      refresh,
      flushQueue,
    }),
    [parcels, loading, error, stale, online, pendingMutations, refresh, flushQueue],
  );

  return (
    <StaffParcelsContext.Provider value={value}>{children}</StaffParcelsContext.Provider>
  );
}

export function useStaffParcels() {
  const context = useContext(StaffParcelsContext);
  if (!context) {
    throw new Error("useStaffParcels must be used within StaffParcelsProvider");
  }
  return context;
}
