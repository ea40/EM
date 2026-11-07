import type { EventType, ThresholdSettings, TriageCode, VitalMetrics } from '../types';
import { DEFAULT_THRESHOLDS } from '../config/thresholds';
import { formatClockTime } from './format';
import {
  COORDINATE_RANGES,
  VITAL_RANGES,
  clamp,
  isWithinRange,
  isValidDeviceSerial,
  toFiniteNumber
} from './validation';

export interface DecodedSMS {
  deviceSerial: string;
  eventType: EventType;
  lat: number;
  lng: number;
  vitals: VitalMetrics;
  triageCode: TriageCode;
  distressSummary: string;
  rawString: string;
  /** Fields the decoder rejected or coerced, for the operator-facing decode log. */
  warnings: string[];
}

const FALLBACK_SERIAL = 'EB-UNKNOWN';

const DEFAULTS = {
  lat: 9.03,
  lng: 38.74,
  hr: 75,
  spo2: 98,
  temp: 37.0,
  battery: 90,
  accelX: 0.0,
  accelY: 0.0,
  accelZ: 0.98
} as const;

/**
 * True for a bare `lat,lng` pair.
 *
 * The `:` test is what separates a coordinate from a keyed field: the firmware
 * never emits a telemetry key without one, and a coordinate never carries one.
 */
function isBareCoordinatePair(part: string): boolean {
  return part.includes(',') && !part.includes(':');
}

/**
 * Decodes raw GSM SMS strings transmitted by SIM800 / SIM7000 modules on
 * EMER-BRACE wearable units.
 *
 * Example payload:
 * `EB-104#FALL_DETECTED#9.0124,38.7612#HR:138#SPO2:91#TMP:37.4#BAT:89%#ACC:3.2,1.8,0.15`
 *
 * The payload arrives over a serial gateway and is treated as untrusted: every
 * field is validated against a range or pattern before it reaches state, and
 * anything rejected is recorded in `warnings` rather than silently accepted.
 */
export function decodeGSMSMS(
  rawPayload: string,
  thresholds: ThresholdSettings = DEFAULT_THRESHOLDS
): DecodedSMS {
  const warnings: string[] = [];
  const cleanStr = String(rawPayload ?? '').trim();
  const parts = cleanStr.split('#');

  // --- Device serial -------------------------------------------------------
  const rawSerial = parts[0] ?? '';
  let deviceSerial = FALLBACK_SERIAL;
  if (isValidDeviceSerial(rawSerial)) {
    deviceSerial = rawSerial;
  } else if (rawSerial.length > 0) {
    warnings.push(`Rejected device serial "${rawSerial.slice(0, 24)}" — not a valid EB serial.`);
  }

  // --- Event type ----------------------------------------------------------
  let eventType: EventType = 'ROUTINE_TELEMETRY';
  let isFall = false;
  let isSos = false;

  if (parts.length >= 2) {
    const rawEvent = (parts[1] ?? '').toUpperCase();
    if (rawEvent.includes('MANUAL_SOS') || rawEvent.includes('SOS')) {
      eventType = 'MANUAL_SOS';
      isSos = true;
    } else if (rawEvent.includes('FALL')) {
      eventType = 'FALL_DETECTED';
      isFall = true;
    } else if (rawEvent.includes('ARRHYTHMIA')) {
      eventType = 'ARRHYTHMIA_DETECTED';
    } else if (rawEvent.includes('HYPOXIA') || rawEvent.includes('SPO2')) {
      eventType = 'CRITICAL_HYPOXIA';
    } else if (rawEvent.includes('TACHY')) {
      eventType = 'TACHYCARDIAC_SPIKE';
    }
  }

  // --- Telemetry fields ----------------------------------------------------
  /*
   * Annotated `number` because `DEFAULTS` is `as const`: each of its properties
   * carries a literal type (`75`, `98`, `9.03`), and a literal type that is not
   * freshly inferred does not widen on assignment. Without the annotation every
   * `x = clamp(...)` below is "number is not assignable to 75".
   */
  let lat: number = DEFAULTS.lat;
  let lng: number = DEFAULTS.lng;
  let hr: number = DEFAULTS.hr;
  let spo2: number = DEFAULTS.spo2;
  let temp: number = DEFAULTS.temp;
  let bat: number = DEFAULTS.battery;
  let accelX: number = DEFAULTS.accelX;
  let accelY: number = DEFAULTS.accelY;
  let accelZ: number = DEFAULTS.accelZ;

  for (let i = 2; i < parts.length; i++) {
    const part = parts[i] ?? '';

    /*
     * Keyed fields are matched before the coordinate pair below. `ACC:` carries
     * its own comma-separated triple, so a coordinate test that merely looks for
     * a comma reads the accelerometer's y-axis as a longitude and silently
     * relocates the patient — a fall alert would be plotted in the Atlantic.
     */
    if (part.startsWith('HR:')) {
      hr = clamp(
        toFiniteNumber(part.slice(3), DEFAULTS.hr),
        VITAL_RANGES.heartRate.min,
        VITAL_RANGES.heartRate.max
      );
    } else if (part.startsWith('SPO2:')) {
      spo2 = clamp(
        toFiniteNumber(part.slice(5).replace('%', ''), DEFAULTS.spo2),
        VITAL_RANGES.spo2.min,
        VITAL_RANGES.spo2.max
      );
    } else if (part.startsWith('TMP:')) {
      temp = clamp(
        toFiniteNumber(part.slice(4), DEFAULTS.temp),
        VITAL_RANGES.temperature.min,
        VITAL_RANGES.temperature.max
      );
    } else if (part.startsWith('BAT:')) {
      bat = clamp(
        toFiniteNumber(part.slice(4).replace('%', ''), DEFAULTS.battery),
        VITAL_RANGES.battery.min,
        VITAL_RANGES.battery.max
      );
    } else if (part.startsWith('ACC:')) {
      const axes = part.slice(4).split(',');
      if (axes.length >= 3) {
        accelX = clamp(
          toFiniteNumber(axes[0], 0),
          VITAL_RANGES.acceleration.min,
          VITAL_RANGES.acceleration.max
        );
        accelY = clamp(
          toFiniteNumber(axes[1], 0),
          VITAL_RANGES.acceleration.min,
          VITAL_RANGES.acceleration.max
        );
        accelZ = clamp(
          toFiniteNumber(axes[2], DEFAULTS.accelZ),
          VITAL_RANGES.acceleration.min,
          VITAL_RANGES.acceleration.max
        );
      } else {
        warnings.push(`Ignored malformed accelerometer field "${part}".`);
      }
    } else if (isBareCoordinatePair(part)) {
      // Coordinates, e.g. `9.0124,38.7612`
      const [rawLat, rawLng] = part.split(',');
      const parsedLat = toFiniteNumber(rawLat, Number.NaN);
      const parsedLng = toFiniteNumber(rawLng, Number.NaN);

      if (isWithinRange(parsedLat, COORDINATE_RANGES.lat)) {
        lat = parsedLat;
      } else if (rawLat !== undefined) {
        warnings.push(`Rejected latitude "${rawLat}" — outside ±90.`);
      }
      if (isWithinRange(parsedLng, COORDINATE_RANGES.lng)) {
        lng = parsedLng;
      } else if (rawLng !== undefined) {
        warnings.push(`Rejected longitude "${rawLng}" — outside ±180.`);
      }
    }
  }

  // --- Triage classification ----------------------------------------------
  const impactG = Math.abs(accelX) + Math.abs(accelY);
  const { triageCode, distressSummary } = classifyTriage({
    isSos,
    isFall,
    impactG,
    spo2,
    hr,
    temp,
    thresholds
  });

  return {
    deviceSerial,
    eventType,
    lat,
    lng,
    vitals: {
      heartRate: hr,
      spo2,
      temperature: temp,
      battery: bat,
      gsmSignal: 4,
      accelX,
      accelY,
      accelZ,
      isFallDetected: isFall,
      isSosPressed: isSos,
      lastUpdated: formatClockTime()
    },
    triageCode,
    distressSummary,
    rawString: cleanStr,
    warnings
  };
}

interface TriageInput {
  isSos: boolean;
  isFall: boolean;
  impactG: number;
  spo2: number;
  hr: number;
  temp: number;
  thresholds: ThresholdSettings;
}

/** Ordered clinical decision tree: first match wins, RED before AMBER. */
function classifyTriage(input: TriageInput): { triageCode: TriageCode; distressSummary: string } {
  const { isSos, isFall, impactG, spo2, hr, temp, thresholds } = input;

  if (isSos) {
    return { triageCode: 'RED', distressSummary: 'MANUAL SOS PRESSED BY WEARABLE USER' };
  }
  if (isFall || impactG > thresholds.fallAccelG) {
    return {
      triageCode: 'RED',
      distressSummary: `CRITICAL FALL DETECTED (Impact: ${impactG.toFixed(1)}g)`
    };
  }
  if (spo2 < thresholds.spo2Critical) {
    return {
      triageCode: 'RED',
      distressSummary: `CRITICAL HYPOXIA (SpO2: ${spo2}% < ${thresholds.spo2Critical}%)`
    };
  }
  if (hr > thresholds.hrCriticalHigh) {
    return {
      triageCode: 'RED',
      distressSummary: `CARDIAC TACHYCARDIAC SPIKE (HR: ${hr} BPM > ${thresholds.hrCriticalHigh})`
    };
  }
  if (
    spo2 < thresholds.spo2Warning ||
    hr > thresholds.hrWarningHigh ||
    hr < thresholds.hrCriticalLow ||
    temp > thresholds.tempFeverHigh
  ) {
    return {
      triageCode: 'AMBER',
      distressSummary: `ELEVATED VITAL RISK (SpO2: ${spo2}%, HR: ${hr} BPM, Temp: ${temp}°C)`
    };
  }
  return { triageCode: 'GREEN', distressSummary: 'Vitals within normal range' };
}
