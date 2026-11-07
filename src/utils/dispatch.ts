import type { AmbulanceUnit, HospitalNode, Location } from '../types';
import { estimateEtaMinutes, haversineKm } from './geo';

/** A hospital plus the cost of reaching it from a given distress location. */
export type RouteEstimate = {
  hospital: HospitalNode;
  distanceKm: number;
  etaMinutes: number;
};

/**
 * Every hospital, nearest first, each with its drive-time estimate.
 *
 * The dispatch dialog ranks rather than merely picking a winner: an operator
 * overriding the recommendation needs to see the alternatives and their cost,
 * not just a single suggestion.
 */
export function rankHospitalsByDistance(
  location: Location,
  hospitals: readonly HospitalNode[]
): RouteEstimate[] {
  return hospitals
    .map(hospital => {
      const distanceKm = haversineKm(location.lat, location.lng, hospital.lat, hospital.lng);
      return { hospital, distanceKm, etaMinutes: estimateEtaMinutes(distanceKm) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Nearest receiving hospital to a distress location.
 *
 * Straight-line distance is the honest measure available here: the console has
 * no road graph, and the ETA multiplies by an observed urban traffic factor
 * (see `geo.ts`). Returns `null` when the hospital list is empty so callers must
 * handle "no destination" rather than silently routing to a phantom node.
 */
export function estimateNearestHospital(
  location: Location,
  hospitals: readonly HospitalNode[]
): RouteEstimate | null {
  return rankHospitalsByDistance(location, hospitals)[0] ?? null;
}

/**
 * Ambulances attached to a hospital that can be dispatched right now.
 *
 * `MAINTENANCE` units are excluded; `EN_ROUTE` / `ON_SCENE` units are shown
 * separately in the picker as unavailable rather than silently filtered, so an
 * operator can see the whole fleet state while choosing.
 */
export function selectDispatchableAmbulances(
  fleet: readonly AmbulanceUnit[],
  hospitalId: string
): AmbulanceUnit[] {
  return fleet.filter(unit => unit.hospitalId === hospitalId && unit.status === 'AVAILABLE');
}

/** Preferred ambulance for a hospital: first available, else none. */
export function selectDefaultAmbulance(
  fleet: readonly AmbulanceUnit[],
  hospitalId: string
): AmbulanceUnit | null {
  return selectDispatchableAmbulances(fleet, hospitalId)[0] ?? null;
}

/** Fleet-wide count of units that can be dispatched right now. */
export function dispatchableAmbulanceCount(fleet: readonly AmbulanceUnit[]): number {
  return fleet.filter(unit => unit.status === 'AVAILABLE').length;
}

/**
 * Ambulances from one hospital currently committed to an incident.
 *
 * The live counterpart to `dispatchableAmbulanceCount`. `ON_SCENE` counts as
 * deployed: the unit is at a patient and is not taking a new call, which is
 * exactly what "not ready" means to the operator reading the hub card.
 */
export function deployedAmbulanceCount(
  fleet: readonly AmbulanceUnit[],
  hospitalId: string
): number {
  return fleet.filter(
    unit =>
      unit.hospitalId === hospitalId && (unit.status === 'EN_ROUTE' || unit.status === 'ON_SCENE')
  ).length;
}
