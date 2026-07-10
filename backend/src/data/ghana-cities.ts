import { GHANA_STATIONS } from './ghana-stations';

export const GHANA_MAJOR_CITIES = [
  'Accra',
  'Agona Swedru',
  'Akim Oda',
  'Aflao',
  'Bawku',
  'Bolgatanga',
  'Cape Coast',
  'Damongo',
  'Dunkwa-on-Offin',
  'Elmina',
  'Goaso',
  'Ho',
  'Hohoe',
  'Kasoa',
  'Kintampo',
  'Koforidua',
  'Kumasi',
  'Mampong',
  'Navrongo',
  'Nkawkaw',
  'Obuasi',
  'Sekondi-Takoradi',
  'Sunyani',
  'Tafo',
  'Tamale',
  'Tarkwa',
  'Techiman',
  'Tema',
  'Wa',
  'Winneba',
  'Yendi',
] as const;

export const GHANA_CITIES = Array.from(
  new Set([
    ...GHANA_MAJOR_CITIES,
    ...GHANA_STATIONS.map((station) => station.city.trim()).filter(Boolean),
  ]),
).sort((a, b) => a.localeCompare(b));

export function mergeGhanaCities(...lists: Array<readonly string[] | string[]>) {
  return Array.from(
    new Set(lists.flat().map((city) => city.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}
