import type { AdminSession } from "@/types/admin";
import type { Operator } from "@/types/parcel";
import { ApiError } from "@/lib/api-client";
import {
  adminLoginApi,
  adminLogoutApi,
  completeAdminSetupApi,
  fetchAdminSession,
} from "@/lib/admin-api";

const SESSION_KEY = "parcela_admin_session";

export type DemoAdminLogin = {
  label: string;
  email: string;
  displayName: string;
  operator: Operator | null;
  operatorConfigured: boolean;
};

/** HQ accounts are created via the platform portal — no demo quick-fill logins. */
export const DEMO_ADMIN_LOGINS: DemoAdminLogin[] = [];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAdminLoginInput(email: string, password: string): string | null {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return "Enter your work email.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Enter your password.";
  }

  return null;
}

export function getAdminLoginFailureMessage(error?: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (/failed to fetch|network|load failed/i.test(error.message)) {
      return "Cannot reach the server. Make sure the API is running, then try again.";
    }
    if (error.message) return error.message;
  }
  return "Invalid email or password. Use credentials issued by Parcela during operator onboarding.";
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function saveAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const session = await adminLoginApi(email, password);
  saveAdminSession(session);
  return session;
}

export async function restoreAdminSession(): Promise<AdminSession | null> {
  try {
    const session = await fetchAdminSession();
    saveAdminSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAdminSession();
      return null;
    }
    const cached = getAdminSession();
    if (cached) return cached;
    throw error;
  }
}

export async function signOutAdmin(): Promise<void> {
  try {
    await adminLogoutApi();
  } catch {
    // Clear local state even if the API is unreachable.
  }
  clearAdminSession();
}

export async function completeAdminSetup(operator: Operator): Promise<AdminSession | null> {
  const result = await completeAdminSetupApi(operator);
  const current = getAdminSession();
  if (!current) return null;
  const updated: AdminSession = {
    ...current,
    admin: result.admin,
  };
  saveAdminSession(updated);
  return updated;
}

export function formatAdminServerDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getAdminTimeGreeting(at = new Date()): string {
  const hour = at.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
