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
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] flex-1 animate-pulse rounded-2xl bg-muted/20" />
    ),
  },
);

type SendStationsViewProps = {
  stations: Station[];
};

type OperatorFilterValue = "all" | string;
type ViewMode = "list" | "map";

export function SendStationsView({ stations: initialStations }: SendStationsViewProps) {
  const [query, setQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<OperatorFilterValue>("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const operatorFilters = useMemo(
    () => listOperatorFilterOptions(listStationOperatorCodes(initialStations)),
    [initialStations],
  );

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

  const isMap = viewMode === "map";

  return (
    <AppShell viewport>
      <header className="z-10 shrink-0 border-b border-border bg-surface px-5 pb-3 pt-2">
        <Link
          href="/"
          className="font-display mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        {!isMap ? <SendHeaderIllustration /> : null}

        <div className={cn(!isMap && "mt-3")}>
          <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Step 1 of 3
          </span>
          <h1 className="font-display mt-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Choose a station
          </h1>
          {!isMap ? (
            <p className="font-body mt-1 text-sm text-muted">
              Parcela drop-off stations across Ghana
            </p>
          ) : null}
        </div>

        {!isMap ? (
          <div className="mt-3">
            <SendWizardSteps current={1} />
          </div>
        ) : null}

        <div className="mt-3">
          <OperatorFilter
            value={operatorFilter}
            onChange={setOperatorFilter}
            options={operatorFilters}
          />
        </div>

        <div className="mt-3">
          <Input
            icon
            type="search"
            placeholder="Search by name, city, or code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search stations"
          />
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-xl bg-background p-1 ring-1 ring-border/60">
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
                viewMode === id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {!isMap ? (
          <p className="font-display mt-3 text-sm font-semibold text-foreground">
            {stations.length} station{stations.length !== 1 ? "s" : ""} found
          </p>
        ) : null}
      </header>

      <section className="flex min-h-0 flex-1 flex-col bg-background">
        {stations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 pb-6">
            <div className="w-full rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <SearchX className="mx-auto size-7 text-muted/50" />
              <p className="font-display mt-4 font-semibold text-foreground">No stations found</p>
              <p className="font-body mt-1 text-sm text-muted">
                Try another name, city, or transport service
              </p>
            </div>
          </div>
        ) : isMap ? (
          <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3">
            <p className="font-display mb-2 shrink-0 text-sm font-semibold text-foreground">
              {stations.length} station{stations.length !== 1 ? "s" : ""} on map
            </p>
            <div className="min-h-0 flex-1">
              <StationMapView stations={stations} userCoords={userCoords} />
            </div>
          </div>
        ) : (
          <div className="mobile-scroll min-h-0 flex-1 px-5 pb-6 pt-3">
            <div className="grid gap-2.5">
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  distanceKm={station.distanceKm}
                  href={`/send/book?station=${station.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
