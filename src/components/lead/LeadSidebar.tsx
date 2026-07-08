"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut, MapPin, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { useStaffNav } from "@/components/staff/StaffNavContext";
import { LEAD_NAV_ITEMS } from "@/lib/lead-nav";
import { prefetchLeadView } from "@/lib/lead-view-prefetch";
import { cn } from "@/lib/utils";

type LeadSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void | Promise<void>;
};

export function LeadSidebar({ mobileOpen, onMobileClose, onSignOut }: LeadSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff } = useLeadSession();
  const { startNavigation } = useStaffNav();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    LEAD_NAV_ITEMS.forEach(({ href }) => {
      router.prefetch(href);
      prefetchLeadView(href);
    });
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const sidebar = (
    <div className="staff-sidebar-inner flex h-full flex-col text-white">
      <div className="border-b border-white/15 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <Logo
            size="sm"
            showWordmark
            className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert"
          />
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="font-body mt-2 text-[11px] font-medium text-white/70">Branch lead portal</p>
        <div className="staff-sidebar-station mt-4">
          <div className="staff-sidebar-station-card relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/18 via-white/10 to-white/5 p-3.5">
            <div className="relative flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
                <OperatorLogo operator={staff.operator} className="h-6 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  Your branch
                </p>
                <p className="font-display truncate text-sm font-bold text-white">
                  {staff.stationName}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                  <MapPin className="size-3 text-white/90" />
                  <span className="font-mono text-[10px] font-semibold text-white">
                    {staff.stationCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Branch lead navigation">
        <ul className="space-y-1">
          {LEAD_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const pending = pendingHref === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch
                  onMouseEnter={() => {
                    router.prefetch(href);
                    prefetchLeadView(href);
                  }}
                  onClick={() => {
                    if (pathname !== href && !pathname.startsWith(`${href}/`)) {
                      startNavigation(`Opening ${label.toLowerCase()}`);
                    }
                    setPendingHref(href);
                    onMobileClose();
                  }}
                  className={cn(
                    "font-display flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "staff-nav-active"
                      : "text-white/85 hover:bg-white/10 hover:text-white",
                    pending && !active && "bg-white/10 text-white",
                  )}
                >
                  {pending && !active ? (
                    <Loader2 className="size-[18px] shrink-0 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/15 p-4">
        <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
          <p className="font-display truncate text-sm font-semibold text-white">
            {staff.displayName}
          </p>
          <p className="font-body mt-0.5 text-xs text-white/75">Branch lead · {staff.operator}</p>
        </div>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="staff-sidebar-sign-out font-display mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={cn(
          "staff-sidebar lead-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(88vw,272px)] flex-col shadow-xl transition-transform duration-300 sm:w-[272px] lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ background: "var(--staff-header-gradient)" }}
      >
        {sidebar}
      </aside>
    </>
  );
}
