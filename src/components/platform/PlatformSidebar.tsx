"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Shield, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { usePlatformSession } from "@/components/platform/PlatformShell";
import { usePlatformNav } from "@/components/platform/PlatformNavContext";
import { PLATFORM_NAV_ITEMS, PLATFORM_NAV_SECTIONS } from "@/lib/platform-nav";
import { prefetchPlatformView } from "@/lib/platform-view-prefetch";
import { cn } from "@/lib/utils";

type PlatformSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void | Promise<void>;
};

export function PlatformSidebar({
  mobileOpen,
  onMobileClose,
  onSignOut,
}: PlatformSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = usePlatformSession();
  const { activePath, setPendingPath } = usePlatformNav();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    PLATFORM_NAV_ITEMS.forEach(({ href }) => {
      router.prefetch(href);
      prefetchPlatformView(href);
    });
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function isActive(href: string) {
    return activePath === href || activePath.startsWith(`${href}/`);
  }

  function handleNavClick(href: string, active: boolean) {
    if (!active) {
      setPendingHref(href);
      setPendingPath(href);
    }
    onMobileClose();
  }

  const sidebar = (
    <div className="flex h-full flex-col text-white">
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

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--platform-orange)] shadow-sm">
              <Shield className="size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Parcela platform
              </p>
              <p className="font-display mt-0.5 truncate text-[15px] font-bold text-white">
                Control room
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {PLATFORM_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="font-display mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const pending = pendingHref === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch
                      onMouseEnter={() => {
                        router.prefetch(item.href);
                        prefetchPlatformView(item.href);
                      }}
                      onClick={() => handleNavClick(item.href, active)}
                      className={cn(
                        "font-display flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                        active
                          ? "bg-white text-[var(--platform-orange-dark)] shadow-sm"
                          : "text-white/88 hover:bg-white/12 hover:text-white",
                        pending && !active && "bg-white/10",
                      )}
                    >
                      {pending && !active ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                      ) : (
                        <Icon className="size-4 shrink-0" strokeWidth={2.25} />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/15 px-4 py-4">
        <div className="min-w-0 px-1">
          <p className="font-display truncate text-sm font-bold text-white">{admin.displayName}</p>
          <p className="font-body truncate text-[11px] text-white/65">{admin.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/16"
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
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] flex-col shadow-xl transition-transform duration-300 md:translate-x-0 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "var(--platform-header-gradient)" }}
      >
        {sidebar}
      </aside>
    </>
  );
}
