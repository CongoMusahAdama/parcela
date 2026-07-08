"use client";

import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";

export function StaffApiBanner() {
  const { error, loading, refresh, stale, online, pendingMutations, flushQueue } =
    useStaffParcels();

  const pendingCount = pendingMutations.length;
  const showOffline = !online;
  const showQueue = pendingCount > 0;
  const showError = Boolean(error) && online;

  if (!showOffline && !showQueue && !showError) return null;

  const tone = showOffline || showError ? "amber" : "sky";
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-sky-200 bg-sky-50 text-sky-950";
  const buttonClass =
    tone === "amber"
      ? "border-amber-300 bg-white text-amber-950"
      : "border-sky-300 bg-white text-sky-950";

  const title = showOffline
    ? "You are offline"
    : showError
      ? stale
        ? "Showing last synced parcels"
        : "Live data unavailable"
      : "Queued station actions";

  const detail = showOffline
    ? pendingCount > 0
      ? `${pendingCount} action${pendingCount === 1 ? "" : "s"} waiting to sync when the connection returns.`
      : "You can still review cached parcels. Verify, arrive, and release actions will queue until you are back online."
    : showError
      ? `${error}${stale ? " Cached station data is still available." : ""}`
      : `${pendingCount} action${pendingCount === 1 ? "" : "s"} will sync automatically. Tap retry if the connection is back.`;

  return (
    <div className={`border-b px-4 py-3 sm:px-6 ${toneClass}`}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {showOffline ? (
            <WifiOff className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CloudOff className="mt-0.5 size-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">{title}</p>
            <p className="font-body text-xs opacity-90">{detail}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading || !online}
          onClick={() => {
            void (async () => {
              await flushQueue();
              await refresh();
            })();
          }}
          className={`font-display inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-60 ${buttonClass}`}
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Syncing…" : showQueue ? "Retry sync" : "Retry"}
        </button>
      </div>
    </div>
  );
}
