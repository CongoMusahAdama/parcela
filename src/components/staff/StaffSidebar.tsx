"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut, MapPin, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { useStaffNav } from "@/components/staff/StaffNavContext";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { STAFF_NAV_ITEMS, STAFF_NAV_SECTIONS } from "@/lib/staff-nav";
import { prefetchStaffView } from "@/lib/staff-view-prefetch";
import { cn } from "@/lib/utils";

type StaffSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void | Promise<void>;
};

export function StaffSidebar({ mobileOpen, onMobileClose, onSignOut }: StaffSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff } = useStaffSession();
  const { startNavigation } = useStaffNav();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    STAFF_NAV_ITEMS.forEach(({ href }) => {
      router.prefetch(href);
      prefetchStaffView(href);
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
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="staff-sidebar-station mt-5">
          <div className="staff-sidebar-station-card relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/18 via-white/10 to-white/5 p-4 shadow-[0_10px_28px_-10px_rgb(0_0_0_/_0.45)] backdrop-blur-md">
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/12 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_4px_14px_rgb(0_0_0_/_0.14)] ring-1 ring-white/90">
                <OperatorLogo operator={staff.operator} className="h-7 w-auto max-w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Your terminal
                </p>
                <p className="font-display mt-0.5 truncate text-[15px] font-bold leading-snug text-white">
                  {staff.stationName}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 ring-1 ring-white/25">
                  <MapPin className="size-3 shrink-0 text-white/90" />
                  <span className="font-mono text-[10px] font-semibold tracking-wide text-white">
                    {staff.stationCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Staff navigation">
        {STAFF_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="font-display mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/55">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                const pending = pendingHref === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      prefetch
                      onMouseEnter={() => {
                        router.prefetch(href);
                        prefetchStaffView(href);
                      }}
                      onClick={() => {
                        if (pathname !== href) {
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
                        pending && !active && "bg-white/10 text-white"
                      )}
                    >
                      {pending && !active ? (
                        <Loader2 className="size-[18px] shrink-0 animate-spin" />
                      ) : (
                        <Icon
                          className="size-[18px] shrink-0"
                          strokeWidth={active ? 2.5 : 2}
                        />
                      )}
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4">
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="staff-sidebar-sign-out font-display flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors"
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
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={cn(
          "staff-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(88vw,var(--portal-sidebar-width))] flex-col shadow-xl transition-transform duration-300 sm:w-[var(--portal-sidebar-width)] md:translate-x-0 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--staff-header-gradient)" }}
      >
        {sidebar}
      </aside>
    </>
  );
}
