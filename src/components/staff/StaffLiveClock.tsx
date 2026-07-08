"use client";

import { useEffect, useState } from "react";
import { formatStaffLiveDate, formatStaffLiveTime } from "@/lib/staff-auth";

export function StaffLiveClock({
  className,
  variant = "dark",
  compact = false,
}: {
  className?: string;
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateClass =
    variant === "light"
      ? "font-body text-[10px] font-medium uppercase tracking-[0.12em] text-muted sm:text-[11px]"
      : "font-body text-[10px] font-medium uppercase tracking-[0.12em] text-white/75 sm:text-[11px]";

  const timeClass = compact
    ? "font-display mt-0.5 text-xl font-bold tabular-nums tracking-tight text-[var(--staff-accent)] sm:mt-1 sm:text-3xl"
    : "font-display mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--staff-accent)] sm:text-3xl";

  return (
    <div className={className} aria-live="polite" aria-atomic="true">
      <p className={dateClass}>{formatStaffLiveDate(now)}</p>
      <p className={timeClass}>{formatStaffLiveTime(now)}</p>
    </div>
  );
}
