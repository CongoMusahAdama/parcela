const DEFAULT_API_URL = '/api';

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return url.replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK_ERROR_MESSAGE =
  'Connection problem — check your network and try again. Station actions can be queued and will sync when you are back online.';

const inFlightGetRequests = new Map<string, Promise<unknown>>();

function inFlightKey(path: string, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = typeof init?.body === 'string' ? init.body : '';
  return `${method}:${path}:${body}`;
}

async function apiFetchInternal<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    const raw = await response.text();
    if (raw) {
      try {
        const body = JSON.parse(raw) as { message?: string | string[] };
        if (body.message) {
          message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        } else {
          message = raw;
        }
      } catch {
        message = raw;
      }
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method !== 'GET') {
    return apiFetchInternal<T>(path, init);
  }

  const key = inFlightKey(path, init);
  const existing = inFlightGetRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = apiFetchInternal<T>(path, init).finally(() => {
    inFlightGetRequests.delete(key);
  });
  inFlightGetRequests.set(key, promise);
  return promise;
}
