"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search, SearchX, X } from "lucide-react";
import { StationCard } from "@/components/send/StationCard";
import { getOperatorLabel, operatorAccentColor } from "@/lib/operators";
import { searchStations } from "@/lib/stations";
import type { Station } from "@/types/parcel";
import { cn } from "@/lib/utils";

type DestinationStationPickerProps = {
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
  error?: string;
  /** Operator code for the sender drop-off — destinations are that network’s branches. */
  transportOperator?: string;
};

function groupByCity(stations: Station[]): Array<{ city: string; stations: Station[] }> {
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
    }))
    .sort((a, b) => a.city.localeCompare(b.city));
}

export function DestinationStationPicker({
  stations,
  value,
  onChange,
  error,
  transportOperator,
}: DestinationStationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = stations.find((s) => s.id === value);

  const networkCode =
    transportOperator?.trim().toUpperCase() ||
    stations[0]?.operator.trim().toUpperCase() ||
    "";
  const networkLabel = networkCode ? getOperatorLabel(networkCode) : "Partner";

  const filtered = useMemo(() => {
    const searched = searchStations(query, stations);
    if (cityFilter === "all") return searched;
    return searched.filter((s) => s.city.trim().toLowerCase() === cityFilter.toLowerCase());
  }, [stations, query, cityFilter]);

  const cityOptions = useMemo(() => {
    const searched = searchStations(query, stations);
    return Array.from(new Set(searched.map((s) => s.city.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [stations, query]);

  const cityGroups = useMemo(() => groupByCity(filtered), [filtered]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openPicker() {
    setQuery("");
    setCityFilter("all");
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
    setQuery("");
  }

  function pickStation(stationId: string) {
    onChange(stationId);
    closePicker();
  }

  function clearFilters() {
    setQuery("");
    setCityFilter("all");
  }

  return (
    <div>
      <label
        htmlFor="destination-picker-trigger"
        className="font-display mb-2 block text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Where should the receiver collect?
      </label>
      <button
        id="destination-picker-trigger"
        type="button"
        onClick={openPicker}
        className={cn(
          "font-body flex w-full min-h-12 items-center justify-between gap-3 rounded-2xl border bg-background px-4 py-3 text-left text-base shadow-sm transition-all",
          error
            ? "border-danger focus:border-danger"
            : "border-border hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {selected ? (
            <>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${operatorAccentColor(selected.operator)}18` }}
              >
                <MapPin
                  className="size-4"
                  style={{ color: operatorAccentColor(selected.operator) }}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">{selected.name}</span>
                <span className="block truncate text-xs text-muted">
                  {selected.city} · {getOperatorLabel(selected.operator)}
                </span>
              </span>
            </>
          ) : (
            <span className="text-muted">Choose a {networkLabel} branch</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      {error ? <p className="font-body mt-1 text-xs text-danger">{error}</p> : null}
      <p className="font-body mt-1.5 text-[11px] text-muted">
        Browse every {networkLabel} branch — pick where the recipient will collect
      </p>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-center bg-foreground/30 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Choose receiver collection station"
        >
          <div className="flex h-full w-full max-w-[430px] flex-col bg-background shadow-[0_0_0_1px_rgb(15_23_42/0.06)]">
            <header className="z-10 shrink-0 border-b border-border bg-surface px-3 pb-2 pt-2 sm:px-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePicker}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display truncate text-base font-bold tracking-tight text-foreground">
                    {networkLabel} stations
                  </h2>
                  <p className="font-body text-[11px] text-muted">
                    Receiver collects here · {stations.length} branch
                    {stations.length === 1 ? "" : "es"}
                  </p>
                </div>
              </div>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCityFilter("all");
                  }}
                  placeholder="Search city or station…"
                  aria-label="Search destination stations"
                  className="font-body h-10 w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none placeholder:text-muted/60 focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
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

              <p className="font-body mt-2 text-[11px] text-muted">
                {filtered.length} station{filtered.length === 1 ? "" : "s"}
                {cityFilter !== "all" ? ` in ${cityFilter}` : " available"}
              </p>
            </header>

            <div className="mobile-scroll min-h-0 flex-1 bg-background px-3 pb-6 pt-2 sm:px-4">
              {stations.length === 0 ? (
                <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center">
                  <SearchX className="size-7 text-muted/50" />
                  <p className="font-display mt-3 font-semibold text-foreground">
                    Loading stations…
                  </p>
                  <p className="font-body mt-1 text-sm text-muted">
                    Fetching {networkLabel} branches
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center">
                  <SearchX className="size-7 text-muted/50" />
                  <p className="font-display mt-3 font-semibold text-foreground">No stations found</p>
                  <p className="font-body mt-1 text-sm text-muted">
                    Try another city or clear search
                  </p>
                  {(query || cityFilter !== "all") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-display mt-3 text-sm font-semibold text-primary"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {cityGroups.map(({ city, stations: cityStations }) => (
                    <section key={city}>
                      <div className="sticky top-0 z-[1] -mx-1 mb-1.5 flex items-center gap-2 bg-background/95 px-1 py-1 backdrop-blur-sm">
                        <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                          {city}
                        </h3>
                        <span className="h-px flex-1 bg-border/70" aria-hidden />
                        <span className="font-body text-[10px] text-muted">{cityStations.length}</span>
                      </div>
                      <div className="grid gap-1.5">
                        {cityStations.map((station) => (
                          <StationCard
                            key={station.id}
                            station={station}
                            compact
                            selected={station.id === value}
                            onSelect={() => pickStation(station.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
