"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
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

const selectClass =
  "font-body w-full appearance-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-stone-900 outline-none transition-colors focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export function GhanaCitySelect({
  id,
  value,
  onChange,
  className,
  disabled = false,
}: GhanaCitySelectProps) {
  const [cities, setCities] = useState<string[]>([...GHANA_CITIES]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchGhanaCitiesApi();
        if (!cancelled && rows.length > 0) setCities(rows);
      } catch {
        // keep static fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(selectClass, !value && "text-stone-400", className)}
        aria-label="City"
      >
        <option value="" disabled>
          Select city
        </option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
      />
    </div>
  );
}
