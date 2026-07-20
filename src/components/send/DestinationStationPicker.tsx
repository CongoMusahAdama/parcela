"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  MapPin,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { getOperatorLabel, operatorAccentColor } from "@/lib/operators";
import { searchStations } from "@/lib/stations";
import type { Station } from "@/types/parcel";
import { cn } from "@/lib/utils";

type DestinationStationPickerProps = {
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
  error?: string;
  transportOperator?: string;
  /** Sender drop-off city — shown last so receivers in other cities are easier to find. */
  originCity?: string;
};

type CityRow = {
  city: string;
  stations: Station[];
  isOriginCity: boolean;
};

function buildCityRows(
  stations: Station[],
  originCity?: string,
): CityRow[] {
  const origin = originCity?.trim().toLowerCase() ?? "";
  const byCity = new Map<string, Station[]>();
  for (const station of stations) {
    const city = station.city.trim() || "Other";
    const group = byCity.get(city) ?? [];
    group.push(station);
    byCity.set(city, group);
  }

  return Array.from(byCity.entries())
    .map(([city, rows]) => ({
      city,
      stations: [...rows].sort((a, b) => a.name.localeCompare(b.name)),
      isOriginCity: Boolean(origin) && city.toLowerCase() === origin,
    }))
    .sort((a, b) => {
      if (a.isOriginCity !== b.isOriginCity) return a.isOriginCity ? 1 : -1;
      return a.city.localeCompare(b.city);
    });
}

export function DestinationStationPicker({
  stations,
  value,
  onChange,
  error,
  transportOperator,
  originCity,
}: DestinationStationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = stations.find((s) => s.id === value);

  const networkCode =
    transportOperator?.trim().toUpperCase() ||
    stations[0]?.operator.trim().toUpperCase() ||
    "";
  const networkLabel = networkCode ? getOperatorLabel(networkCode) : "Partner";
  const accent = networkCode ? operatorAccentColor(networkCode) : "#0d9488";

  const cityRows = useMemo(
    () => buildCityRows(stations, originCity),
    [stations, originCity],
  );

  const searched = useMemo(() => searchStations(query, stations), [query, stations]);

  const isSearching = query.trim().length > 0;

  const stationsInCity = useMemo(() => {
    if (!activeCity) return [];
    return stations
      .filter((s) => s.city.trim().toLowerCase() === activeCity.toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stations, activeCity]);

  const searchCityGroups = useMemo(() => {
    if (!isSearching) return [];
    return buildCityRows(searched, originCity);
  }, [isSearching, searched, originCity]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (activeCity && !isSearching) setActiveCity(null);
        else setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeCity, isSearching]);

  function openPicker() {
    setQuery("");
    setActiveCity(selected?.city.trim() || null);
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
    setQuery("");
    setActiveCity(null);
  }

  function pickStation(stationId: string) {
    onChange(stationId);
    closePicker();
  }

  function clearSearch() {
    setQuery("");
  }

  const showCityList = !isSearching && !activeCity;
  const showCityStations = !isSearching && Boolean(activeCity);

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2.5 flex items-start gap-2.5">
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}18` }}
        >
          <MapPin className="size-4" style={{ color: accent }} />
        </span>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="destination-picker-trigger"
            className="font-display block text-[13px] font-bold text-foreground"
          >
            Collection location
          </label>
          <p className="font-body text-[11px] leading-snug text-muted">
            City and station where the receiver picks up
          </p>
        </div>
      </div>

      <button
        id="destination-picker-trigger"
        type="button"
        onClick={openPicker}
        className={cn(
          "font-body flex w-full min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
          error
            ? "border-danger bg-danger/5"
            : selected
              ? "border-primary/35 bg-primary/[0.04]"
              : "border-dashed border-primary/40 bg-primary/[0.03] hover:border-primary/60",
        )}
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="min-w-0">
              <span className="font-display block truncate text-[13px] font-bold text-foreground">
                {selected.city}
              </span>
              <span className="font-body block truncate text-[12px] text-muted">
                {selected.name}
              </span>
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="font-display block text-[13px] font-semibold text-primary">
              Tap to choose city & station
            </span>
            <span className="font-body block text-[11px] text-muted">
              {stations.length} {networkLabel} location
              {stations.length === 1 ? "" : "s"}
            </span>
          </span>
        )}
        <ChevronRight
          className={cn("size-4 shrink-0", selected ? "text-primary" : "text-primary/70")}
        />
      </button>
      {error ? <p className="font-body mt-1.5 text-xs text-danger">{error}</p> : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-center bg-foreground/35 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Choose collection location"
        >
          <div className="flex h-full w-full max-w-[430px] flex-col bg-background shadow-[0_0_0_1px_rgb(15_23_42/0.06)]">
            <header className="z-10 shrink-0 border-b border-border bg-surface px-3 pb-3 pt-2 sm:px-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (showCityStations) setActiveCity(null);
                    else closePicker();
                  }}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
                  aria-label={showCityStations ? "Back to cities" : "Close"}
                >
                  {showCityStations ? (
                    <ArrowLeft className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-base font-bold tracking-tight text-foreground">
                    {showCityStations
                      ? activeCity
                      : isSearching
                        ? "Search results"
                        : "Where is the receiver?"}
                  </h2>
                  <p className="font-body text-[11px] text-muted">
                    {showCityStations
                      ? `Pick the ${networkLabel} station for collection`
                      : isSearching
                        ? `${searched.length} match${searched.length === 1 ? "" : "es"}`
                        : `Step 1 · Choose their city (${cityRows.length})`}
                  </p>
                </div>
              </div>

              <div className="relative mt-2.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim()) setActiveCity(null);
                  }}
                  placeholder="Search city or station name…"
                  aria-label="Search collection locations"
                  className="font-body h-11 w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none placeholder:text-muted/60 focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </header>

            <div className="mobile-scroll min-h-0 flex-1 bg-background px-3 pb-8 pt-3 sm:px-4">
              {stations.length === 0 ? (
                <EmptyState
                  title="Loading locations…"
                  subtitle={`Fetching ${networkLabel} branches`}
                />
              ) : isSearching ? (
                searched.length === 0 ? (
                  <EmptyState
                    title="No locations found"
                    subtitle="Try a city name like Kumasi or Accra"
                    actionLabel="Clear search"
                    onAction={clearSearch}
                  />
                ) : (
                  <div className="space-y-4">
                    {searchCityGroups.map((row) => (
                      <section key={row.city}>
                        <CityHeading city={row.city} count={row.stations.length} />
                        <ul className="mt-1.5 grid gap-2">
                          {row.stations.map((station) => (
                            <li key={station.id}>
                              <StationPickRow
                                station={station}
                                selected={station.id === value}
                                accent={accent}
                                onSelect={() => pickStation(station.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )
              ) : showCityList ? (
                <ul className="grid gap-2">
                  {cityRows.map((row) => (
                    <li key={row.city}>
                      <button
                        type="button"
                        onClick={() => {
                          if (row.stations.length === 1) {
                            pickStation(row.stations[0].id);
                            return;
                          }
                          setActiveCity(row.city);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3.5 text-left transition-colors hover:border-primary/35 active:scale-[0.99]"
                      >
                        <span
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${accent}14` }}
                        >
                          <MapPin className="size-5" style={{ color: accent }} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-display flex flex-wrap items-center gap-2 text-[15px] font-bold text-foreground">
                            {row.city}
                            {row.isOriginCity ? (
                              <span className="font-body rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-border">
                                Drop-off city
                              </span>
                            ) : null}
                          </span>
                          <span className="font-body mt-0.5 block text-[12px] text-muted">
                            {row.stations.length === 1
                              ? row.stations[0].name
                              : `${row.stations.length} stations — tap to choose`}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : showCityStations ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveCity(null)}
                    className="font-display mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary"
                  >
                    <ArrowLeft className="size-3.5" />
                    All cities
                  </button>
                  <ul className="grid gap-2">
                    {stationsInCity.map((station) => (
                      <li key={station.id}>
                        <StationPickRow
                          station={station}
                          selected={station.id === value}
                          accent={accent}
                          onSelect={() => pickStation(station.id)}
                          showAddress
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CityHeading({ city, count }: { city: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {city}
      </h3>
      <span className="h-px flex-1 bg-border/70" aria-hidden />
      <span className="font-body text-[10px] text-muted">{count}</span>
    </div>
  );
}

function StationPickRow({
  station,
  selected,
  accent,
  onSelect,
  showAddress = false,
}: {
  station: Station;
  selected: boolean;
  accent: string;
  onSelect: () => void;
  showAddress?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors active:scale-[0.99]",
        selected
          ? "border-primary/45 bg-primary/[0.06]"
          : "border-border bg-surface hover:border-primary/30",
      )}
    >
      <span
        className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "font-display block text-[14px] font-bold leading-snug",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {station.name}
        </span>
        {showAddress && station.address?.trim() ? (
          <span className="font-body mt-1 block text-[12px] leading-snug text-muted">
            {station.address}
          </span>
        ) : (
          <span className="font-body mt-0.5 block text-[12px] text-muted">{station.city}</span>
        )}
        {showAddress && station.hours?.trim() ? (
          <span className="font-body mt-1 block text-[11px] text-muted/80">
            Hours: {station.hours}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
      ) : (
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted/50" />
      )}
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center">
      <SearchX className="size-7 text-muted/50" />
      <p className="font-display mt-3 font-semibold text-foreground">{title}</p>
      <p className="font-body mt-1 text-sm text-muted">{subtitle}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="font-display mt-3 text-sm font-semibold text-primary"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
