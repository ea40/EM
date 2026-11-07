/** Great-circle distance and ETA estimation for Addis Ababa dispatch routing. */

const EARTH_RADIUS_KM = 6371;

/** Observed urban traffic factor for Addis Ababa — minutes of travel per km. */
export const URBAN_TRAFFIC_MINUTES_PER_KM = 3.2;

/** Floor applied so an ETA never reads as instantaneous. */
export const MIN_ETA_MINUTES = 2;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Haversine great-circle distance between two coordinates, in kilometres. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Converts a distance in km to a whole-minute ETA, floored at `minMinutes`. */
export function estimateEtaMinutes(
  distanceKm: number,
  minMinutes: number = MIN_ETA_MINUTES
): number {
  return Math.max(minMinutes, Math.round(distanceKm * URBAN_TRAFFIC_MINUTES_PER_KM));
}
