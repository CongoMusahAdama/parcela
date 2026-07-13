"use client";

import { useEffect, useState } from "react";
import { SendStationsView } from "@/components/send/SendStationsView";
import { AppShell } from "@/components/ui/AppShell";
import { ensureOperatorBrandingLoaded } from "@/lib/operators";
import { ensureStationsLoaded } from "@/lib/stations";
import type { Station } from "@/types/parcel";

export default function SendStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ensureStationsLoaded(), ensureOperatorBrandingLoaded()])
      .then(([rows]) => setStations(rows))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell className="flex min-h-dvh flex-col !px-0 !pt-0">
        <div className="animate-pulse px-5 py-4">
          <div className="h-4 w-12 rounded bg-border" />
          <div className="mx-auto mt-3 h-[200px] max-w-[320px] rounded-xl bg-border" />
          <div className="mt-4 h-10 rounded-lg bg-border" />
          <div className="mt-3 space-y-2">
            <div className="h-16 rounded-xl bg-border" />
            <div className="h-16 rounded-xl bg-border" />
          </div>
        </div>
      </AppShell>
    );
  }

  return <SendStationsView stations={stations} />;
}
