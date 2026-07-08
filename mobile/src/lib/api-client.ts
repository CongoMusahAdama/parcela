import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3002/api';

function isTunnelHost(host: string): boolean {
  return host.includes('exp.direct') || host.includes('expo.dev') || host.includes('ngrok');
}

/** Metro / Expo dev server host — same machine as the API in local dev */
function getDevMachineHost(): string | undefined {
  const override = process.env.EXPO_PUBLIC_DEV_API_HOST?.trim();
  if (override) return override;

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return '10.0.2.2';
  }

  const raw =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost;

  if (!raw) return undefined;

  const host = raw.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') return undefined;
  if (isTunnelHost(host)) return undefined;
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
  if (__DEV__) {
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

const NETWORK_HELP =
  'Your phone cannot reach the Parcela API. Use the same Wi‑Fi as your computer (not phone hotspot), allow port 3002 in Windows Firewall, and set EXPO_PUBLIC_DEV_API_HOST to your PC LAN IP in mobile/.env if needed.';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`${NETWORK_HELP} (tried ${base})`, 0);
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

  return response.json() as Promise<T>;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiFetch<{ ok?: boolean }>('/health');
    return true;
  } catch {
    return false;
  }
}
