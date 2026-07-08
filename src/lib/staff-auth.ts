import type { StaffSession } from "@/types/staff";
import { ApiError } from "@/lib/api-client";
import { fetchStaffSession, staffLoginApi, staffLogoutApi } from "@/lib/staff-api";

const SESSION_KEY = "parcela_staff_session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStaffLoginInput(email: string, password: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Enter your staff email address.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Enter a valid email address (for example, you@parcela.staff).";
  }

  if (!password) {
    return "Enter your password.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}

export function getStaffLoginFailureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (/failed to fetch|network|load failed/i.test(error.message)) {
      return "Cannot reach the server. Make sure the API is running, then try again.";
    }
    if (error.message) {
      return error.message;
    }
  }

  return "Check your email and password, then try again.";
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    return null;
  }
}

export function clearStaffSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveStaffSession(session: StaffSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signInStaff(email: string, password: string): Promise<StaffSession> {
  const session = await staffLoginApi(email, password);
  saveStaffSession(session);
  return session;
}

export async function restoreStaffSession(): Promise<StaffSession | null> {
  try {
    const session = await fetchStaffSession();
    saveStaffSession(session);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearStaffSession();
      return null;
    }
    const cached = getStaffSession();
    if (cached) return cached;
    throw error;
  }
}

export async function signOutStaff(): Promise<void> {
  try {
    await staffLogoutApi();
  } catch {
    // Clear local state even if the API is unreachable.
  }
  clearStaffSession();
}

export function formatStaffServerDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatStaffLiveDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatStaffLiveTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
