"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useLeadParcels } from "@/components/lead/LeadParcelsContext";

export function LeadApiBanner() {
  const { error, loading, refresh } = useLeadParcels();

  if (!error) return null;

  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div>
            <p className="font-display text-sm font-bold text-red-900">Live data unavailable</p>
            <p className="font-body text-xs text-red-800">{error}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="font-display inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-900 disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>
    </div>
  );
}
