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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
