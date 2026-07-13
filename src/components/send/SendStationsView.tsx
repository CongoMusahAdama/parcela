"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, List, Map, SearchX } from "lucide-react";
import { OperatorFilter } from "@/components/send/OperatorFilter";
import { SendHeaderIllustration } from "@/components/send/SendHeaderIllustration";
import { SendWizardSteps } from "@/components/send/SendWizardSteps";
import { StationCard } from "@/components/send/StationCard";
import { AppShell } from "@/components/ui/AppShell";
import { Input } from "@/components/ui/Input";
import { getSendLocation, requestSendLocation } from "@/lib/sendLocation";
import {
  filterStationsByOperator,
  listStationOperatorCodes,
  searchStations,
  sortStationsAlphabetically,
  sortStationsByDistance,
} from "@/lib/stations";
import { listOperatorFilterOptions } from "@/lib/operators";
import type { Station } from "@/types/parcel";
import { cn } from "@/lib/utils";

const StationMapView = dynamic(
  () => import("@/components/send/StationMapView").then((m) => m.StationMapView),
  { ssr: false, loading: () => <div className="h-[min(50vh,360px)] min-h-[280px] animate-pulse rounded-2xl bg-muted/20" /> }
);

type SendStationsViewProps = {
  stations: Station[];
};

type OperatorFilterValue = "all" | string;
type ViewMode = "list" | "map";

function preferListOnMobile(): ViewMode {
  if (typeof window === "undefined") return "list";
  return window.matchMedia("(max-width: 640px)").matches ? "list" : "map";
}

export function SendStationsView({ stations: initialStations }: SendStationsViewProps) {
  const [query, setQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<OperatorFilterValue>("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const operatorFilters = useMemo(
    () => listOperatorFilterOptions(listStationOperatorCodes(initialStations)),
    [initialStations],
  );

  useEffect(() => {
    setViewMode(preferListOnMobile());
  }, []);

  useEffect(() => {
    setUserCoords(getSendLocation());
  }, []);

  useEffect(() => {
    if (viewMode !== "map" || userCoords) return;
    requestSendLocation().then((coords) => {
      if (coords) setUserCoords(coords);
    });
  }, [viewMode, userCoords]);

  const stations = useMemo(() => {
    const byOperator = filterStationsByOperator(initialStations, operatorFilter);
    const filtered = searchStations(query, byOperator);

    if (userCoords) {
      return sortStationsByDistance(filtered, userCoords.lat, userCoords.lng);
    }
    return sortStationsAlphabetically(filtered).map((s) => ({ ...s, distanceKm: undefined }));
  }, [query, userCoords, initialStations, operatorFilter]);

  return (
    <AppShell className="flex min-h-dvh flex-col !px-0 !pb-0 !pt-0">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        <header className="shrink-0 border-b border-border bg-surface px-5 pb-4 pt-2">
          <Link
            href="/"
            className="font-display mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>

          <SendHeaderIllustration />

          <div className="mt-3">
            <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Step 1 of 3
            </span>
            <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground">
              Choose a station
            </h1>
            <p className="font-body mt-1.5 text-sm text-muted">
              Parcela drop-off stations across Ghana
            </p>
          </div>

          <div className="mt-4">
            <SendWizardSteps current={1} />
          </div>

          <div className="mt-4">
            <OperatorFilter
              value={operatorFilter}
              onChange={setOperatorFilter}
              options={operatorFilters}
            />
          </div>

          <div className="mt-4">
            <Input
              icon
              type="search"
              placeholder="Search by name, city, or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search stations"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-background p-1 ring-1 ring-border/60">
            {(
              [
                { id: "list" as const, label: "List", Icon: List },
                { id: "map" as const, label: "Map", Icon: Map },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={cn(
                  "font-display flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors",
                  viewMode === id ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </header>

        <section className="px-5 pb-10 pt-4">
          <p className="font-display mb-3 text-sm font-semibold text-foreground">
            {stations.length} station{stations.length !== 1 ? "s" : ""} found
          </p>

          {stations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <SearchX className="mx-auto size-7 text-muted/50" />
              <p className="font-display mt-4 font-semibold text-foreground">No stations found</p>
              <p className="font-body mt-1 text-sm text-muted">
                Try another name, city, or transport service
              </p>
            </div>
          ) : viewMode === "map" ? (
            <div className="h-[min(50vh,360px)] min-h-[280px]">
              <StationMapView stations={stations} userCoords={userCoords} />
            </div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  distanceKm={station.distanceKm}
                  href={`/send/book?station=${station.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
