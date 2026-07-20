import { clearOperatorOfflineState } from "@/lib/operator-offline-state";
import type { LeadSession } from "@/types/lead";
import { LEAD_USE_DEMO_DATA } from "@/lib/lead-demo";
import { ApiError } from "@/lib/api-client";
import { fetchLeadSession, leadLoginApi, leadLogoutApi } from "@/lib/lead-api";

export { DEMO_LEAD_LOGINS } from "@/lib/lead-demo";

const SESSION_KEY = "parcela_lead_session";

const PHONE_PATTERN = /^(\+?233|0)?[2-9]\d{8}$/;

export function validateLeadLoginInput(phone: string, pin: string): string | null {
  const trimmedPhone = phone.replace(/\s/g, "");

  if (!trimmedPhone) {
    return "Enter your phone number.";
  }

  if (!PHONE_PATTERN.test(trimmedPhone)) {
    return "Enter a valid Ghana phone number (e.g. 0244555666).";
  }

  if (!pin.trim()) {
    return "Enter your PIN.";
  }

  if (pin.trim().length < 4) {
    return "PIN must be at least 4 digits.";
  }

  return null;
}

export function getLeadLoginFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message) {
      return error.message;
    }
  }

  return "Check your phone and PIN, then try again.";
}

export function getLeadSession(): LeadSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LeadSession) : null;
  } catch {
    return null;
  }
}

export function clearLeadSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveLeadSession(session: LeadSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signInLead(phone: string, pin: string): Promise<LeadSession> {
  const session = await leadLoginApi(phone, pin);
  saveLeadSession(session);
  return session;
}

export async function restoreLeadSession(options?: {
  allowOfflineCache?: boolean;
}): Promise<LeadSession | null> {
  if (LEAD_USE_DEMO_DATA) {
    return getLeadSession();
  }

  const allowOfflineCache = options?.allowOfflineCache !== false;

  try {
    const session = await fetchLeadSession();
    saveLeadSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearLeadSession();
      return null;
    }
    if (allowOfflineCache) {
      const cached = getLeadSession();
      if (cached) return cached;
    }
    clearLeadSession();
    return null;
  }
}

export async function signOutLead(): Promise<void> {
  try {
    await leadLogoutApi();
  } catch {
    // Clear local state even if the API is unreachable.
  }
  clearLeadSession();
  clearOperatorOfflineState();
}
