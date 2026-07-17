export const OPERATOR_SW_PATH = "/operator-sw.js";
export const OPERATOR_MANIFEST_PATH = "/manifest-operator.webmanifest";
export const OPERATOR_INSTALL_DISMISS_KEY = "parcela_operator_pwa_install_dismissed_v1";

export function isOperatorPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/staff") ||
    pathname.startsWith("/lead") ||
    pathname.startsWith("/portal")
  );
}

export function isAdminPortalPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/platform");
}

export function isOperatorPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function wasOperatorInstallDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(OPERATOR_INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissOperatorInstallPrompt(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OPERATOR_INSTALL_DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

export function ensureOperatorManifestLink(): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLLinkElement>(
    'link[rel="manifest"][data-parcela-operator="true"]',
  );
  if (existing) {
    existing.href = OPERATOR_MANIFEST_PATH;
    return;
  }
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = OPERATOR_MANIFEST_PATH;
  link.setAttribute("data-parcela-operator", "true");
  document.head.appendChild(link);
}

export async function registerOperatorServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(OPERATOR_SW_PATH, { scope: "/" });
  } catch {
    return null;
  }
}

export async function unregisterOperatorServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => {
      if (registration.active?.scriptURL.includes("operator-sw.js")) {
        return registration.unregister();
      }
      return Promise.resolve(false);
    }),
  );
}
