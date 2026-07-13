"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { PlatformDataProvider } from "@/components/platform/PlatformDataContext";
import { PlatformMainView } from "@/components/platform/PlatformMainView";
import { PlatformNavProvider } from "@/components/platform/PlatformNavContext";
import { StaffPreloader } from "@/components/staff/StaffPreloader";
import { restorePlatformSession, signOutPlatform } from "@/lib/platform-auth";
import { fetchPlatformSession } from "@/lib/platform-api";
import { getPlatformNavItem, PLATFORM_NAV_ITEMS } from "@/lib/platform-nav";
import { prefetchAllPlatformViews } from "@/lib/platform-view-prefetch";
import { platformThemeStyle } from "@/lib/platform-theme";
import { showConfirmDialog, showInfoAlert, showSuccessAlert } from "@/lib/sweetalert";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useSessionValidation } from "@/hooks/use-session-validation";
import type { PlatformSession } from "@/types/platform";

const PlatformSessionContext = createContext<PlatformSession | null>(null);

export function usePlatformSession() {
  const session = useContext(PlatformSessionContext);
  if (!session) {
    throw new Error("usePlatformSession must be used within PlatformShell");
  }
  return session;
}

function PlatformShellContent({
  mobileNavOpen,
  setMobileNavOpen,
  onSignOut,
}: {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <div
      className="platform-portal flex h-dvh overflow-hidden"
      style={{ ...platformThemeStyle(), background: "var(--platform-canvas)" }}
    >
      <PlatformSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onSignOut={onSignOut}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:ml-[280px]">
        <header className="z-30 flex shrink-0 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-xl border border-stone-200 p-2 text-stone-800"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-bold text-stone-900">Platform</p>
            <p className="font-body truncate text-[11px] text-stone-500">Parcela control</p>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="relative min-h-full">
            <PlatformMainView />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformShell({ children: _children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    void (async () => {
      const current = await restorePlatformSession();
      if (cancelled) return;
      if (!current) {
        router.replace("/platform/login");
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
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    PLATFORM_NAV_ITEMS.forEach(({ href }) => router.prefetch(href));
    void prefetchAllPlatformViews();
  }, [ready, router]);

  useInactivityLogout({
    enabled: ready && Boolean(session),
    onIdle: async () => {
      await signOutPlatform();
      setSession(null);
      await showInfoAlert({
        title: "Session expired",
        text: "You were signed out after 30 minutes of inactivity.",
        confirmButtonColor: "#fd7e14",
      });
      router.replace("/platform/login");
    },
  });

  useSessionValidation({
    enabled: ready && Boolean(session),
    validate: () => fetchPlatformSession(),
    onInvalid: async () => {
      await signOutPlatform();
      setSession(null);
      await showInfoAlert({
        title: "Signed out",
        text: "Your session ended. Sign in again.",
        confirmButtonColor: "#fd7e14",
      });
      router.replace("/platform/login");
    },
  });

  async function handleSignOut() {
    const confirmed = await showConfirmDialog({
      title: "Sign out of platform?",
      text: "You will need your Parcela credentials to return.",
      confirmText: "Sign out",
      cancelText: "Stay signed in",
      icon: "question",
      confirmButtonColor: "#fd7e14",
    });
    if (!confirmed) return;
    await signOutPlatform();
    setSession(null);
    await showSuccessAlert({
      title: "Signed out",
      text: "See you next time.",
      confirmButtonColor: "#fd7e14",
    });
    router.replace("/platform/login");
  }

  if (!ready || !session) {
    return (
      <div
        className="flex h-dvh items-center justify-center"
        style={{ ...platformThemeStyle(), background: "var(--platform-canvas)" }}
      >
        <div className="hidden h-full w-[280px] md:block" style={{ background: "var(--platform-header-gradient)" }} />
        <div className="flex flex-1 items-center justify-center">
          <StaffPreloader variant="page" message="Loading platform" />
        </div>
      </div>
    );
  }

  const navItem = getPlatformNavItem(pathname);

  return (
    <PlatformSessionContext.Provider value={session}>
      <PlatformDataProvider>
        <PlatformNavProvider>
          <PlatformShellContent
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
            onSignOut={handleSignOut}
          />
        </PlatformNavProvider>
      </PlatformDataProvider>
      <span className="sr-only">{navItem?.label}</span>
    </PlatformSessionContext.Provider>
  );
}
