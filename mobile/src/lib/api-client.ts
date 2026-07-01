import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://localhost:3002/api';

/** Metro / Expo dev server host — same machine as the API in local dev */
function getDevMachineHost(): string | undefined {
  const raw =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost;

  if (!raw) return undefined;

  const host = raw.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return undefined;
  return host;
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const extra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  let url = fromEnv ?? extra ?? DEFAULT_API_URL;

  const devHost = getDevMachineHost();
  if (devHost && /localhost|127\.0\.0\.1/.test(url)) {
    url = url.replace(/localhost|127\.0\.0\.1/g, devHost);
  }

  const resolved = url.replace(/\/$/, '');
  if (__DEV__ && devHost) {
    console.log(`[Parcela API] ${resolved}`);
  }
  return resolved;
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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

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

  return response.json() as Promise<T>;
}
