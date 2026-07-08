export function isSameBranchCity(stationCity: string, leadCity: string): boolean {
  return stationCity.trim().toLowerCase() === leadCity.trim().toLowerCase();
}
