import type { ThresholdSettings } from '../types';

/**
 * How a single vital reading sits against the configured clinical thresholds.
 *
 * Mirrors the decoder's triage tree (`classifyTriage` in `gsmDecoder.ts`) so a
 * vital is painted the same colour the decoder used to raise the alert.
 *
 * The cutoffs used to be hardcoded in the components, which made the console
 * contradict itself under the *default* settings: SpO₂ 82 decoded AMBER (below
 * the 90 warning floor) while the queue painted it critical red, and SpO₂ 91
 * decoded GREEN while the queue painted it amber. Configurable thresholds are
 * pointless if the display ignores them.
 */
export type VitalSeverity = 'critical' | 'warning' | 'normal';

/**
 * Blood oxygen. Both bounds are clinical: below `spo2Critical` the decoder
 * raises RED, below `spo2Warning` it raises AMBER, above both it is stable.
 */
export function spo2Severity(spo2: number, thresholds: ThresholdSettings): VitalSeverity {
  if (spo2 < thresholds.spo2Critical) return 'critical';
  if (spo2 < thresholds.spo2Warning) return 'warning';
  return 'normal';
}

/**
 * Heart rate. Deliberately asymmetric, matching the decoder: a rate above
 * `hrCriticalHigh` is RED, but a rate below `hrCriticalLow` is only AMBER —
 * bradycardia escalates to elevated, not critical, in this triage tree.
 */
export function heartRateSeverity(
  heartRate: number,
  thresholds: ThresholdSettings
): VitalSeverity {
  if (heartRate > thresholds.hrCriticalHigh) return 'critical';
  if (heartRate > thresholds.hrWarningHigh || heartRate < thresholds.hrCriticalLow) return 'warning';
  return 'normal';
}

/**
 * Body temperature. Fever has no critical band in the decoder — anything above
 * `tempFeverHigh` is AMBER and nothing more.
 */
export function temperatureSeverity(
  temperature: number,
  thresholds: ThresholdSettings
): VitalSeverity {
  if (temperature > thresholds.tempFeverHigh) return 'warning';
  return 'normal';
}

/**
 * Fall impact force, in g.
 *
 * Matches the decoder's own rule: a detected fall is RED outright, and an
 * impact above `fallAccelG` is RED whether or not the firmware flagged a fall.
 */
export function impactSeverity(impactG: number, thresholds: ThresholdSettings): VitalSeverity {
  if (impactG > thresholds.fallAccelG) return 'critical';
  return 'normal';
}
