import { GHANA_STATIONS } from "../../data/ghana-stations";

/** Major Ghana cities used for terminal onboarding and station filters. */
export const GHANA_CITIES = Array.from(
  new Set(GHANA_STATIONS.map((station) => station.city.trim()).filter(Boolean)),
).sort((a, b) => a.localeCompare(b));
