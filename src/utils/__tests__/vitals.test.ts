import { describe, expect, it } from 'vitest';
import type { ThresholdSettings } from '../../types';
import { DEFAULT_THRESHOLDS } from '../../config/thresholds';
import {
  heartRateSeverity,
  impactSeverity,
  spo2Severity,
  temperatureSeverity
} from '../vitals';

const withOverrides = (overrides: Partial<ThresholdSettings>): ThresholdSettings => ({
  ...DEFAULT_THRESHOLDS,
  ...overrides
});

describe('spo2Severity', () => {
  it('does not call a reading critical until it is below the critical floor', () => {
    expect(spo2Severity(DEFAULT_THRESHOLDS.spo2Critical, DEFAULT_THRESHOLDS)).toBe('warning');
    expect(spo2Severity(DEFAULT_THRESHOLDS.spo2Critical - 1, DEFAULT_THRESHOLDS)).toBe('critical');
  });

  it('does not call a reading a warning until it is below the warning floor', () => {
    expect(spo2Severity(DEFAULT_THRESHOLDS.spo2Warning, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(spo2Severity(DEFAULT_THRESHOLDS.spo2Warning - 1, DEFAULT_THRESHOLDS)).toBe('warning');
  });

  it('regression: default thresholds must not paint a warning reading as critical', () => {
    /*
     * The queue hardcoded `< 85` for red, but the decoder scores RED only below
     * `spo2Critical` (80). SpO₂ 82 therefore raised an AMBER alert and was then
     * painted critical red in the same card — the exact self-contradiction this
     * helper exists to remove.
     */
    expect(spo2Severity(82, DEFAULT_THRESHOLDS)).toBe('warning');
    expect(spo2Severity(82, DEFAULT_THRESHOLDS)).not.toBe('critical');
  });

  it('regression: a stable reading must not be painted as a warning', () => {
    // 91 is above the 90 warning floor, so the decoder scores it GREEN.
    expect(spo2Severity(91, DEFAULT_THRESHOLDS)).toBe('normal');
  });

  it('follows an operator-overridden floor', () => {
    const strict = withOverrides({ spo2Critical: 96, spo2Warning: 98 });
    expect(spo2Severity(95, strict)).toBe('critical');
    expect(spo2Severity(97, strict)).toBe('warning');
    expect(spo2Severity(99, strict)).toBe('normal');
  });
});

describe('heartRateSeverity', () => {
  it('escalates above the critical ceiling', () => {
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrCriticalHigh, DEFAULT_THRESHOLDS)).toBe(
      'warning'
    );
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrCriticalHigh + 1, DEFAULT_THRESHOLDS)).toBe(
      'critical'
    );
  });

  it('warns above the high warning band', () => {
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrWarningHigh, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrWarningHigh + 1, DEFAULT_THRESHOLDS)).toBe(
      'warning'
    );
  });

  it('treats bradycardia as elevated rather than critical, matching the decoder', () => {
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrCriticalLow, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(heartRateSeverity(DEFAULT_THRESHOLDS.hrCriticalLow - 1, DEFAULT_THRESHOLDS)).toBe(
      'warning'
    );
    expect(heartRateSeverity(30, DEFAULT_THRESHOLDS)).not.toBe('critical');
  });

  it('regression: 145 beats per minute is elevated, not critical', () => {
    // The queue hardcoded `> 140` as red while the decoder scores RED only
    // above `hrCriticalHigh` (150).
    expect(heartRateSeverity(145, DEFAULT_THRESHOLDS)).toBe('warning');
  });

  it('follows an operator-overridden ceiling', () => {
    const strict = withOverrides({ hrWarningHigh: 100, hrCriticalHigh: 110 });
    expect(heartRateSeverity(105, strict)).toBe('warning');
    expect(heartRateSeverity(115, strict)).toBe('critical');
    expect(heartRateSeverity(80, strict)).toBe('normal');
  });
});

describe('temperatureSeverity', () => {
  it('never returns critical, because the decoder has no critical fever band', () => {
    for (const temp of [36.8, 38.5, 39.9, 41]) {
      expect(temperatureSeverity(temp, DEFAULT_THRESHOLDS)).not.toBe('critical');
    }
  });

  it('warns only strictly above the fever threshold', () => {
    expect(temperatureSeverity(DEFAULT_THRESHOLDS.tempFeverHigh, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(temperatureSeverity(DEFAULT_THRESHOLDS.tempFeverHigh + 0.1, DEFAULT_THRESHOLDS)).toBe(
      'warning'
    );
  });

  it('follows an operator-overridden fever threshold', () => {
    const strict = withOverrides({ tempFeverHigh: 37.5 });
    expect(temperatureSeverity(37.6, strict)).toBe('warning');
    expect(temperatureSeverity(37.4, strict)).toBe('normal');
  });
});

describe('impactSeverity', () => {
  it('flags an impact strictly above the configured g threshold', () => {
    expect(impactSeverity(DEFAULT_THRESHOLDS.fallAccelG, DEFAULT_THRESHOLDS)).toBe('normal');
    expect(impactSeverity(DEFAULT_THRESHOLDS.fallAccelG + 0.1, DEFAULT_THRESHOLDS)).toBe('critical');
  });
});
