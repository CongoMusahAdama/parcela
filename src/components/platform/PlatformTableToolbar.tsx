"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PlatformTableToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
  className?: string;
};

export function PlatformTableToolbar({
  value,
  onChange,
  placeholder = "Search this table…",
  resultCount,
  totalCount,
  className,
}: PlatformTableToolbarProps) {
  return (
    <div
      className={cn(
        "border-b border-stone-100 bg-stone-50/60 px-4 py-3 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-body w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-9 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {resultCount !== undefined && totalCount !== undefined ? (
          <p className="font-body shrink-0 text-xs text-stone-500">
            <span className="font-semibold text-stone-800">{resultCount}</span>
            {" of "}
            <span className="font-semibold text-stone-800">{totalCount}</span> rows
          </p>
        ) : null}
      </div>
    </div>
  );
}
