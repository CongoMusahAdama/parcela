"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { OperatorInstallBanner } from "@/components/operator/OperatorInstallBanner";
import { OperatorLocksProvider } from "@/components/operator/OperatorLocksContext";
import { OperatorPortalWelcomeGate } from "@/components/operator/OperatorPortalWelcomeGate";
import { StaffApiBanner } from "@/components/staff/StaffApiBanner";
import { StaffNavProvider, useStaffNav } from "@/components/staff/StaffNavContext";
import { StaffParcelsProvider } from "@/components/staff/StaffParcelsContext";
import { StaffPreloader } from "@/components/staff/StaffPreloader";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { OperatorFreezeBanner } from "@/components/shared/OperatorFreezeBanner";
import { restoreStaffSession, signOutStaff } from "@/lib/staff-auth";
import { OPERATOR_LOGIN_PATH } from "@/lib/operator-auth";
import { showConfirmDialog, showSuccessAlert } from "@/lib/sweetalert";
import { getStaffNavItem } from "@/lib/staff-nav";
import { operatorStaffThemeStyle } from "@/lib/operator-theme";
import { ensureOperatorBrandingLoaded } from "@/lib/operators";
import { prefetchAllStaffViews } from "@/lib/staff-view-prefetch";
import type { StaffSession } from "@/types/staff";

const StaffSessionContext = createContext<StaffSession | null>(null);

export function useStaffSession() {
  const session = useContext(StaffSessionContext);
  if (!session) {
    throw new Error("useStaffSession must be used within StaffOperatorShell");
  }
  return session;
}

type StaffOperatorShellProps = {
  children: React.ReactNode;
};

function StaffShellContent({
  children,
  session,
  mobileNavOpen,
  setMobileNavOpen,
  onSignOut,
}: {
  children: React.ReactNode;
  session: StaffSession;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onSignOut: () => void | Promise<void>;
}) {
  const { staff } = session;
  const { isNavigating, navMessage } = useStaffNav();

  return (
    <div
      className="staff-operator-themed flex h-dvh overflow-hidden bg-[#eef2f6]"
      style={operatorStaffThemeStyle(staff.operator)}
      data-operator={staff.operator}
    >
      <StaffSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onSignOut={onSignOut}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:ml-[272px]">
        <header className="z-30 flex shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-xl border border-border p-2 text-foreground"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-bold text-foreground">
              {staff.stationName}
            </p>
            <p className="font-body truncate text-[11px] text-muted">{staff.stationCode}</p>
          </div>
        </header>

        <div className="operator-portal-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <OperatorFreezeBanner operator={staff.operator} mode="staff" />
          <StaffApiBanner />
          {isNavigating && <StaffPreloader variant="overlay" message={navMessage ?? "Loading page"} />}
          {children}
        </div>
      </div>
      <OperatorInstallBanner placement="portal" />
    </div>
  );
}

export function StaffOperatorShell({ children }: StaffOperatorShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    void (async () => {
      await ensureOperatorBrandingLoaded();
      const current = await restoreStaffSession();
      if (cancelled) return;
      if (!current) {
        router.replace(OPERATOR_LOGIN_PATH);
        return;
      }
      if (current.staff.mustChangePassword) {
        router.replace("/staff/change-password");
        return;
      }
      setSession(current);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const prefetch = () => void prefetchAllStaffViews();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 0);
    }
  }, [ready]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    if (!session) return;

    const confirmed = await showConfirmDialog({
      title: "Sign out?",
      text: `You will leave ${session.staff.stationName}. Make sure any parcel actions on this screen are complete before signing out.`,
      confirmText: "Yes, sign out",
      cancelText: "Stay signed in",
      confirmButtonColor: "#dc2626",
      icon: "warning",
    });

    if (!confirmed) return;

    await signOutStaff();
    await showSuccessAlert({
      title: "Signed out",
      text: "You have been signed out safely.",
      confirmText: "OK",
    });
    router.push(OPERATOR_LOGIN_PATH);
  }

  if (!ready || !session) {
    const navItem = getStaffNavItem(pathname);
    const bootMessage = navItem
      ? `Opening ${navItem.label.toLowerCase()}`
      : "Loading staff portal";

    return (
      <div className="staff-portal flex h-dvh overflow-hidden bg-[#eef2f6] font-body">
        <div className="hidden w-[272px] shrink-0 bg-slate-300/25 md:block" aria-hidden />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StaffPreloader message={bootMessage} />
        </div>
      </div>
    );
  }

  return (
    <StaffSessionContext.Provider value={session}>
      <OperatorLocksProvider operator={session.staff.operator}>
        <StaffParcelsProvider>
          <StaffNavProvider>
            <StaffShellContent
              session={session}
              mobileNavOpen={mobileNavOpen}
              setMobileNavOpen={setMobileNavOpen}
              onSignOut={handleSignOut}
            >
              {children}
            </StaffShellContent>
            <OperatorPortalWelcomeGate
              portal="staff"
              accountId={session.staff.id}
              displayName={session.staff.displayName}
              subtitle={`${session.staff.stationName} · ${session.staff.stationCode}`}
              operatorLabel={String(session.staff.operator)}
            />
          </StaffNavProvider>
        </StaffParcelsProvider>
      </OperatorLocksProvider>
    </StaffSessionContext.Provider>
  );
}
