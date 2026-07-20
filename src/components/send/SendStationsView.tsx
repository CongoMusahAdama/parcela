"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, List, LocateFixed, Map, Search as SearchIcon, SearchX } from "lucide-react";
import { OperatorFilter } from "@/components/send/OperatorFilter";
import { StationCard } from "@/components/send/StationCard";
import { AppShell } from "@/components/ui/AppShell";
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

function groupStationsByCity(
  stations: StationRow[],
): Array<{ city: string; stations: StationRow[] }> {
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
  const searchParams = useSearchParams();
  const operatorFromUrl = (searchParams.get("operator") ?? "").trim().toUpperCase();

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
    if (!operatorFromUrl) return;
    const known = operatorFilters.some((opt) => opt.code === operatorFromUrl);
    if (known) setOperatorFilter(operatorFromUrl);
  }, [operatorFromUrl, operatorFilters]);

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
    return Array.from(new Set(filtered.map((s) => s.city.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
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
      {/* Compact sticky chrome — keep list viewport as tall as possible */}
      <header className="z-10 shrink-0 border-b border-border bg-surface px-3 pb-2 pt-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-base font-bold tracking-tight text-foreground">
              Choose a station
            </h1>
            <p className="font-body text-[11px] text-muted">
              Step 1 of 3 · {stations.length} available
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-background p-0.5 ring-1 ring-border/70">
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
                  "font-display inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                  viewMode === id
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground",
                )}
                aria-label={label}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {operatorFilters.length > 1 ? (
          <div className="mt-2">
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

        <div className="mt-2 flex gap-1.5">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search city or station…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCityFilter("all");
              }}
              aria-label="Search stations"
              className="font-body h-10 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted/60 focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleLocate()}
            disabled={locating}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
              userCoords
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
            aria-label="Sort by nearest stations"
            title="Near me"
          >
            <LocateFixed className={cn("size-4", locating && "animate-pulse")} />
          </button>
        </div>

        {cityOptions.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setCityFilter("all")}
              className={cn(
                "font-display shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
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
                  "font-display shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  cityFilter === city
                    ? "bg-foreground text-white"
                    : "bg-background text-muted hover:text-foreground",
                )}
              >
                {city}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <section className="flex min-h-0 flex-1 flex-col bg-background">
        {stations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 pb-6">
            <div className="w-full rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center">
              <SearchX className="mx-auto size-7 text-muted/50" />
              <p className="font-display mt-3 font-semibold text-foreground">No stations found</p>
              <p className="font-body mt-1 text-sm text-muted">Try another city or clear search</p>
              {(query || cityFilter !== "all" || operatorFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCityFilter("all");
                    setOperatorFilter("all");
                  }}
                  className="font-display mt-3 text-sm font-semibold text-primary"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : isMap ? (
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 sm:px-4">
            <div className="min-h-0 flex-1">
              <StationMapView stations={stations} userCoords={userCoords} />
            </div>
          </div>
        ) : (
          <div className="mobile-scroll min-h-0 flex-1 px-3 pb-6 pt-2 sm:px-4">
            <div className="space-y-3">
              {cityGroups.map(({ city, stations: cityStations }) => (
                <section key={city}>
                  <div className="sticky top-0 z-[1] -mx-1 mb-1.5 flex items-center gap-2 bg-background/95 px-1 py-1 backdrop-blur-sm">
                    <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                      {city}
                    </h2>
                    <span className="h-px flex-1 bg-border/70" aria-hidden />
                    <span className="font-body text-[10px] text-muted">{cityStations.length}</span>
                  </div>
                  <div className="grid gap-1.5">
                    {cityStations.map((station) => (
                      <StationCard
                        key={station.id}
                        station={station}
                        distanceKm={station.distanceKm}
                        href={`/send/book?station=${station.id}`}
                        highlighted={station.id === nearestId}
                        compact
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
