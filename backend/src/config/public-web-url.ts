/** Legacy Netlify frontend — never include in SMS or public links. */
const LEGACY_NETLIFY_HOST = /(?:^https?:\/\/)?(?:[\w-]+\.)?netlify\.app$/i;

const DEFAULT_PRODUCTION_WEB_URL = 'https://parcela.vercel.app';

/**
 * Public website base URL for SMS + tracking links.
 * Rewrites legacy Netlify hosts to the Vercel frontend.
 */
export function resolvePublicWebUrl(raw?: string | null): string {
  const fallback =
    process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_WEB_URL : 'http://localhost:3001';
  const value = (raw ?? process.env.PUBLIC_WEB_URL ?? fallback).trim().replace(/\/$/, '');
  if (!value) return fallback;

  try {
    const host = new URL(value).hostname;
    if (LEGACY_NETLIFY_HOST.test(host) || host.endsWith('.netlify.app')) {
      return DEFAULT_PRODUCTION_WEB_URL;
    }
  } catch {
    if (/netlify\.app/i.test(value)) return DEFAULT_PRODUCTION_WEB_URL;
  }

  return value;
}

/** Drop legacy Netlify origins from CORS and ensure the public web URL is allowed. */
export function resolveCorsOrigins(raw?: string | null): string[] {
  const fromEnv = (raw ?? process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .filter((o) => {
      try {
        const host = new URL(o).hostname;
        return !host.endsWith('.netlify.app');
      } catch {
        return !/netlify\.app/i.test(o);
      }
    });

  const publicWeb = resolvePublicWebUrl(process.env.PUBLIC_WEB_URL);
  const defaults =
    process.env.NODE_ENV === 'production'
      ? [publicWeb]
      : [
          'http://localhost:3001',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:8083',
          publicWeb,
        ];

  return Array.from(new Set([...fromEnv, ...defaults]));
}
