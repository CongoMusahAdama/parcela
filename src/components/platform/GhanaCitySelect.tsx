"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { GHANA_CITIES } from "@/lib/ghana-cities";
import { fetchGhanaCitiesApi } from "@/lib/platform-api";
import { cn } from "@/lib/utils";

type GhanaCitySelectProps = {
  id?: string;
  value: string;
  onChange: (city: string) => void;
  className?: string;
  disabled?: boolean;
};

export function GhanaCitySelect({
  id,
  value,
  onChange,
  className,
  disabled = false,
}: GhanaCitySelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<string[]>([...GHANA_CITIES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchGhanaCitiesApi();
        if (!cancelled && rows.length > 0) setCities(rows);
      } catch {
        // keep static fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => city.toLowerCase().includes(q));
  }, [cities, query]);

  const displayValue = value || "Select city";

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "font-body flex w-full items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]",
          !value && "text-stone-400",
          value && "text-stone-900",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="truncate">{loading && !value ? "Loading cities…" : displayValue}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-stone-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Ghana cities…"
                className="font-body w-full rounded-lg border border-stone-200 py-2 pl-8 pr-3 text-sm text-stone-900 outline-none focus:border-[var(--platform-orange)]"
                autoFocus
              />
            </div>
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
            aria-label="Ghana cities"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-stone-500">No cities match your search.</li>
            ) : (
              filtered.map((city) => {
                const selected = city === value;
                return (
                  <li key={city} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(city);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "font-body flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50",
                        selected && "bg-[var(--platform-orange-soft)] font-semibold text-[var(--platform-orange-dark)]",
                      )}
                    >
                      {city}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
