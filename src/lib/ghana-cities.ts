import { GHANA_STATIONS } from "../../data/ghana-stations";

/** Regional capitals and major Ghana cities for terminal onboarding. */
export const GHANA_MAJOR_CITIES = [
  "Accra",
  "Agona Swedru",
  "Akim Oda",
  "Aflao",
  "Bawku",
  "Bolgatanga",
  "Cape Coast",
  "Damongo",
  "Dunkwa-on-Offin",
  "Elmina",
  "Goaso",
  "Ho",
  "Hohoe",
  "Kasoa",
  "Kintampo",
  "Koforidua",
  "Kumasi",
  "Mampong",
  "Navrongo",
  "Nkawkaw",
  "Obuasi",
  "Sekondi-Takoradi",
  "Sunyani",
  "Tafo",
  "Tamale",
  "Tarkwa",
  "Techiman",
  "Tema",
  "Wa",
  "Winneba",
  "Yendi",
] as const;

const CANONICAL_CITY_BY_KEY = new Map<string, string>();
for (const city of GHANA_MAJOR_CITIES) {
  CANONICAL_CITY_BY_KEY.set(city.toLowerCase(), city);
}
for (const city of GHANA_STATIONS.map((station) => station.city.trim()).filter(Boolean)) {
  const key = city.toLowerCase();
  if (!CANONICAL_CITY_BY_KEY.has(key)) {
    CANONICAL_CITY_BY_KEY.set(key, city);
  }
}

export function normalizeGhanaCity(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function resolveGhanaCityName(value: string) {
  const normalized = normalizeGhanaCity(value);
  if (!normalized) return normalized;
  return CANONICAL_CITY_BY_KEY.get(normalized.toLowerCase()) ?? normalized;
}

/** Cities from seeded station data plus major hubs (sorted, unique). */
export const GHANA_CITIES = mergeGhanaCities(
  GHANA_MAJOR_CITIES,
  GHANA_STATIONS.map((station) => station.city),
);

export function isKnownGhanaCity(value: string, cities: readonly string[] = GHANA_CITIES) {
  const normalized = normalizeGhanaCity(value).toLowerCase();
  return cities.some((city) => city.toLowerCase() === normalized);
}

export function mergeGhanaCities(...lists: Array<readonly string[] | string[]>) {
  const byKey = new Map<string, string>();
  for (const city of lists.flat()) {
    const resolved = resolveGhanaCityName(city);
    if (!resolved) continue;
    const key = resolved.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, resolved);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}
