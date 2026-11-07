import { describe, expect, it } from 'vitest';
import {
  COORDINATE_RANGES,
  DEVICE_SERIAL_PATTERN,
  THRESHOLD_RANGES,
  VITAL_RANGES,
  clamp,
  isWithinRange,
  isValidDeviceSerial,
  toFiniteNumber
} from '../validation';

describe('clamp', () => {
  it('returns the value when it sits inside the range', () => {
    expect(clamp(75, 0, 300)).toBe(75);
  });

  it('pins values below the floor and above the ceiling', () => {
    expect(clamp(-10, 0, 300)).toBe(0);
    expect(clamp(9999, 0, 300)).toBe(300);
  });

  it('pins non-finite input to the nearer bound', () => {
    expect(clamp(Number.NaN, 20, 45)).toBe(20);
    expect(clamp(Number.POSITIVE_INFINITY, 20, 45)).toBe(45);
  });

  it('handles negative ranges such as accelerometer axes', () => {
    expect(clamp(-20, VITAL_RANGES.acceleration.min, VITAL_RANGES.acceleration.max)).toBe(-16);
  });
});

describe('toFiniteNumber', () => {
  it('passes numeric input through unchanged', () => {
    expect(toFiniteNumber(42.5, 0)).toBe(42.5);
  });

  it('parses a numeric string', () => {
    expect(toFiniteNumber('138', 0)).toBe(138);
  });

  it('parses a leading numeric prefix and discards the suffix', () => {
    expect(toFiniteNumber('89%', 0)).toBe(89);
  });

  it('returns the fallback for empty, nullish and non-numeric input', () => {
    expect(toFiniteNumber('', 7)).toBe(7);
    expect(toFiniteNumber(null, 7)).toBe(7);
    expect(toFiniteNumber(undefined, 7)).toBe(7);
    expect(toFiniteNumber('not-a-number', 7)).toBe(7);
  });

  it('rejects NaN and Infinity rather than letting them reach state', () => {
    expect(toFiniteNumber(Number.NaN, 7)).toBe(7);
    expect(toFiniteNumber(Number.POSITIVE_INFINITY, 7)).toBe(7);
    expect(toFiniteNumber('Infinity', 7)).toBe(7);
  });
});

describe('isWithinRange', () => {
  it('accepts values on both boundaries', () => {
    expect(isWithinRange(-90, COORDINATE_RANGES.lat)).toBe(true);
    expect(isWithinRange(90, COORDINATE_RANGES.lat)).toBe(true);
  });

  it('rejects out-of-range and non-finite values', () => {
    expect(isWithinRange(90.0001, COORDINATE_RANGES.lat)).toBe(false);
    expect(isWithinRange(Number.NaN, COORDINATE_RANGES.lat)).toBe(false);
  });
});

describe('isValidDeviceSerial', () => {
  it('accepts the EB serials the decoder emits', () => {
    expect(isValidDeviceSerial('EB-104')).toBe(true);
    expect(isValidDeviceSerial('EB-UNKNOWN')).toBe(true);
  });

  it('caps the serial at 24 characters', () => {
    expect(DEVICE_SERIAL_PATTERN.test('E'.repeat(24))).toBe(true);
    expect(DEVICE_SERIAL_PATTERN.test('E'.repeat(25))).toBe(false);
  });

  it('rejects markup, separators and empty input', () => {
    expect(isValidDeviceSerial('')).toBe(false);
    expect(isValidDeviceSerial('<script>alert(1)</script>')).toBe(false);
    expect(isValidDeviceSerial('-EB104')).toBe(false);
    expect(isValidDeviceSerial('EB 104')).toBe(false);
    expect(isValidDeviceSerial('EB#104')).toBe(false);
  });
});

describe('threshold ranges', () => {
  it('keeps every range ordered', () => {
    for (const [key, range] of Object.entries(THRESHOLD_RANGES)) {
      expect(range.min, `${key} min must be below max`).toBeLessThan(range.max);
    }
  });

  it('keeps the critical SpO2 floor above zero so a cleared field cannot read as stable', () => {
    expect(THRESHOLD_RANGES.spo2Critical.min).toBeGreaterThan(0);
  });
});
