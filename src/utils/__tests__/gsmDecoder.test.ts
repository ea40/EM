import { describe, expect, it } from 'vitest';
import type { ThresholdSettings } from '../../types';
import { DEFAULT_THRESHOLDS } from '../../config/thresholds';
import { decodeGSMSMS } from '../gsmDecoder';

/**
 * The canonical payload the firmware emits, and the one every other test
 * varies a single field of.
 */
const CANONICAL =
  'EB-104#FALL_DETECTED#9.0124,38.7612#HR:138#SPO2:91#TMP:37.4#BAT:89%#ACC:3.2,1.8,0.15';

const GATEWAY_ORIGIN = { lat: 9.03, lng: 38.74 };

describe('decodeGSMSMS — device serial', () => {
  it('accepts a valid EB serial', () => {
    expect(decodeGSMSMS(CANONICAL).deviceSerial).toBe('EB-104');
  });

  it('falls back to EB-UNKNOWN and warns when the serial is malformed', () => {
    const decoded = decodeGSMSMS('<img src=x onerror=alert(1)>#MANUAL_SOS#9.03,38.74#HR:80');
    expect(decoded.deviceSerial).toBe('EB-UNKNOWN');
    expect(decoded.warnings.some(w => w.includes('Rejected device serial'))).toBe(true);
  });

  it('does not warn about an empty payload beyond the missing serial', () => {
    const decoded = decodeGSMSMS('');
    expect(decoded.deviceSerial).toBe('EB-UNKNOWN');
    expect(decoded.warnings).toHaveLength(0);
  });
});

describe('decodeGSMSMS — event classification', () => {
  it('recognises MANUAL_SOS and the bare SOS alias', () => {
    expect(decodeGSMSMS('EB-1#MANUAL_SOS#9.03,38.74').eventType).toBe('MANUAL_SOS');
    expect(decodeGSMSMS('EB-1#SOS#9.03,38.74').eventType).toBe('MANUAL_SOS');
  });

  it('recognises a fall, an arrhythmia, a hypoxia event and a tachycardiac spike', () => {
    expect(decodeGSMSMS('EB-1#FALL_DETECTED#9.03,38.74').eventType).toBe('FALL_DETECTED');
    expect(decodeGSMSMS('EB-1#ARRHYTHMIA#9.03,38.74').eventType).toBe('ARRHYTHMIA_DETECTED');
    expect(decodeGSMSMS('EB-1#HYPOXIA#9.03,38.74').eventType).toBe('CRITICAL_HYPOXIA');
    expect(decodeGSMSMS('EB-1#TACHY_SPIKE#9.03,38.74').eventType).toBe('TACHYCARDIAC_SPIKE');
  });

  it('defaults to routine telemetry for an unrecognised or absent event field', () => {
    expect(decodeGSMSMS('EB-1#HEARTBEAT#9.03,38.74').eventType).toBe('ROUTINE_TELEMETRY');
    expect(decodeGSMSMS('EB-1').eventType).toBe('ROUTINE_TELEMETRY');
  });

  it('is case-insensitive about the event token', () => {
    expect(decodeGSMSMS('EB-1#manual_sos#9.03,38.74').eventType).toBe('MANUAL_SOS');
  });
});

describe('decodeGSMSMS — telemetry parsing', () => {
  it('reads heart rate, SpO2, temperature and battery from a full payload', () => {
    const { vitals } = decodeGSMSMS(CANONICAL);
    expect(vitals.heartRate).toBe(138);
    expect(vitals.spo2).toBe(91);
    expect(vitals.temperature).toBe(37.4);
    expect(vitals.battery).toBe(89);
  });

  it('reads the coordinates and does not let the accelerometer field overwrite them', () => {
    // Regression: the accelerometer triple is itself comma-separated, so a
    // coordinate test that only looks for a comma reads its y-axis as a
    // longitude and places every fall alert in the Atlantic.
    const decoded = decodeGSMSMS(CANONICAL);
    expect(decoded.lat).toBeCloseTo(9.0124, 4);
    expect(decoded.lng).toBeCloseTo(38.7612, 4);
  });

  it('reads all three accelerometer axes', () => {
    const { vitals } = decodeGSMSMS(CANONICAL);
    expect(vitals.accelX).toBeCloseTo(3.2, 4);
    expect(vitals.accelY).toBeCloseTo(1.8, 4);
    expect(vitals.accelZ).toBeCloseTo(0.15, 4);
  });

  it('warns about a malformed accelerometer field rather than throwing', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#ACC:3.2');
    expect(decoded.warnings.some(w => w.includes('accelerometer'))).toBe(true);
  });

  it('tolerates fields arriving in any order', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#BAT:55%#HR:88#9.03,38.74#SPO2:97');
    expect(decoded.vitals.heartRate).toBe(88);
    expect(decoded.vitals.spo2).toBe(97);
    expect(decoded.vitals.battery).toBe(55);
    expect(decoded.lat).toBeCloseTo(9.03, 4);
  });

  it('strips the percent suffix from SpO2 and battery', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#SPO2:94%#BAT:12%');
    expect(decoded.vitals.spo2).toBe(94);
    expect(decoded.vitals.battery).toBe(12);
  });
});

describe('decodeGSMSMS — untrusted input handling', () => {
  it('clamps an out-of-range heart rate instead of accepting it', () => {
    expect(decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:9999').vitals.heartRate).toBe(300);
  });

  it('falls back to the default heart rate when the field is unparseable', () => {
    expect(decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:abc').vitals.heartRate).toBe(75);
  });

  it('rejects a latitude outside ±90 and warns', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#999,38.74');
    expect(decoded.lat).toBe(GATEWAY_ORIGIN.lat);
    expect(decoded.warnings.some(w => w.includes('Rejected latitude'))).toBe(true);
  });

  it('rejects a longitude outside ±180 and warns', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,9999');
    expect(decoded.lng).toBe(GATEWAY_ORIGIN.lng);
    expect(decoded.warnings.some(w => w.includes('Rejected longitude'))).toBe(true);
  });

  it('ignores unknown fields without warning about them', () => {
    const decoded = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#FW:v2.4.1');
    expect(decoded.warnings).toHaveLength(0);
  });

  it('never throws on hostile input', () => {
    const hostile = [
      '####',
      '\u0000\u0001',
      'EB-1#MANUAL_SOS#,,#HR::#SPO2:%',
      'a'.repeat(10_000),
      'EB-1#ACC:1,2,3,4,5'
    ];
    for (const payload of hostile) {
      expect(() => decodeGSMSMS(payload), payload.slice(0, 20)).not.toThrow();
    }
  });
});

describe('decodeGSMSMS — triage classification', () => {
  const classify = (payload: string, thresholds?: ThresholdSettings) =>
    decodeGSMSMS(payload, thresholds).triageCode;

  it('raises RED on a manual SOS even when every vital is normal', () => {
    expect(classify('EB-1#MANUAL_SOS#9.03,38.74#HR:72#SPO2:99#TMP:36.8')).toBe('RED');
  });

  it('raises RED on a detected fall', () => {
    expect(classify('EB-1#FALL_DETECTED#9.03,38.74#HR:72#SPO2:99')).toBe('RED');
  });

  it('raises RED when the measured impact exceeds the fall threshold', () => {
    // 2.0g + 1.5g = 3.5g, above the 3.0g default.
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:72#SPO2:99#ACC:2.0,1.5,0.1')).toBe('RED');
  });

  it('does not raise RED when the impact sits below the fall threshold', () => {
    // 1.0g + 0.5g = 1.5g, below 3.0g.
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:72#SPO2:99#ACC:1.0,0.5,0.1')).toBe(
      'GREEN'
    );
  });

  it('raises RED on critical hypoxia', () => {
    expect(classify('EB-1#HYPOXIA#9.03,38.74#HR:72#SPO2:79')).toBe('RED');
  });

  it('raises RED on a critical tachycardiac spike', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:151#SPO2:99')).toBe('RED');
  });

  it('raises AMBER on a warning SpO2', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:80#SPO2:85')).toBe('AMBER');
  });

  it('raises AMBER on a warning heart rate', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:125#SPO2:99')).toBe('AMBER');
  });

  it('raises AMBER on bradycardia below the critical low', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:45#SPO2:99')).toBe('AMBER');
  });

  it('raises AMBER on a fever', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:80#SPO2:99#TMP:39.2')).toBe('AMBER');
  });

  it('reports GREEN when every vital is within range', () => {
    expect(classify('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:72#SPO2:99#TMP:36.8')).toBe('GREEN');
  });

  it('honours operator-supplied thresholds over the defaults', () => {
    const payload = 'EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:72#SPO2:95';
    const strict: ThresholdSettings = { ...DEFAULT_THRESHOLDS, spo2Critical: 96 };
    // 95% is a warning under the defaults and critical once the operator raises
    // the critical floor above it.
    expect(classify(payload)).toBe('GREEN');
    expect(classify(payload, strict)).toBe('RED');
  });
});

describe('decodeGSMSMS — result shape', () => {
  it('describes the emergency in the distress summary', () => {
    expect(decodeGSMSMS(CANONICAL).distressSummary).toMatch(/FALL/i);
    expect(decodeGSMSMS('EB-1#MANUAL_SOS#9.03,38.74').distressSummary).toMatch(/SOS/i);
    expect(decodeGSMSMS('EB-1#HYPOXIA#9.03,38.74#SPO2:70').distressSummary).toMatch(/HYPOXIA/i);
  });

  it('records the flags the UI reads for its vitals panel', () => {
    const fall = decodeGSMSMS('EB-1#FALL_DETECTED#9.03,38.74');
    expect(fall.vitals.isFallDetected).toBe(true);
    expect(fall.vitals.isSosPressed).toBe(false);

    const sos = decodeGSMSMS('EB-1#MANUAL_SOS#9.03,38.74');
    expect(sos.vitals.isSosPressed).toBe(true);
    expect(sos.vitals.isFallDetected).toBe(false);
  });

  it('returns the trimmed raw string alongside the decoded values', () => {
    expect(decodeGSMSMS(`  ${CANONICAL}  `).rawString).toBe(CANONICAL);
  });

  it('always produces a finite number for every vital', () => {
    const { vitals } = decodeGSMSMS('EB-1#ROUTINE_TELEMETRY#9.03,38.74#HR:x#SPO2:y#TMP:z#BAT:w');
    for (const [key, value] of Object.entries(vitals)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value), `${key} must be finite`).toBe(true);
      }
    }
  });
});
