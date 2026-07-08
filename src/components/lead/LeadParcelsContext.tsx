"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchLeadParcels } from "@/lib/lead-api";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type LeadParcelsContextValue = {
  parcels: StaffParcelSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const LeadParcelsContext = createContext<LeadParcelsContextValue | null>(null);

export function LeadParcelsProvider({
  demoToken,
  children,
}: {
  demoToken?: string;
  children: React.ReactNode;
}) {
  const [parcels, setParcels] = useState<StaffParcelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchLeadParcels(demoToken);
      setParcels(data);
    } catch (err) {
      setParcels([]);
      setError(err instanceof Error ? err.message : "Could not load branch parcels");
    } finally {
      setLoading(false);
    }
  }, [demoToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      void refresh({ silent: true });
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  const value = useMemo(
    () => ({ parcels, loading, error, refresh }),
    [parcels, loading, error, refresh],
  );

  return (
    <LeadParcelsContext.Provider value={value}>{children}</LeadParcelsContext.Provider>
  );
}

export function useLeadParcels() {
  const context = useContext(LeadParcelsContext);
  if (!context) {
    throw new Error("useLeadParcels must be used within LeadParcelsProvider");
  }
  return context;
}
