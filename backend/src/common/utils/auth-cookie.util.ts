import type { CookieOptions, Response } from 'express';

export const STAFF_AUTH_COOKIE = 'parcela_staff_token';
export const LEAD_AUTH_COOKIE = 'parcela_lead_token';
export const ADMIN_AUTH_COOKIE = 'parcela_admin_token';

export function authCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookie(res: Response, name: string, token: string, maxAgeMs: number) {
  res.cookie(name, token, authCookieOptions(maxAgeMs));
}

export function clearAuthCookie(res: Response, name: string) {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  });
}

export function readBearerToken(authorization?: string): string | undefined {
  if (!authorization?.startsWith('Bearer ')) return undefined;
  return authorization.slice('Bearer '.length).trim() || undefined;
}

export function readAuthToken(
  authorization: string | undefined,
  cookies: Record<string, string> | undefined,
  cookieName: string,
): string | undefined {
  return readBearerToken(authorization) ?? cookies?.[cookieName];
}
