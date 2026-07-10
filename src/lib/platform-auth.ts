import type { PlatformSession } from "@/types/platform";
import {
  fetchPlatformSession,
  platformLoginApi,
  platformLogoutApi,
} from "@/lib/platform-api";

/** Parcela platform admin email (seeded in backend via PLATFORM_ADMIN_EMAIL). */
export const PLATFORM_DEMO_EMAIL =
  process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ??
  "amusahcongo@gmail.com";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePlatformLoginInput(email: string, password: string): string | null {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return "Enter your Parcela work email.";
  if (!EMAIL_PATTERN.test(trimmedEmail)) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  return null;
}

export function getPlatformLoginFailureMessage(error?: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Invalid email or password. Use your Parcela platform credentials.";
}

export async function signInPlatform(email: string, password: string): Promise<PlatformSession> {
  return platformLoginApi(email.trim().toLowerCase(), password);
}

export async function restorePlatformSession(): Promise<PlatformSession | null> {
  try {
    return await fetchPlatformSession();
  } catch {
    return null;
  }
}

export async function signOutPlatform(): Promise<void> {
  await platformLogoutApi();
}

export function formatPlatformServerDate(at = new Date()): string {
  return at.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getPlatformTimeGreeting(at = new Date()): string {
  const hour = at.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
