import type { ThresholdSettings } from '../types';
import { THRESHOLD_RANGES, isWithinRange } from '../utils/validation';

/**
 * Clinical triage thresholds.
 *
 * These are the single source of truth for both the decoder (which classifies
 * inbound SMS telemetry) and the Settings page (which edits them). A default
 * the decoder and the settings UI disagree about is a clinical bug, so both
 * read from here.
 */
export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  spo2Critical: 80,
  spo2Warning: 90,
  hrCriticalHigh: 150,
  hrWarningHigh: 120,
  hrCriticalLow: 50,
  tempFeverHigh: 38.5,
  fallAccelG: 3.0,
  gsmBaudRate: 115200,
  gsmPort: 'COM4 / /dev/ttyUSB0 (Ethio-Telecom Gateway)'
};

/**
 * Every threshold that holds a number, in display order.
 *
 * Exported because the settings form, the validator and the test suite all need
 * to enumerate the same set: a key added to `ThresholdSettings` but missed here
 * would silently skip validation.
 */
export const NUMERIC_THRESHOLD_KEYS = [
  'spo2Critical',
  'spo2Warning',
  'hrCriticalHigh',
  'hrWarningHigh',
  'hrCriticalLow',
  'tempFeverHigh',
  'fallAccelG'
] as const;

export type NumericThresholdKey = (typeof NUMERIC_THRESHOLD_KEYS)[number];

export const NUMERIC_THRESHOLD_LABELS: Record<NumericThresholdKey, string> = {
  spo2Critical: 'SpO₂ critical below',
  spo2Warning: 'SpO₂ warning below',
  hrCriticalHigh: 'Heart rate critical above',
  hrWarningHigh: 'Heart rate warning above',
  hrCriticalLow: 'Heart rate critical below',
  tempFeverHigh: 'Fever above',
  fallAccelG: 'Fall impact above'
};

/**
 * Validates a threshold set, returning operator-readable messages.
 *
 * Two kinds of check: each value inside its sane range, and the bands ordered
 * sensibly relative to each other. An inverted pair (warning above critical)
 * produces a triage tree whose AMBER branch can never be reached, which is the
 * sort of bug that only surfaces during an actual emergency.
 */
export function validateThresholds(settings: ThresholdSettings): string[] {
  const errors: string[] = [];

  for (const key of NUMERIC_THRESHOLD_KEYS) {
    if (!isWithinRange(settings[key], THRESHOLD_RANGES[key])) {
      errors.push(
        `${NUMERIC_THRESHOLD_LABELS[key]} must be between ${THRESHOLD_RANGES[key].min} and ${THRESHOLD_RANGES[key].max}.`
      );
    }
  }

  if (settings.spo2Critical >= settings.spo2Warning) {
    errors.push('SpO₂ critical threshold must sit below the warning threshold.');
  }
  if (settings.hrWarningHigh >= settings.hrCriticalHigh) {
    errors.push('Heart rate warning threshold must sit below the critical threshold.');
  }
  if (settings.hrCriticalLow >= settings.hrWarningHigh) {
    errors.push('Low heart rate threshold must sit below the high warning threshold.');
  }
  if (settings.gsmPort.trim().length === 0) {
    errors.push('GSM gateway port cannot be empty.');
  }

  return errors;
}
