"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPublicOperatorBrandingApi } from "@/lib/api";
import { apiFetch } from "@/lib/api-client";
import { getStoredTransportName, setStoredTransportName } from "@/lib/api-server-config";
import {
  ensureOperatorBrandingLoaded,
  getOperatorLogoSrc,
  refreshOperatorBranding,
} from "@/lib/operators";

export type LoginPortal = "staff" | "lead" | "hq";

export type LoginOperatorBrand = {
  found: boolean;
  operatorCode?: string;
  operatorName?: string;
  brandColor?: string;
  logoDataUrl?: string | null;
  stationName?: string | null;
};

const PHONE_PATTERN = /^(\+?233|0)?[2-9]\d{8}$/;
const BRAND_CACHE_KEY = "parcela.loginBrandCache";

export function loginBrandLogoSrc(brand: LoginOperatorBrand): string | null {
  if (!brand.found) return null;
  if (brand.logoDataUrl) return brand.logoDataUrl;
  return getOperatorLogoSrc(brand.operatorCode ?? "");
}

export function readCachedLoginBrand(): LoginOperatorBrand | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRAND_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoginOperatorBrand;
    return parsed?.found ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedLoginBrand(brand: LoginOperatorBrand | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!brand?.found) {
      window.localStorage.removeItem(BRAND_CACHE_KEY);
      return;
    }
    window.localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(brand));
  } catch {
    // ignore quota / private mode
  }
}

export async function fetchLoginOperatorBrandApi(
  phone: string,
  portal: LoginPortal,
): Promise<LoginOperatorBrand> {
  const trimmed = phone.replace(/\s/g, "");
  const params = new URLSearchParams({ phone: trimmed, portal });
  return apiFetch<LoginOperatorBrand>(`/staff/login-brand?${params.toString()}`);
}

export function useLoginOperatorBrand(phone: string, portal: LoginPortal) {
  const [brand, setBrand] = useState<LoginOperatorBrand | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Subsequent visits: restore company from cache / transport name (no phone needed).
  useEffect(() => {
    const cached = readCachedLoginBrand();
    if (cached) setBrand(cached);
    setHydrated(true);

    const code = getStoredTransportName();
    if (!code) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        await ensureOperatorBrandingLoaded();
        const rows = await fetchPublicOperatorBrandingApi();
        if (cancelled) return;
        const match = rows.find(
          (row) =>
            row.code.trim().toUpperCase() === code ||
            row.name.trim().toUpperCase() === code ||
            row.name.trim().toUpperCase().includes(code),
        );
        if (!match || match.active === false) return;
        const next: LoginOperatorBrand = {
          found: true,
          operatorCode: match.code,
          operatorName: match.name,
          brandColor: match.brandColor,
          logoDataUrl: match.logoDataUrl,
          stationName: cached?.stationName ?? null,
        };
        setBrand(next);
        writeCachedLoginBrand(next);
        setStoredTransportName(match.code);
      } catch {
        // Keep cache if branding list is unreachable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const trimmed = phone.replace(/\s/g, "");
    if (!trimmed || !PHONE_PATTERN.test(trimmed)) {
      // Keep cached company on empty phone — don't wipe on every keystroke clear.
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await fetchLoginOperatorBrandApi(trimmed, portal);
          if (cancelled) return;
          if (result.found) {
            setBrand(result);
            writeCachedLoginBrand(result);
            if (result.operatorCode) setStoredTransportName(result.operatorCode);
          } else {
            // Keep transport-level company logo; only clear station-specific brand.
            const cached = readCachedLoginBrand();
            if (cached) setBrand(cached);
            else setBrand(null);
          }
        } catch {
          if (!cancelled) {
            // Keep last known company if the network blips.
            const cached = readCachedLoginBrand();
            if (cached) setBrand(cached);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, refreshKey === 0 ? 450 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phone, portal, refreshKey, hydrated]);

  /** Re-check transport and refresh logo/company without reloading the page. */
  const refetch = useCallback(async () => {
    await refreshOperatorBranding();
    const cached = readCachedLoginBrand();
    if (cached) setBrand(cached);
    setRefreshKey((k) => k + 1);
  }, []);

  const applyBrand = useCallback((next: LoginOperatorBrand | null) => {
    if (next?.found) {
      setBrand(next);
      writeCachedLoginBrand(next);
      return;
    }
    setBrand(null);
    writeCachedLoginBrand(null);
  }, []);

  return { brand, loading, refetch, applyBrand, hydrated };
}
