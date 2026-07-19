"use client";

import { useEffect, useState } from "react";
import { formatStaffLiveDate, formatStaffLiveTime } from "@/lib/staff-auth";

export function StaffLiveClock({
  className,
  variant = "dark",
  compact = false,
  timeFirst = false,
  showDate = true,
}: {
  className?: string;
  variant?: "dark" | "light";
  compact?: boolean;
  /** Show the live time above the date label (e.g. hero header widgets). */
  timeFirst?: boolean;
  showDate?: boolean;
}) {
  // null until mount so SSR HTML matches the first client paint (avoids React #418)
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateClass =
    variant === "light"
      ? "font-body text-[10px] font-medium uppercase tracking-[0.12em] text-muted sm:text-[11px]"
      : "font-body text-[10px] font-medium uppercase tracking-[0.12em] text-white/75 sm:text-[11px]";

  const timeClass = compact
    ? "font-display mt-0.5 text-xl font-bold tabular-nums tracking-tight text-[var(--staff-accent)] sm:mt-1 sm:text-3xl"
    : "font-display mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--staff-accent)] sm:text-3xl";

  const dateLine = showDate ? (
    <p className={dateClass}>{now ? formatStaffLiveDate(now) : "\u00a0"}</p>
  ) : null;
  const timeLine = (
    <p className={timeClass}>{now ? formatStaffLiveTime(now) : "\u00a0"}</p>
  );

  return (
    <div className={className} aria-live="polite" aria-atomic="true">
      {timeFirst ? (
        <>
          {timeLine}
          {dateLine}
        </>
      ) : (
        <>
          {dateLine}
          {timeLine}
        </>
      )}
    </div>
  );
}
