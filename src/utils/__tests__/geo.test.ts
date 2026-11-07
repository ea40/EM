import { describe, expect, it } from 'vitest';
import { MIN_ETA_MINUTES, URBAN_TRAFFIC_MINUTES_PER_KM, estimateEtaMinutes, haversineKm } from '../geo';

describe('haversineKm', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm(9.03, 38.74, 9.03, 38.74)).toBe(0);
  });

  it('is symmetric between the two points', () => {
    const there = haversineKm(9.0124, 38.7612, 9.03, 38.74);
    const back = haversineKm(9.03, 38.74, 9.0124, 38.7612);
    expect(there).toBeCloseTo(back, 10);
  });

  it('matches a known Addis Ababa distance within a kilometre', () => {
    // Bole International Airport to Meskel Square is roughly 6 km.
    const km = haversineKm(8.9779, 38.7993, 9.0105, 38.7613);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(7);
  });

  it('measures one degree of latitude as about 111 km', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });

  it('handles antipodal points without returning NaN', () => {
    const km = haversineKm(0, 0, 0, 180);
    expect(Number.isFinite(km)).toBe(true);
    expect(km).toBeCloseTo(20015, 0);
  });
});

describe('estimateEtaMinutes', () => {
  it('multiplies distance by the observed urban traffic factor', () => {
    expect(estimateEtaMinutes(10)).toBe(Math.round(10 * URBAN_TRAFFIC_MINUTES_PER_KM));
  });

  it('floors the result so an ETA never reads as instantaneous', () => {
    expect(estimateEtaMinutes(0)).toBe(MIN_ETA_MINUTES);
    expect(estimateEtaMinutes(0.1)).toBe(MIN_ETA_MINUTES);
  });

  it('accepts a caller-supplied floor', () => {
    expect(estimateEtaMinutes(0.1, 5)).toBe(5);
  });
});
