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

/** Cities from seeded station data plus major hubs (sorted, unique). */
export const GHANA_CITIES = Array.from(
  new Set([
    ...GHANA_MAJOR_CITIES,
    ...GHANA_STATIONS.map((station) => station.city.trim()).filter(Boolean),
  ]),
).sort((a, b) => a.localeCompare(b));

export function normalizeGhanaCity(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isKnownGhanaCity(value: string, cities: readonly string[] = GHANA_CITIES) {
  const normalized = normalizeGhanaCity(value).toLowerCase();
  return cities.some((city) => city.toLowerCase() === normalized);
}

export function mergeGhanaCities(...lists: Array<readonly string[] | string[]>) {
  return Array.from(
    new Set(lists.flat().map((city) => normalizeGhanaCity(city)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}
