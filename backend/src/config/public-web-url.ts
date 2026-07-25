/** Legacy Netlify frontend — never include in SMS or public links. */
const LEGACY_NETLIFY_HOST = /(?:^https?:\/\/)?(?:[\w-]+\.)?netlify\.app$/i;

/** Previous Vercel preview host — prefer the custom domain in production links. */
const LEGACY_VERCEL_HOSTS = new Set(['parcela-eta.vercel.app']);

const DEFAULT_PRODUCTION_WEB_URL = 'https://useparcela.com';

/**
 * Public website base URL for SMS + tracking links.
 * Rewrites legacy Netlify / old Vercel hosts to useparcela.com.
 */
export function resolvePublicWebUrl(raw?: string | null): string {
  const fallback =
    process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_WEB_URL : 'http://localhost:3001';
  const value = (raw ?? process.env.PUBLIC_WEB_URL ?? fallback).trim().replace(/\/$/, '');
  if (!value) return fallback;

  try {
    const host = new URL(value).hostname;
    if (
      LEGACY_NETLIFY_HOST.test(host) ||
      host.endsWith('.netlify.app') ||
      LEGACY_VERCEL_HOSTS.has(host)
    ) {
      return DEFAULT_PRODUCTION_WEB_URL;
    }
  } catch {
    if (/netlify\.app/i.test(value) || /parcela-eta\.vercel\.app/i.test(value)) {
      return DEFAULT_PRODUCTION_WEB_URL;
    }
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
  let wwwWeb: string | null = null;
  try {
    const u = new URL(publicWeb);
    if (!u.hostname.startsWith('www.')) {
      u.hostname = `www.${u.hostname}`;
      wwwWeb = u.toString().replace(/\/$/, '');
    }
  } catch {
    wwwWeb = null;
  }
  const defaults =
    process.env.NODE_ENV === 'production'
      ? [publicWeb, ...(wwwWeb ? [wwwWeb] : [])]
      : [
          'http://localhost:3001',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:8083',
          publicWeb,
        ];

  return Array.from(new Set([...fromEnv, ...defaults]));
}
