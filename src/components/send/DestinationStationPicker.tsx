"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { operatorAccentColor, SUPPORTED_OPERATORS } from "@/lib/operators";
import { filterStationsByOperator, searchStations } from "@/lib/stations";
import type { Operator, Station } from "@/types/parcel";
import { cn } from "@/lib/utils";

type DestinationStationPickerProps = {
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
  error?: string;
};

function stationLabel(station: Station) {
  return `${station.name}, ${station.city} · ${station.operator}`;
}

export function DestinationStationPicker({
  stations,
  value,
  onChange,
  error,
}: DestinationStationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<Operator | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = stations.find((s) => s.id === value);

  const filtered = useMemo(() => {
    const byOperator = filterStationsByOperator(stations, operator);
    return searchStations(query, byOperator);
  }, [stations, query, operator]);

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

  function pickStation(stationId: string) {
    onChange(stationId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div>
      <label
        htmlFor="destination-picker-trigger"
        className="font-display mb-2 block text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Destination station
      </label>
      <button
        id="destination-picker-trigger"
        type="button"
        onClick={() => {
          setQuery("");
          setOperator("all");
          setOpen(true);
        }}
        className={cn(
          "font-body flex w-full min-h-12 items-center justify-between gap-3 rounded-2xl border bg-background px-4 py-3 text-left text-base shadow-sm transition-all",
          error
            ? "border-danger focus:border-danger"
            : "border-border hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]"
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {selected ? (
            <>
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: operatorAccentColor(selected.operator) }}
              />
              <span className="truncate text-foreground">{stationLabel(selected)}</span>
            </>
          ) : (
            <span className="text-muted">Tap to choose a station</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </button>
      {error ? <p className="font-body mt-1 text-xs text-danger">{error}</p> : null}
      <p className="font-body mt-1.5 text-[11px] text-muted">
        Search by city or station name — no scrolling through the full list
      </p>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Choose destination station"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-6 pt-4 safe-top">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-foreground">Destination station</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or station..."
                className="font-body w-full min-h-12 rounded-2xl border border-border bg-surface py-3 pl-11 pr-10 text-base outline-none focus:border-primary"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {(["all", ...SUPPORTED_OPERATORS] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setOperator(op)}
                  className={cn(
                    "font-display rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    operator === op
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-muted hover:border-primary/30"
                  )}
                >
                  {op === "all" ? "All" : op}
                </button>
              ))}
            </div>

            <p className="font-body mb-2 text-[11px] text-muted">
              {filtered.length} station{filtered.length === 1 ? "" : "s"}
            </p>

            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <li className="flex flex-col items-center gap-2 py-12 text-center text-muted">
                  <MapPin className="size-8 opacity-40" />
                  <p className="font-body text-sm">No stations match your search</p>
                </li>
              ) : (
                filtered.map((station) => {
                  const isSelected = station.id === value;
                  return (
                    <li key={station.id}>
                      <button
                        type="button"
                        onClick={() => pickStation(station.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-surface hover:border-primary/30"
                        )}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: operatorAccentColor(station.operator) }}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "font-body block text-sm font-medium",
                              isSelected ? "text-primary" : "text-foreground"
                            )}
                          >
                            {station.name}
                          </span>
                          <span className="font-body block text-xs text-muted">
                            {station.city} · {station.operator}
                          </span>
                        </span>
                        {isSelected ? <Check className="size-5 shrink-0 text-primary" /> : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
