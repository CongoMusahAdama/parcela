"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { StaffNavProvider, useStaffNav } from "@/components/staff/StaffNavContext";
import { StaffPreloader } from "@/components/staff/StaffPreloader";
import { restoreAdminSession, signOutAdmin } from "@/lib/admin-auth";
import { getAdminOperatorName } from "@/lib/admin-operator";
import { getAdminNavItem } from "@/lib/admin-nav";
import { adminThemeStyle } from "@/lib/admin-theme";
import { fetchAdminSession } from "@/lib/admin-api";
import { prefetchAllAdminViews, prefetchAdminView } from "@/lib/admin-view-prefetch";
import { ensureStationsLoaded } from "@/lib/stations";
import { showConfirmDialog, showInfoAlert, showSuccessAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useSessionValidation } from "@/hooks/use-session-validation";
import type { AdminSession } from "@/types/admin";

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session) {
    throw new Error("useAdminSession must be used within AdminOperatorShell");
  }
  return session;
}

function AdminShellContent({
  children,
  session,
  mobileNavOpen,
  setMobileNavOpen,
  onSignOut,
}: {
  children: React.ReactNode;
  session: AdminSession;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onSignOut: () => void | Promise<void>;
}) {
  const { admin } = session;
  const { isNavigating, navMessage } = useStaffNav();

  return (
    <div
      className="admin-portal flex h-dvh overflow-hidden bg-white"
      style={adminThemeStyle()}
      data-operator={admin.operator ?? "neutral"}
    >
      <AdminSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onSignOut={onSignOut}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-[320px]">
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
              {getAdminOperatorName(admin)}
            </p>
            <p className="font-body truncate text-[11px] text-muted">
              {admin.operator ? `${admin.operator} HQ` : "Operator network"}
            </p>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {isNavigating && (
            <StaffPreloader variant="overlay" message={navMessage ?? "Loading page"} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminOperatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Start empty on server + first client paint so SSR HTML matches (session lives in sessionStorage).
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const current = await restoreAdminSession();
        if (cancelled) return;
        if (!current) {
          router.replace("/admin/login");
          return;
        }
        if (current.admin.mustChangePassword) {
          router.replace("/admin/change-password");
          return;
        }
        setSession(current);
        setReady(true);
      } catch {
        if (cancelled) return;
        router.replace("/admin/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    // Warm stations cache + view chunks so sidebar clicks feel instant.
    void ensureStationsLoaded();
    const prefetch = () => void prefetchAllAdminViews();
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(prefetch);
    } else {
      window.setTimeout(prefetch, 0);
    }
  }, [ready]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    prefetchAdminView(pathname);
  }, [pathname]);

  useInactivityLogout({
    enabled: ready && Boolean(session),
    onIdle: async () => {
      await signOutAdmin();
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
      });
      router.replace("/admin/login");
    },
  });

  useSessionValidation({
    enabled: ready && Boolean(session),
    validate: () => fetchAdminSession(),
    onInvalid: async () => {
      await signOutAdmin();
      await showInfoAlert({
        title: "Signed out",
        text: "Your session ended. Sign in again.",
      });
      router.replace("/admin/login");
    },
  });

  async function handleSignOut() {
    if (!session) return;

    const confirmed = await showConfirmDialog({
      title: "Sign out?",
      text: "Leave the HQ command center?",
      confirmText: "Yes, sign out",
      cancelText: "Stay signed in",
      confirmButtonColor: "#dc2626",
      icon: "warning",
    });

    if (!confirmed) return;

    await signOutAdmin();
    await showSuccessAlert({
      title: "Signed out",
      text: "You have been signed out safely.",
    });
    router.push("/admin/login");
  }

  if (!ready || !session) {
    const navItem = getAdminNavItem(pathname);
    const bootMessage = navItem
      ? `Opening ${navItem.label.toLowerCase()}`
      : "Loading HQ portal";

    return (
      <div className="admin-portal flex h-dvh overflow-hidden bg-white font-body">
        <div className="hidden w-[320px] shrink-0 bg-slate-300/25 lg:block" aria-hidden />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StaffPreloader message={bootMessage} />
        </div>
      </div>
    );
  }

  return (
    <AdminSessionContext.Provider value={session}>
      <StaffNavProvider>
        <AdminShellContent
          session={session}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          onSignOut={handleSignOut}
        >
          {children}
        </AdminShellContent>
      </StaffNavProvider>
    </AdminSessionContext.Provider>
  );
}
