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
  getCachedOperatorLocks,
  loadOperatorLockStatus,
  type OperatorControlLocks,
} from "@/lib/operator-controls";

type OperatorLocksContextValue = {
  locks: OperatorControlLocks;
  loading: boolean;
  refresh: () => Promise<void>;
};

const OperatorLocksContext = createContext<OperatorLocksContextValue | null>(null);

const POLL_MS = 30_000;

export function OperatorLocksProvider({
  operator,
  children,
}: {
  operator: string;
  children: ReactNode;
}) {
  const [locks, setLocks] = useState<OperatorControlLocks>(() =>
    getCachedOperatorLocks(operator),
  );
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!operator || inFlight.current) return;
    inFlight.current = true;
    try {
      const next = await loadOperatorLockStatus(operator);
      setLocks(next);
    } catch {
      // Keep last known locks when the API is briefly unreachable.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [operator]);

  useEffect(() => {
    setLocks(getCachedOperatorLocks(operator));
    setLoading(true);
    void refresh();

    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [operator, refresh]);

  const value = useMemo(
    () => ({ locks, loading, refresh }),
    [locks, loading, refresh],
  );

  return (
    <OperatorLocksContext.Provider value={value}>{children}</OperatorLocksContext.Provider>
  );
}

export function useOperatorLocks() {
  const ctx = useContext(OperatorLocksContext);
  if (!ctx) {
    throw new Error("useOperatorLocks must be used within OperatorLocksProvider");
  }
  return ctx;
}

/** Safe read when provider may be absent (e.g. tests). */
export function useOptionalOperatorLocks() {
  return useContext(OperatorLocksContext);
}
