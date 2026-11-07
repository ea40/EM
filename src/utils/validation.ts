/**
 * Boundary validation and clamping for values originating outside the app.
 *
 * The GSM payload is untrusted input: it arrives as free text over a serial
 * gateway and is interpolated into the UI (bar widths, canvas scaling, popups).
 * Validate on the way in so nothing downstream has to defend itself.
 */

/** Numeric ranges for physiological telemetry read off a wearable. */
export const VITAL_RANGES = {
  heartRate: { min: 0, max: 300 },
  spo2: { min: 0, max: 100 },
  temperature: { min: 20, max: 45 },
  battery: { min: 0, max: 100 },
  acceleration: { min: -16, max: 16 }
} as const;

export const COORDINATE_RANGES = {
  lat: { min: -90, max: 90 },
  lng: { min: -180, max: 180 }
} as const;

/** Device serials: printable, bounded, no markup or separators we don't emit. */
export const DEVICE_SERIAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,23}$/;

/**
 * Editable bounds for each triage threshold.
 *
 * These are not clinical guidance — they are the ranges inside which a mistyped
 * value is still recognisably a threshold rather than a typo. Without a floor,
 * clearing the "SpO₂ critical" field yields 0 and every patient silently reads
 * as stable.
 */
export const THRESHOLD_RANGES = {
  spo2Critical: { min: 50, max: 95 },
  spo2Warning: { min: 55, max: 99 },
  hrCriticalHigh: { min: 90, max: 240 },
  hrWarningHigh: { min: 70, max: 220 },
  hrCriticalLow: { min: 20, max: 80 },
  tempFeverHigh: { min: 36, max: 43 },
  fallAccelG: { min: 1, max: 12 }
} as const;

/**
 * Constrains `value` to `[min, max]`.
 *
 * A non-finite value has no position to clamp from, so it takes the nearer
 * bound: `+Infinity` pins to the ceiling, and everything else — `-Infinity`,
 * `NaN`, and anything that failed to parse — falls to the floor. Sending
 * `+Infinity` to the floor would report an absurdly high reading as the lowest
 * possible one.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return value > 0 ? max : min;
  return Math.min(max, Math.max(min, value));
}

/** Parses a finite number, or returns `fallback` when the input is unusable. */
export function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isWithinRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

export function isValidDeviceSerial(value: string): boolean {
  return DEVICE_SERIAL_PATTERN.test(value);
}
