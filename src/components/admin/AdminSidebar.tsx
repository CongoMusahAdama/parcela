"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  LogOut,
  Network,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { useStaffNav } from "@/components/staff/StaffNavContext";
import { getAdminOperatorName } from "@/lib/admin-operator";
import { ADMIN_NAV_ITEMS, ADMIN_NAV_SECTIONS } from "@/lib/admin-nav";
import type { AdminNavItem, AdminNavSection } from "@/lib/admin-nav";
import { prefetchAdminView } from "@/lib/admin-view-prefetch";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void | Promise<void>;
};

function navItemClass(active: boolean, pending: boolean, emphasize = false) {
  return cn(
    "admin-nav-item font-display group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all",
    active
      ? "admin-nav-active bg-white/16 text-white shadow-[inset_3px_0_0_0_#fff]"
      : emphasize
        ? "border border-amber-300/30 bg-amber-400/10 text-white hover:bg-amber-400/16"
        : "text-white/82 hover:bg-white/8 hover:text-white",
    pending && !active && "bg-white/10 text-white",
  );
}

export function AdminSidebar({ mobileOpen, onMobileClose, onSignOut }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdminSession();
  const { startNavigation } = useStaffNav();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [reportsOpen, setReportsOpen] = useState(() => pathname.startsWith("/admin/reports"));

  useEffect(() => {
    ADMIN_NAV_ITEMS.forEach(({ href }) => {
      router.prefetch(href);
      prefetchAdminView(href);
    });
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin/reports")) {
      setReportsOpen(true);
    }
  }, [pathname]);

  const operatorLabel = getAdminOperatorName(admin);
  const operatorCode = admin.operator ?? "HQ";

  const visibleSections = ADMIN_NAV_SECTIONS.filter(
    (section) => !section.hideWhenConfigured || !admin.operatorConfigured,
  );

  function isItemActive({ href, matchExact }: Pick<AdminNavItem, "href" | "matchExact">) {
    return matchExact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleNavClick(href: string, label: string, active: boolean) {
    if (!active) {
      prefetchAdminView(href);
      startNavigation(`Opening ${label.toLowerCase()}`);
    }
    setPendingHref(href);
    onMobileClose();
  }

  function renderIcon(Icon: AdminNavItem["icon"], active: boolean, nested = false) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg transition-colors",
          nested ? "size-7 bg-white/6" : "size-8",
          active ? "bg-white/18 text-white" : "bg-white/8 text-white/90 group-hover:bg-white/12",
        )}
      >
        <Icon className={nested ? "size-3.5" : "size-4"} strokeWidth={active ? 2.5 : 2} />
      </span>
    );
  }

  function renderNavItem(item: AdminNavItem, nested = false) {
    const { label, href, icon: Icon, badge, emphasizeWhenUnconfigured, matchExact } = item;
    const active = isItemActive({ href, matchExact });
    const pending = pendingHref === href;
    const emphasize = emphasizeWhenUnconfigured && !admin.operatorConfigured;

    return (
      <li key={href}>
        <Link
          href={href}
          prefetch
          onClick={() => handleNavClick(href, label, active)}
          className={navItemClass(active, pending, emphasize)}
        >
          {pending && !active ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/8">
              <Loader2 className="size-4 animate-spin" />
            </span>
          ) : (
            renderIcon(Icon, active, nested)
          )}
          <span className="min-w-0 flex-1 leading-snug">{label}</span>
          {badge && emphasize && (
            <span className="shrink-0 rounded-full bg-amber-300/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0f172a]">
              {badge}
            </span>
          )}
        </Link>
      </li>
    );
  }

  function renderCollapsibleSection(section: AdminNavSection) {
    const folder = section.folderItem!;
    const folderActive = pathname.startsWith("/admin/reports");
    const FolderIcon = folder.icon;

    return (
      <div key={section.title}>
        <p className="admin-nav-section-label">{section.title}</p>
        <ul className="space-y-1">
          <li>
            <div className={cn("flex items-center gap-1", folderActive && "admin-nav-active rounded-xl bg-white/16 shadow-[inset_3px_0_0_0_#fff]")}>
              <button
                type="button"
                onClick={() => setReportsOpen((open) => !open)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white"
                aria-label={reportsOpen ? "Collapse reports" : "Expand reports"}
                aria-expanded={reportsOpen}
              >
                {reportsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              <Link
                href={folder.href}
                prefetch
                onClick={() => {
                  setReportsOpen(true);
                  handleNavClick(folder.href, folder.label, folderActive);
                }}
                className="font-display flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2.5 pr-3 text-[13px] font-semibold text-white transition-colors hover:text-white"
              >
                {renderIcon(FolderIcon, folderActive)}
                <span className="min-w-0 flex-1 leading-snug">{folder.label}</span>
              </Link>
            </div>
          </li>
          {reportsOpen &&
            section.items.map((item) => (
              <li key={item.href} className="pl-4">
                <Link
                  href={item.href}
                  prefetch
                  onClick={() => handleNavClick(item.href, item.label, isItemActive(item))}
                  className={navItemClass(isItemActive(item), pendingHref === item.href)}
                >
                  {pendingHref === item.href && !isItemActive(item) ? (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/8">
                      <Loader2 className="size-3.5 animate-spin" />
                    </span>
                  ) : (
                    renderIcon(item.icon, isItemActive(item), true)
                  )}
                  <span className="text-[12px]">{item.label}</span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    );
  }

  function renderSection(section: AdminNavSection) {
    if (section.collapsible && section.folderItem) {
      return renderCollapsibleSection(section);
    }

    return (
      <div key={section.title}>
        <p className="admin-nav-section-label">{section.title}</p>
        <ul className="space-y-1">{section.items.map((item) => renderNavItem(item))}</ul>
      </div>
    );
  }

  const initials = admin.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <div className="admin-sidebar-inner flex h-full flex-col text-white">
      <div className="shrink-0 px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Logo
              size="sm"
              showWordmark
              className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-white/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                HQ
              </span>
              <span className="font-body text-[11px] text-white/60">Command center</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="admin-sidebar-operator mt-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-white/16 via-white/10 to-white/5 p-3.5 shadow-[0_10px_28px_-10px_rgb(0_0_0_/_0.45)] backdrop-blur-md">
            <div className="relative flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                {admin.operatorConfigured && admin.operator ? (
                  <PlatformOperatorMark
                    code={operatorCode}
                    name={operatorLabel}
                    brandColor={admin.brandColor ?? "#fd7e14"}
                    logoDataUrl={admin.logoDataUrl}
                    size="md"
                    className="size-full rounded-lg border-0 bg-transparent p-0"
                  />
                ) : (
                  <Network className="size-5 text-[#0f172a]" strokeWidth={2.25} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Your transport
                </p>
                <p className="font-display truncate text-sm font-bold leading-tight text-white">
                  {operatorLabel}
                </p>
                {admin.operatorConfigured && admin.operator ? (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <span className="font-mono text-[10px] font-semibold text-white">
                      {admin.operator}
                    </span>
                  </div>
                ) : null}
                <p className="font-body mt-1.5 flex items-center gap-1.5 text-[11px] text-white/65">
                  {!admin.operatorConfigured ? (
                    <>
                      <span className="size-1.5 shrink-0 rounded-full bg-amber-300" />
                      Setup pending
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-300" />
                      Network active
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-3 py-2"
        aria-label="HQ navigation"
      >
        {visibleSections.map(renderSection)}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5 ring-1 ring-white/10">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-semibold text-white">
              {admin.displayName}
            </p>
            <p className="font-body truncate text-[11px] text-white/60">
              HQ admin{admin.operatorConfigured && admin.operator ? ` · ${admin.operator}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="admin-sidebar-sign-out font-display mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
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
          "admin-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(92vw,320px)] flex-col shadow-2xl transition-transform duration-300 sm:w-[320px] lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ background: "var(--staff-header-gradient)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -10%, rgb(255 255 255 / 0.14), transparent 55%)",
          }}
        />
        <div className="relative flex h-full flex-col">{sidebar}</div>
      </aside>
    </>
  );
}
