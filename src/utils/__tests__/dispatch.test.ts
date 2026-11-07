import { describe, expect, it } from 'vitest';
import type { AmbulanceUnit, HospitalNode, Location } from '../../types';
import {
  deployedAmbulanceCount,
  dispatchableAmbulanceCount,
  estimateNearestHospital,
  rankHospitalsByDistance,
  selectDefaultAmbulance,
  selectDispatchableAmbulances
} from '../dispatch';

const origin: Location = {
  lat: 9.03,
  lng: 38.74,
  subCity: 'Bole Sub-City',
  address: 'Test reference point'
};

const hospital = (overrides: Partial<HospitalNode> & { id: string; lat: number; lng: number }): HospitalNode => ({
  name: `Hospital ${overrides.id}`,
  subCity: 'Bole Sub-City',
  phone: '+251 11 000 0000',
  type: 'General',
  availableAmbulances: 1,
  totalDispatchesToday: 0,
  ...overrides
});

const ambulance = (overrides: Partial<AmbulanceUnit> & { id: string }): AmbulanceUnit => ({
  hospitalId: 'H-1',
  hospitalName: 'Hospital H-1',
  status: 'AVAILABLE',
  driverName: 'Driver',
  paramedicName: 'Paramedic',
  phone: '+251 91 000 0000',
  fuelLevel: 80,
  currentSubCity: 'Bole Sub-City',
  ...overrides
});

describe('rankHospitalsByDistance', () => {
  const near = hospital({ id: 'NEAR', lat: 9.031, lng: 38.741 });
  const far = hospital({ id: 'FAR', lat: 9.25, lng: 38.95 });

  it('orders every hospital nearest first', () => {
    const ranked = rankHospitalsByDistance(origin, [far, near]);
    expect(ranked.map(r => r.hospital.id)).toEqual(['NEAR', 'FAR']);
    expect(ranked[0]!.distanceKm).toBeLessThan(ranked[1]!.distanceKm);
  });

  it('attaches an ETA to every entry so an operator can compare the alternatives', () => {
    const ranked = rankHospitalsByDistance(origin, [far, near]);
    expect(ranked.every(r => r.etaMinutes > 0)).toBe(true);
  });

  it('does not mutate the caller-supplied hospital list', () => {
    const hospitals = [far, near];
    rankHospitalsByDistance(origin, hospitals);
    expect(hospitals.map(h => h.id)).toEqual(['FAR', 'NEAR']);
  });

  it('returns an empty ranking for an empty hospital list', () => {
    expect(rankHospitalsByDistance(origin, [])).toEqual([]);
  });
});

describe('estimateNearestHospital', () => {
  it('picks the closest hospital', () => {
    const near = hospital({ id: 'NEAR', lat: 9.031, lng: 38.741 });
    const far = hospital({ id: 'FAR', lat: 9.25, lng: 38.95 });
    expect(estimateNearestHospital(origin, [far, near])?.hospital.id).toBe('NEAR');
  });

  it('returns null rather than a phantom destination when no hospital exists', () => {
    expect(estimateNearestHospital(origin, [])).toBeNull();
  });
});

describe('selectDispatchableAmbulances', () => {
  const fleet = [
    ambulance({ id: 'A-1', hospitalId: 'H-1', status: 'AVAILABLE' }),
    ambulance({ id: 'A-2', hospitalId: 'H-1', status: 'EN_ROUTE' }),
    ambulance({ id: 'A-3', hospitalId: 'H-1', status: 'MAINTENANCE' }),
    ambulance({ id: 'A-4', hospitalId: 'H-2', status: 'AVAILABLE' })
  ];

  it('returns only available units belonging to the requested hospital', () => {
    expect(selectDispatchableAmbulances(fleet, 'H-1').map(u => u.id)).toEqual(['A-1']);
  });

  it('excludes units in maintenance and units already committed', () => {
    const ids = selectDispatchableAmbulances(fleet, 'H-1').map(u => u.id);
    expect(ids).not.toContain('A-2');
    expect(ids).not.toContain('A-3');
  });

  it('returns an empty list for a hospital with no available units', () => {
    expect(selectDispatchableAmbulances(fleet, 'H-3')).toEqual([]);
  });
});

describe('selectDefaultAmbulance', () => {
  it('prefers the first available unit at the hospital', () => {
    const fleet = [
      ambulance({ id: 'A-9', hospitalId: 'H-1', status: 'EN_ROUTE' }),
      ambulance({ id: 'A-1', hospitalId: 'H-1', status: 'AVAILABLE' })
    ];
    expect(selectDefaultAmbulance(fleet, 'H-1')?.id).toBe('A-1');
  });

  it('returns null when the hospital has nothing to send', () => {
    expect(selectDefaultAmbulance([], 'H-1')).toBeNull();
  });
});

describe('dispatchableAmbulanceCount', () => {
  it('counts available units across the whole fleet', () => {
    const fleet = [
      ambulance({ id: 'A-1', status: 'AVAILABLE' }),
      ambulance({ id: 'A-2', status: 'AVAILABLE' }),
      ambulance({ id: 'A-3', status: 'ON_SCENE' }),
      ambulance({ id: 'A-4', status: 'MAINTENANCE' })
    ];
    expect(dispatchableAmbulanceCount(fleet)).toBe(2);
  });

  it('returns zero for an empty fleet', () => {
    expect(dispatchableAmbulanceCount([])).toBe(0);
  });
});

describe('deployedAmbulanceCount', () => {
  const fleet = [
    ambulance({ id: 'A-1', hospitalId: 'H-1', status: 'AVAILABLE' }),
    ambulance({ id: 'A-2', hospitalId: 'H-1', status: 'EN_ROUTE' }),
    ambulance({ id: 'A-3', hospitalId: 'H-1', status: 'ON_SCENE' }),
    ambulance({ id: 'A-4', hospitalId: 'H-1', status: 'MAINTENANCE' }),
    ambulance({ id: 'A-5', hospitalId: 'H-2', status: 'EN_ROUTE' })
  ];

  it('counts units committed to an incident at the requested hospital', () => {
    expect(deployedAmbulanceCount(fleet, 'H-1')).toBe(2);
  });

  it('counts on-scene as deployed and available and maintenance as not', () => {
    // One status per hospital, so a wrong filter surfaces as a wrong number
    // instead of coincidentally matching the expected total.
    const byStatus = [
      ambulance({ id: 'A-1', hospitalId: 'IDLE', status: 'AVAILABLE' }),
      ambulance({ id: 'A-2', hospitalId: 'ENROUTE', status: 'EN_ROUTE' }),
      ambulance({ id: 'A-3', hospitalId: 'SCENE', status: 'ON_SCENE' }),
      ambulance({ id: 'A-4', hospitalId: 'SHOP', status: 'MAINTENANCE' })
    ];

    expect(deployedAmbulanceCount(byStatus, 'ENROUTE')).toBe(1);
    expect(deployedAmbulanceCount(byStatus, 'SCENE')).toBe(1);
    expect(deployedAmbulanceCount(byStatus, 'IDLE')).toBe(0);
    expect(deployedAmbulanceCount(byStatus, 'SHOP')).toBe(0);
  });

  it('ignores deployments at other hospitals', () => {
    expect(deployedAmbulanceCount(fleet, 'H-2')).toBe(1);
  });

  it('returns zero for a hospital with nothing out', () => {
    expect(deployedAmbulanceCount(fleet, 'H-9')).toBe(0);
  });
});
