"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, List, LocateFixed, Map, SearchX } from "lucide-react";
import { OperatorFilter } from "@/components/send/OperatorFilter";
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
type StationRow = Station & { distanceKm?: number };

function groupStationsByCity(stations: StationRow[]): Array<{ city: string; stations: StationRow[] }> {
  const byCity = new Map<string, StationRow[]>();
  for (const station of stations) {
    const city = station.city.trim() || "Other";
    const group = byCity.get(city) ?? [];
    group.push(station);
    byCity.set(city, group);
  }

  return Array.from(byCity.entries())
    .map(([city, rows]) => ({ city, stations: rows }))
    .sort((a, b) => {
      const aNear = a.stations[0]?.distanceKm;
      const bNear = b.stations[0]?.distanceKm;
      if (aNear != null && bNear != null) return aNear - bNear;
      if (aNear != null) return -1;
      if (bNear != null) return 1;
      return a.city.localeCompare(b.city);
    });
}

export function SendStationsView({ stations: initialStations }: SendStationsViewProps) {
  const [query, setQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<OperatorFilterValue>("all");
  const [cityFilter, setCityFilter] = useState<string | "all">("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const operatorFilters = useMemo(
    () => listOperatorFilterOptions(listStationOperatorCodes(initialStations)),
    [initialStations],
  );

  useEffect(() => {
    setUserCoords(getSendLocation());
  }, []);

  useEffect(() => {
    if (viewMode !== "map" || userCoords) return;
    void requestSendLocation().then((coords) => {
      if (coords) setUserCoords(coords);
    });
  }, [viewMode, userCoords]);

  const stations = useMemo(() => {
    const byOperator = filterStationsByOperator(initialStations, operatorFilter);
    const filtered = searchStations(query, byOperator);
    const byCity =
      cityFilter === "all"
        ? filtered
        : filtered.filter((s) => s.city.trim().toLowerCase() === cityFilter.toLowerCase());

    if (userCoords) {
      return sortStationsByDistance(byCity, userCoords.lat, userCoords.lng);
    }
    return sortStationsAlphabetically(byCity).map((s) => ({ ...s, distanceKm: undefined }));
  }, [query, userCoords, initialStations, operatorFilter, cityFilter]);

  const cityGroups = useMemo(() => groupStationsByCity(stations), [stations]);

  const cityOptions = useMemo(() => {
    const byOperator = filterStationsByOperator(initialStations, operatorFilter);
    const filtered = searchStations(query, byOperator);
    const cities = Array.from(
      new Set(filtered.map((s) => s.city.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return cities;
  }, [initialStations, operatorFilter, query]);

  const isMap = viewMode === "map";
  const nearestId = userCoords && stations[0] ? stations[0].id : null;

  async function handleLocate() {
    setLocating(true);
    try {
      const coords = await requestSendLocation();
      if (coords) setUserCoords(coords);
    } finally {
      setLocating(false);
    }
  }

  return (
    <AppShell viewport>
      <header className="z-10 shrink-0 border-b border-border bg-surface px-4 pb-3 pt-2 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="font-display rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Step 1 of 3
          </span>
        </div>

        <h1 className="font-display mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Choose a station
        </h1>
        <p className="font-body mt-1 text-sm text-muted">
          Pick where you will drop off your parcel
        </p>

        <div className="mt-3">
          <SendWizardSteps current={1} />
        </div>

        {operatorFilters.length > 1 ? (
          <div className="mt-3">
            <OperatorFilter
              value={operatorFilter}
              onChange={(value) => {
                setOperatorFilter(value);
                setCityFilter("all");
              }}
              options={operatorFilters}
            />
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              icon
              type="search"
              placeholder="Search city, station, or code…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCityFilter("all");
              }}
              aria-label="Search stations"
              className="min-h-11 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleLocate()}
            disabled={locating}
            className={cn(
              "font-display inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
              userCoords
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
            aria-label="Sort by nearest stations"
            title="Near me"
          >
            <LocateFixed className={cn("size-4.5 size-[18px]", locating && "animate-pulse")} />
          </button>
        </div>

        {cityOptions.length > 1 ? (
          <div className="mt-2.5 -mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-1.5">
              <button
                type="button"
                onClick={() => setCityFilter("all")}
                className={cn(
                  "font-display shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                  cityFilter === "all"
                    ? "bg-foreground text-white"
                    : "bg-background text-muted hover:text-foreground",
                )}
              >
                All cities
              </button>
              {cityOptions.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityFilter(city)}
                  className={cn(
                    "font-display shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                    cityFilter === city
                      ? "bg-foreground text-white"
                      : "bg-background text-muted hover:text-foreground",
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        ) : null}

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
      </header>

      <section className="flex min-h-0 flex-1 flex-col bg-background">
        {stations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 pb-6">
            <div className="w-full rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <SearchX className="mx-auto size-7 text-muted/50" />
              <p className="font-display mt-4 font-semibold text-foreground">No stations found</p>
              <p className="font-body mt-1 text-sm text-muted">
                Try another city name, or clear your filters
              </p>
              {(query || cityFilter !== "all" || operatorFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCityFilter("all");
                    setOperatorFilter("all");
                  }}
                  className="font-display mt-4 text-sm font-semibold text-primary"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : isMap ? (
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
            <p className="font-display mb-2 shrink-0 text-sm font-semibold text-foreground">
              {stations.length} station{stations.length !== 1 ? "s" : ""} on map
            </p>
            <div className="min-h-0 flex-1">
              <StationMapView stations={stations} userCoords={userCoords} />
            </div>
          </div>
        ) : (
          <div className="mobile-scroll min-h-0 flex-1 px-4 pb-8 pt-3 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-display text-sm font-semibold text-foreground">
                {stations.length} station{stations.length !== 1 ? "s" : ""}
                {userCoords ? " · nearest first" : ""}
              </p>
              {!userCoords ? (
                <button
                  type="button"
                  onClick={() => void handleLocate()}
                  className="font-display text-xs font-semibold text-primary"
                >
                  Sort by distance
                </button>
              ) : null}
            </div>

            <div className="space-y-5">
              {cityGroups.map(({ city, stations: cityStations }) => (
                <section key={city}>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                      {city}
                    </h2>
                    <span className="h-px flex-1 bg-border/80" aria-hidden />
                    <span className="font-body text-[11px] text-muted">
                      {cityStations.length}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {cityStations.map((station) => (
                      <StationCard
                        key={station.id}
                        station={station}
                        distanceKm={station.distanceKm}
                        href={`/send/book?station=${station.id}`}
                        highlighted={station.id === nearestId}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
