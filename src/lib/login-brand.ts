"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  ensureOperatorBrandingLoaded,
  getOperatorBranding,
  isSupportedOperator,
  OPERATOR_LOGOS,
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

export function loginBrandLogoSrc(brand: LoginOperatorBrand): string | null {
  if (!brand.found) return null;
  if (brand.logoDataUrl) return brand.logoDataUrl;
  const code = brand.operatorCode ?? "";
  if (isSupportedOperator(code)) {
    return OPERATOR_LOGOS[code];
  }
  const cached = getOperatorBranding(code);
  if (cached?.logoDataUrl) return cached.logoDataUrl;
  return null;
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

  useEffect(() => {
    void ensureOperatorBrandingLoaded();
  }, []);

  useEffect(() => {
    const trimmed = phone.replace(/\s/g, "");
    if (!trimmed || !PHONE_PATTERN.test(trimmed)) {
      setBrand(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await fetchLoginOperatorBrandApi(trimmed, portal);
          if (!cancelled) {
            setBrand(result.found ? result : null);
          }
        } catch {
          if (!cancelled) setBrand(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phone, portal]);

  return { brand, loading };
}
