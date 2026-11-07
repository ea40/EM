import { describe, expect, it } from 'vitest';
import type { ThresholdSettings } from '../../types';
import {
  DEFAULT_THRESHOLDS,
  NUMERIC_THRESHOLD_KEYS,
  NUMERIC_THRESHOLD_LABELS,
  validateThresholds
} from '../thresholds';
import { THRESHOLD_RANGES } from '../../utils/validation';

const withOverrides = (overrides: Partial<ThresholdSettings>): ThresholdSettings => ({
  ...DEFAULT_THRESHOLDS,
  ...overrides
});

describe('DEFAULT_THRESHOLDS', () => {
  it('passes its own validator', () => {
    expect(validateThresholds(DEFAULT_THRESHOLDS)).toEqual([]);
  });

  it('names every numeric threshold', () => {
    for (const key of NUMERIC_THRESHOLD_KEYS) {
      expect(NUMERIC_THRESHOLD_LABELS[key], `${key} needs an operator label`).toBeTruthy();
    }
  });

  it('keeps the SpO2 bands ordered and the heart-rate bands ordered', () => {
    expect(DEFAULT_THRESHOLDS.spo2Critical).toBeLessThan(DEFAULT_THRESHOLDS.spo2Warning);
    expect(DEFAULT_THRESHOLDS.hrWarningHigh).toBeLessThan(DEFAULT_THRESHOLDS.hrCriticalHigh);
    expect(DEFAULT_THRESHOLDS.hrCriticalLow).toBeLessThan(DEFAULT_THRESHOLDS.hrWarningHigh);
  });
});

describe('validateThresholds', () => {
  it('accepts a threshold set that sits inside every range', () => {
    expect(validateThresholds(withOverrides({ spo2Critical: 85, spo2Warning: 92 }))).toEqual([]);
  });

  it('rejects a value below its sane range', () => {
    const errors = validateThresholds(withOverrides({ spo2Critical: 0 }));
    expect(errors.some(e => e.includes('SpO₂ critical'))).toBe(true);
  });

  it('rejects a value above its sane range', () => {
    const errors = validateThresholds(withOverrides({ hrCriticalHigh: 500 }));
    expect(errors.some(e => e.includes('Heart rate critical above'))).toBe(true);
  });

  it('rejects a non-finite value', () => {
    const errors = validateThresholds(withOverrides({ fallAccelG: Number.NaN }));
    expect(errors.some(e => e.includes('Fall impact'))).toBe(true);
  });

  it('rejects a critical SpO2 floor at or above the warning floor', () => {
    const errors = validateThresholds(withOverrides({ spo2Critical: 92, spo2Warning: 92 }));
    expect(errors).toContain('SpO₂ critical threshold must sit below the warning threshold.');
  });

  it('rejects a heart-rate warning at or above the critical ceiling', () => {
    const errors = validateThresholds(withOverrides({ hrWarningHigh: 160, hrCriticalHigh: 160 }));
    expect(errors).toContain(
      'Heart rate warning threshold must sit below the critical threshold.'
    );
  });

  it('rejects a low heart-rate floor at or above the high warning band', () => {
    const errors = validateThresholds(withOverrides({ hrCriticalLow: 120, hrWarningHigh: 120 }));
    expect(errors).toContain(
      'Low heart rate threshold must sit below the high warning threshold.'
    );
  });

  it('rejects an empty GSM port', () => {
    expect(validateThresholds(withOverrides({ gsmPort: '   ' }))).toContain(
      'GSM gateway port cannot be empty.'
    );
  });

  it('reports every problem at once rather than stopping at the first', () => {
    const errors = validateThresholds(
      withOverrides({ spo2Critical: 0, hrCriticalHigh: 500, gsmPort: '' })
    );
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('checks each numeric key against its own range', () => {
    for (const key of NUMERIC_THRESHOLD_KEYS) {
      const belowMin = Object.assign({}, DEFAULT_THRESHOLDS, {
        [key]: THRESHOLD_RANGES[key].min - 1
      });
      expect(belowMin[key]).toBe(THRESHOLD_RANGES[key].min - 1);
      expect(
        validateThresholds(belowMin).length,
        `${key} below its minimum must be reported`
      ).toBeGreaterThan(0);
    }
  });
});
