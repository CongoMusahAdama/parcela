"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { LeadApiBanner } from "@/components/lead/LeadApiBanner";
import { LeadParcelsProvider } from "@/components/lead/LeadParcelsContext";
import { LeadSidebar } from "@/components/lead/LeadSidebar";
import { OperatorFreezeBanner } from "@/components/shared/OperatorFreezeBanner";
import { StaffNavProvider, useStaffNav } from "@/components/staff/StaffNavContext";
import { StaffPreloader } from "@/components/staff/StaffPreloader";
import { restoreLeadSession, signOutLead } from "@/lib/lead-auth";
import { fetchLeadSession } from "@/lib/lead-api";
import { getLeadNavItem } from "@/lib/lead-nav";
import { prefetchAllLeadViews } from "@/lib/lead-view-prefetch";
import { operatorStaffThemeStyle } from "@/lib/operator-theme";
import { showConfirmDialog, showInfoAlert, showSuccessAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useSessionValidation } from "@/hooks/use-session-validation";
import type { LeadSession } from "@/types/lead";

const LeadSessionContext = createContext<LeadSession | null>(null);

export function useLeadSession() {
  const session = useContext(LeadSessionContext);
  if (!session) {
    throw new Error("useLeadSession must be used within LeadOperatorShell");
  }
  return session;
}

function LeadShellContent({
  children,
  session,
  mobileNavOpen,
  setMobileNavOpen,
  onSignOut,
}: {
  children: React.ReactNode;
  session: LeadSession;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onSignOut: () => void | Promise<void>;
}) {
  const { staff } = session;
  const { isNavigating, navMessage } = useStaffNav();

  return (
    <div
      className="staff-operator-themed lead-portal flex h-dvh overflow-hidden bg-[#eef2f6] font-body"
      style={operatorStaffThemeStyle(staff.operator)}
      data-operator={staff.operator}
    >
      <LeadSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onSignOut={onSignOut}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-[272px]">
        <header className="z-30 flex shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm lg:hidden">
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
            <p className="font-body truncate text-[11px] text-muted">
              Branch lead · {staff.stationCode}
            </p>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto" data-lead-scroll-root>
          <OperatorFreezeBanner operator={staff.operator} mode="lead" />
          <LeadApiBanner />
          {isNavigating && (
            <StaffPreloader variant="overlay" message={navMessage ?? "Loading page"} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function LeadOperatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Start empty on server + first client paint so SSR HTML matches (session lives in sessionStorage).
  const [session, setSession] = useState<LeadSession | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    void (async () => {
      const current = await restoreLeadSession();
      if (cancelled) return;
      if (!current) {
        router.replace("/lead/login");
        return;
      }
      if (current.staff.mustChangePassword) {
        router.replace("/lead/change-pin");
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
    const prefetch = () => void prefetchAllLeadViews();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 0);
    }
  }, [ready]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useInactivityLogout({
    enabled: ready && Boolean(session),
    onIdle: async () => {
      await signOutLead();
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
      });
      router.replace("/lead/login");
    },
  });

  useSessionValidation({
    enabled: ready && Boolean(session),
    validate: () => fetchLeadSession(),
    onInvalid: async () => {
      await signOutLead();
      await showInfoAlert({
        title: "Signed out",
        text: "Your session ended. Sign in again.",
      });
      router.replace("/lead/login");
    },
  });

  async function handleSignOut() {
    if (!session) return;

    const confirmed = await showConfirmDialog({
      title: "Sign out?",
      text: `Leave ${session.staff.stationName} branch lead portal?`,
      confirmText: "Yes, sign out",
      cancelText: "Stay signed in",
      confirmButtonColor: "#dc2626",
      icon: "warning",
    });

    if (!confirmed) return;

    await signOutLead();
    await showSuccessAlert({
      title: "Signed out",
      text: "You have been signed out safely.",
    });
    router.push("/lead/login");
  }

  if (!ready || !session) {
    const navItem = getLeadNavItem(pathname);
    const bootMessage = navItem
      ? `Opening ${navItem.label.toLowerCase()}`
      : "Loading branch lead portal";

    return (
      <div className="lead-portal flex h-dvh overflow-hidden bg-[#eef2f6] font-body">
        <div className="hidden w-[272px] shrink-0 bg-slate-300/25 lg:block" aria-hidden />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StaffPreloader message={bootMessage} />
        </div>
      </div>
    );
  }

  return (
    <LeadSessionContext.Provider value={session}>
      <LeadParcelsProvider demoToken={session.token}>
        <StaffNavProvider>
          <LeadShellContent
            session={session}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
            onSignOut={handleSignOut}
          >
            {children}
          </LeadShellContent>
        </StaffNavProvider>
      </LeadParcelsProvider>
    </LeadSessionContext.Provider>
  );
}
