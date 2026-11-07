import { useEffect, useRef, useState } from 'react';
import type { Patient, ThresholdSettings, VitalMetrics } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { clamp } from '../utils/validation';
import { triageStyle } from '../utils/triage';
import {
  heartRateSeverity,
  impactSeverity,
  spo2Severity,
  temperatureSeverity,
  type VitalSeverity
} from '../utils/vitals';
import {
  Activity,
  Battery,
  Compass,
  Heart,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Thermometer,
  Volume2,
  VolumeX
} from 'lucide-react';

type ECGVisualizerProps = {
  patient: Patient | null;
  thresholds: ThresholdSettings;
};

const GRID_SIZE = 15;
const CURSOR_WIDTH = 3;
/** Pixels ahead of the cursor wiped clean each frame, giving the sweep look. */
const CURSOR_GAP = 25;
const PX_PER_SEC_AT_25MM = 120;
const AMPLITUDE_AT_10MM_MV = 45;
const TRACE_COLOR_ALERT = '#EF4444';
const TRACE_COLOR_WARNING = '#F59E0B';
const TRACE_COLOR_NORMAL = '#06B6D4';

/**
 * Full-scale deflection for each telemetry bar, in the bar's own unit. These are
 * display ranges, not clinical limits — the operator's limits are drawn on the
 * bar as a tick, so the two are never confused.
 */
const HEART_RATE_FULL_SCALE_BPM = 180;
const IMPACT_FULL_SCALE_G = 4;

const FALLBACK_VITALS: VitalMetrics = {
  heartRate: 75,
  spo2: 98,
  temperature: 36.8,
  battery: 90,
  gsmSignal: 4,
  accelX: 0,
  accelY: 0,
  accelZ: 1,
  isFallDetected: false,
  isSosPressed: false,
  lastUpdated: 'Now'
};

type Tone = 'rose' | 'amber' | 'emerald' | 'cyan' | 'slate';

const TONE_BADGE: Record<Tone, string> = {
  rose: 'bg-rose-950/60 text-rose-400 border-rose-800',
  amber: 'bg-amber-950/60 text-amber-400 border-amber-800',
  emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
  cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-800',
  slate: 'bg-navy-950 text-slate-300 border-slate-700'
};

const TONE_BAR: Record<Tone, string> = {
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-600'
};

const TONE_VALUE: Record<Tone, string> = {
  rose: 'text-rose-400 led-glow-red',
  amber: 'text-amber-300 led-glow-amber',
  emerald: 'text-emerald-400 led-glow-emerald',
  cyan: 'text-cyan-300 led-glow-cyan',
  slate: 'text-slate-100'
};

/**
 * Severity → presentation. Every threshold-driven reading on this panel goes
 * through these, so the monitor cannot drift away from the configured limits.
 */
const SEVERITY_TONE: Record<VitalSeverity, Tone> = {
  critical: 'rose',
  warning: 'amber',
  normal: 'emerald'
};

const SEVERITY_TRACE: Record<VitalSeverity, string> = {
  critical: TRACE_COLOR_ALERT,
  warning: TRACE_COLOR_WARNING,
  normal: TRACE_COLOR_NORMAL
};

/** Body-temperature bar range: 35–42 °C, the span the GY906 reports in practice. */
const TEMP_BAR_MIN_C = 35;
const TEMP_BAR_SPAN_C = 7;

function temperatureBarPercent(celsius: number): number {
  return ((celsius - TEMP_BAR_MIN_C) / TEMP_BAR_SPAN_C) * 100;
}

/**
 * Direction matters at the bedside: 40 bpm and 190 bpm are both abnormal but call
 * for opposite responses, so the badge names which side of the band was crossed.
 */
function heartRateBadge(
  heartRate: number,
  thresholds: ThresholdSettings,
  severity: VitalSeverity
): string {
  const side = heartRate > thresholds.hrWarningHigh ? 'Tachycardic' : 'Bradycardic';
  if (severity === 'critical') return `Critical · ${side}`;
  if (severity === 'warning') return side;
  return 'Normal';
}

function severityBadge(
  severity: VitalSeverity,
  normal: string,
  warning: string,
  critical: string
): string {
  if (severity === 'critical') return critical;
  if (severity === 'warning') return warning;
  return normal;
}

function impactBadge(isFallDetected: boolean, isCritical: boolean): string {
  if (isFallDetected) return 'Fall detected';
  return isCritical ? 'Impact spike' : 'Stationary';
}

export function ECGVisualizer({ patient, thresholds }: ECGVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const xRef = useRef(0);
  const dataPointsRef = useRef<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sweepSpeed, setSweepSpeed] = useState(25); // mm/s
  const [gain, setGain] = useState(10); // mm/mV
  const [isAudioBeepEnabled, setIsAudioBeepEnabled] = useState(false);
  const [isHeartBeating, setIsHeartBeating] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);

  const vitals = patient ? patient.currentVitals : FALLBACK_VITALS;
  const hr = vitals.heartRate;
  const condition = patient?.chronicCondition ?? '';

  /*
   * The animation loop reads these through refs rather than closing over them.
   * Telemetry refreshes every few seconds, so `patient` is a new object each
   * time and `hr` a new number; listing either in the effect's dependencies
   * tore down and rebuilt the rAF loop, resetting the beat phase to 0 and
   * producing a visible rhythm stutter every pulse.
   */
  const hrRef = useRef(hr);
  const conditionRef = useRef(condition);
  const beepEnabledRef = useRef(isAudioBeepEnabled);
  // Same reason as `hr`: the trace colour is scored against the operator's
  // limits, so those limits have to reach the frame loop without re-arming it.
  const thresholdsRef = useRef(thresholds);

  useEffect(() => {
    hrRef.current = hr;
    conditionRef.current = condition;
    beepEnabledRef.current = isAudioBeepEnabled;
    thresholdsRef.current = thresholds;
  }, [hr, condition, isAudioBeepEnabled, thresholds]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement ?? null;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = parent.clientWidth || 600;
    let height = parent.clientHeight || 120;
    canvas.width = width;
    canvas.height = height;

    // Track container resizes so the canvas adapts both width and height dynamically.
    const observer = new ResizeObserver(() => {
      const nextWidth = parent.clientWidth || 600;
      const nextHeight = parent.clientHeight || 120;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      xRef.current = xRef.current % width;
    });
    observer.observe(parent);

    const pxPerSec = (sweepSpeed / 25) * PX_PER_SEC_AT_25MM;
    const amplitudeScale = (gain / 10) * AMPLITUDE_AT_10MM_MV;

    let lastTime = performance.now();
    let cyclePhase = 0;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // cap after a tab stall
      lastTime = time;

      const currentHr = hrRef.current;
      const currentCondition = conditionRef.current;
      const midY = height / 2;

      if (isPlaying) {
        const prevX = xRef.current;
        const prevPhase = cyclePhase;

        xRef.current = (xRef.current + pxPerSec * dt) % width;
        cyclePhase = (cyclePhase + (currentHr / 60) * dt) % 1;

        /*
         * Precise R-peak detection (R-peak center at phase 0.345).
         * Triggers both clinical audio blip and visual cardiac pulse.
         */
        const crossedRPeak =
          (prevPhase < 0.345 && cyclePhase >= 0.345) ||
          (cyclePhase < prevPhase && (prevPhase < 0.345 || cyclePhase >= 0.345));

        if (crossedRPeak) {
          setIsHeartBeating(true);
          if (pulseTimeoutRef.current !== null) {
            window.clearTimeout(pulseTimeoutRef.current);
          }
          pulseTimeoutRef.current = window.setTimeout(() => setIsHeartBeating(false), 200);

          if (beepEnabledRef.current) {
            const isElevated = heartRateSeverity(currentHr, thresholdsRef.current) !== 'normal';
            audioSynth.playECGBlip(isElevated ? 680 : 520);
          }
        }

        // Sub-pixel continuous sweep: populate every single pixel column between prevX and xRef.current
        const startX = Math.floor(prevX);
        const endX = Math.floor(xRef.current);
        const stepCount = endX >= startX ? endX - startX : width - startX + endX;

        for (let s = 0; s <= stepCount; s += 1) {
          const curPixel = (startX + s) % width;
          const frac = stepCount > 0 ? s / stepCount : 1;
          const interpPhase =
            (prevPhase +
              (cyclePhase >= prevPhase ? cyclePhase - prevPhase : 1 - prevPhase + cyclePhase) *
                frac) %
            1;
          const voltage = getECGVoltage(interpPhase, currentCondition, time / 1000);
          dataPointsRef.current[curPixel] = midY - voltage * amplitudeScale;
        }

        for (let i = 1; i <= CURSOR_GAP; i += 1) {
          dataPointsRef.current[(endX + i) % width] = midY;
        }
      }

      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
      for (let x = 0; x < width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
      for (let x = 0; x < width; x += GRID_SIZE * 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += GRID_SIZE * 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Scored against the operator's heart-rate limits, so the trace turns the
      // same colour the triage queue uses for the same reading.
      const traceColor = SEVERITY_TRACE[heartRateSeverity(currentHr, thresholdsRef.current)];

      ctx.beginPath();
      ctx.strokeStyle = traceColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = traceColor;
      ctx.shadowBlur = 8;

      let started = false;
      const cursorX = Math.floor(xRef.current);

      for (let x = 0; x < width; x += 1) {
        if (x > cursorX && x < cursorX + CURSOR_GAP) continue;
        const y = dataPointsRef.current[x] ?? midY;
        if (started) {
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
          started = true;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#10B981';
      ctx.fillRect(cursorX, 0, CURSOR_WIDTH, height);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, sweepSpeed, gain]);

  const totalG = Math.sqrt(vitals.accelX ** 2 + vitals.accelY ** 2 + vitals.accelZ ** 2);
  const style = patient ? triageStyle(patient.triageStatus) : null;

  /*
   * Scored against the operator's configured limits rather than round numbers.
   * This panel used to hardcode 120/50 bpm, 80/92 %SpO₂ and a flat 4 g scale,
   * so an operator who had retuned the limits still saw readings judged against
   * the old ones — the same defect the triage queue had.
   */
  const hrSeverity = heartRateSeverity(hr, thresholds);
  const spo2State = spo2Severity(vitals.spo2, thresholds);
  const tempState = temperatureSeverity(vitals.temperature, thresholds);
  // A firmware-detected fall is critical outright; so is an impact above the
  // configured g limit, whether or not the firmware labelled the event a fall.
  const isImpactCritical =
    vitals.isFallDetected || impactSeverity(totalG, thresholds) === 'critical';

  const handleResetTrace = () => {
    dataPointsRef.current = [];
    xRef.current = 0;
  };

  return (
    <div className="panel flex h-full flex-col gap-2 p-2.5">
      {/* Patient banner */}
      <header className="panel-inset flex items-center justify-between gap-2 px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-slate-950 font-mono shadow-sm"
            style={{ backgroundColor: style?.hex ?? '#06B6D4' }}
            aria-hidden="true"
          >
            {patient ? patient.id.replace(/^EB-/, '') : 'EB'}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-xs font-extrabold text-slate-100">
                {patient ? patient.name : 'Select a patient'}
              </h2>
              {patient && (
                <span className="data-num shrink-0 rounded border border-slate-700 bg-navy-950 px-1 py-0.2 font-mono text-[9px] text-cyan-400">
                  {patient.wearableSerial}
                </span>
              )}
            </div>
            <p className="truncate text-[10px] text-slate-400">
              {patient ? patient.chronicCondition : 'Real-time telemetry monitor ready'}
            </p>
          </div>
        </div>

        {patient && (
          <span
            className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              color: style?.hex,
              borderColor: `${style?.hex}66`,
              backgroundColor: `${style?.hex}14`
            }}
          >
            {patient.distressReason ?? 'Active distress'}
          </span>
        )}
      </header>

      {/* Middle: Live ECG rhythm trace (Left) and unified Telemetry panel (Right) */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row gap-2 overflow-hidden">
        {/* Left: ECG rhythm waveform canvas & oscilloscope controls */}
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-800 bg-[#0B0F19] p-2 overflow-hidden">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5 shrink-0">
            <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              <Activity
                className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0"
                aria-hidden="true"
              />
              <span>Live ECG &middot; Lead II</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[8px] font-mono font-bold transition-all duration-150 ${
                  isHeartBeating
                    ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50 shadow-glow-red scale-105'
                    : 'bg-navy-950 text-slate-500 ring-1 ring-slate-800'
                }`}
                title="Real-time cardiac QRS detector"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isHeartBeating ? 'bg-rose-400' : 'bg-slate-600'
                  }`}
                />
                PULSE
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPlaying(prev => !prev)}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Freeze trace' : 'Resume trace'}
                className="rounded-lg border border-slate-700 bg-navy-950 p-1 text-slate-300 transition-colors hover:bg-navy-850"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Play className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={handleResetTrace}
                aria-label="Clear the ECG trace"
                className="rounded-lg border border-slate-700 bg-navy-950 p-1 text-slate-300 transition-colors hover:bg-navy-850"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setIsAudioBeepEnabled(prev => !prev)}
                aria-pressed={isAudioBeepEnabled}
                className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 font-mono text-[9px] font-bold transition-colors ${
                  isAudioBeepEnabled
                    ? 'border-rose-800 bg-rose-950/60 text-rose-300'
                    : 'border-slate-700 bg-navy-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAudioBeepEnabled ? (
                  <Volume2 className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-3 h-3" aria-hidden="true" />
                )}
                QRS
              </button>

              <label className="sr-only" htmlFor="ecg-sweep">
                Sweep speed
              </label>
              <select
                id="ecg-sweep"
                value={sweepSpeed}
                onChange={event => setSweepSpeed(Number(event.target.value))}
                className="data-num rounded-lg border border-slate-700 bg-navy-950 px-1 py-0.5 font-mono text-[9px] text-slate-300 focus:outline-none"
              >
                <option value={12.5}>12.5 mm/s</option>
                <option value={25}>25 mm/s</option>
                <option value={50}>50 mm/s</option>
              </select>

              <label className="sr-only" htmlFor="ecg-gain">
                Gain
              </label>
              <select
                id="ecg-gain"
                value={gain}
                onChange={event => setGain(Number(event.target.value))}
                className="data-num rounded-lg border border-slate-700 bg-navy-950 px-1 py-0.5 font-mono text-[9px] text-slate-300 focus:outline-none"
              >
                <option value={5}>5 mm/mV</option>
                <option value={10}>10 mm/mV</option>
                <option value={20}>20 mm/mV</option>
              </select>
            </div>
          </div>

          <div className="relative min-h-[110px] flex-1 w-full overflow-hidden rounded-lg">
            <canvas ref={canvasRef} className="block w-full h-full" />
          </div>
          <p className="sr-only">
            ECG trace for {patient ? patient.name : 'no patient'}, {hr} beats per minute.
          </p>
        </section>

        {/* Right: Unified Telemetry Panel (beside the graph, 2x2 compact clinical grid) */}
        <section className="grid grid-cols-2 gap-x-2.5 gap-y-2 rounded-xl border border-slate-800 bg-[#0B0F19] p-2 md:w-[270px] lg:w-[290px] xl:w-[310px] shrink-0 content-between overflow-hidden">
          {/* 1. Heart Rate */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="eyebrow flex items-center gap-1 text-[8px]">
                <Heart
                  className={`w-2.5 h-2.5 text-rose-500 transition-all duration-150 ${
                    isHeartBeating
                      ? 'scale-125 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                      : 'scale-100'
                  }`}
                  aria-hidden="true"
                />
                HR
              </span>
              <span
                className={`shrink-0 rounded border px-1 py-0.2 text-[8px] font-bold ${TONE_BADGE[SEVERITY_TONE[hrSeverity]]}`}
              >
                {heartRateBadge(hr, thresholds, hrSeverity)}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`data-num font-mono text-lg font-extrabold leading-none ${TONE_VALUE[SEVERITY_TONE[hrSeverity]]}`}
              >
                {hr}
              </span>
              <span className="font-mono text-[8px] font-semibold text-slate-400">BPM</span>
            </div>
            <div
              className="relative mt-1 h-1 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950"
              role="presentation"
            >
              <div
                className={`h-full transition-[width] duration-500 ease-out-expo ${TONE_BAR[SEVERITY_TONE[hrSeverity]]}`}
                style={{ width: `${clamp((hr / HEART_RATE_FULL_SCALE_BPM) * 100, 0, 100)}%` }}
              />
              <span
                className="absolute inset-y-0 w-px bg-slate-300/70"
                style={{
                  left: `${clamp((thresholds.hrWarningHigh / HEART_RATE_FULL_SCALE_BPM) * 100, 0, 100)}%`
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 2. Blood Oxygen */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="eyebrow flex items-center gap-1 text-[8px]">
                <Activity className="w-2.5 h-2.5 text-cyan-400" aria-hidden="true" />
                SpO₂
              </span>
              <span
                className={`shrink-0 rounded border px-1 py-0.2 text-[8px] font-bold ${TONE_BADGE[SEVERITY_TONE[spo2State]]}`}
              >
                {severityBadge(spo2State, 'Optimal', 'Warning', 'Critical')}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`data-num font-mono text-lg font-extrabold leading-none ${TONE_VALUE[SEVERITY_TONE[spo2State]]}`}
              >
                {vitals.spo2}%
              </span>
              <span className="font-mono text-[8px] font-semibold text-slate-400">SpO₂</span>
            </div>
            <div
              className="relative mt-1 h-1 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950"
              role="presentation"
            >
              <div
                className={`h-full transition-[width] duration-500 ease-out-expo ${TONE_BAR[SEVERITY_TONE[spo2State]]}`}
                style={{ width: `${clamp(vitals.spo2, 0, 100)}%` }}
              />
              <span
                className="absolute inset-y-0 w-px bg-slate-300/70"
                style={{ left: `${clamp(thresholds.spo2Warning, 0, 100)}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 3. Body Temperature */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="eyebrow flex items-center gap-1 text-[8px]">
                <Thermometer className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                Temp
              </span>
              <span
                className={`shrink-0 rounded border px-1 py-0.2 text-[8px] font-bold ${TONE_BADGE[SEVERITY_TONE[tempState]]}`}
              >
                {tempState === 'warning' ? 'Febrile' : 'Normal'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`data-num font-mono text-lg font-extrabold leading-none ${TONE_VALUE[SEVERITY_TONE[tempState]]}`}
              >
                {vitals.temperature}°C
              </span>
              <span className="font-mono text-[8px] font-semibold text-slate-400">
                {((vitals.temperature * 9) / 5 + 32).toFixed(1)}°F
              </span>
            </div>
            <div
              className="relative mt-1 h-1 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950"
              role="presentation"
            >
              <div
                className={`h-full transition-[width] duration-500 ease-out-expo ${TONE_BAR[SEVERITY_TONE[tempState]]}`}
                style={{ width: `${clamp(temperatureBarPercent(vitals.temperature), 0, 100)}%` }}
              />
              <span
                className="absolute inset-y-0 w-px bg-slate-300/70"
                style={{
                  left: `${clamp(temperatureBarPercent(thresholds.tempFeverHigh), 0, 100)}%`
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 4. Impact Force */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="eyebrow flex items-center gap-1 text-[8px]">
                <Compass className="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
                Impact
              </span>
              <span
                className={`shrink-0 rounded border px-1 py-0.2 text-[8px] font-bold ${TONE_BADGE[isImpactCritical ? 'rose' : 'emerald']}`}
              >
                {impactBadge(vitals.isFallDetected, isImpactCritical)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-1">
                <span
                  className={`data-num font-mono text-lg font-extrabold leading-none ${TONE_VALUE[isImpactCritical ? 'rose' : 'emerald']}`}
                >
                  {totalG.toFixed(2)}
                </span>
                <span className="font-mono text-[8px] font-semibold text-slate-400">g</span>
              </div>
              <span className="data-num font-mono text-[7px] text-slate-500">
                {vitals.accelX},{vitals.accelY},{vitals.accelZ}
              </span>
            </div>
            <div
              className="relative mt-1 h-1 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950"
              role="presentation"
            >
              <div
                className={`h-full transition-[width] duration-500 ease-out-expo ${TONE_BAR[isImpactCritical ? 'rose' : 'emerald']}`}
                style={{ width: `${clamp((totalG / IMPACT_FULL_SCALE_G) * 100, 0, 100)}%` }}
              />
              <span
                className="absolute inset-y-0 w-px bg-slate-300/70"
                style={{
                  left: `${clamp((thresholds.fallAccelG / IMPACT_FULL_SCALE_G) * 100, 0, 100)}%`
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-800 pt-1 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <Battery className="w-3 h-3" aria-hidden="true" />
          Wearable battery{' '}
          <span className="data-num font-mono font-bold text-slate-300">{vitals.battery}%</span>
        </span>
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3" aria-hidden="true" />
          GSM signal{' '}
          <span className="data-num font-mono font-bold text-slate-300">{vitals.gsmSignal}/5</span>
        </span>
        <span className="data-num ml-auto font-mono">Updated {vitals.lastUpdated}</span>
      </footer>
    </div>
  );
}

/**
 * Mathematically modeled human Lead II ECG waveform (PQRSTU complex).
 * Continuous multi-Gaussian expansion (McSharry / Clifford et al.) with authentic
 * physiological timing, smooth sub-pixel curvature, and condition-specific morphologies.
 * `phase` is the cardiac cycle position normalized in [0, 1).
 */
function getECGVoltage(phase: number, condition: string, timeSec = 0): number {
  const phi = ((phase % 1) + 1) % 1;

  // 1. Natural respiratory baseline wander (~0.22 Hz / ~13 breaths per min)
  const respWander = 0.02 * Math.sin(2 * Math.PI * 0.22 * timeSec);

  // 2. High-frequency micro-tremor (filtered physiological micro-dynamics)
  const tremor =
    0.0035 * Math.sin(2 * Math.PI * 19.3 * timeSec + phi * 10) +
    0.0025 * Math.cos(2 * Math.PI * 37.1 * timeSec);

  let v = respWander + tremor;

  const gaussian = (center: number, width: number, amp: number) => {
    const d = phi - center;
    return amp * Math.exp(-(d * d) / (2 * width * width));
  };

  // 3. P-Wave (Atrial Depolarization): smooth rounded upward dome
  v += gaussian(0.16, 0.022, 0.18);

  // 4. Q-Wave (Septal Depolarization): sharp downward dip
  v += gaussian(0.322, 0.0085, -0.16);

  // 5. R-Peak (Ventricular Depolarization): tall, sharp clinical spike
  const rAmp = condition.includes('Cardiac') ? 1.65 : 1.52;
  v += gaussian(0.345, 0.0098, rAmp);

  // 6. S-Wave (Late Ventricular Depolarization): sharp downward deflection past baseline
  v += gaussian(0.372, 0.0115, -0.34);

  // 7. ST-Segment (J-point to onset of T-wave)
  if (phi >= 0.385 && phi <= 0.48) {
    const stProgress = (phi - 0.385) / (0.48 - 0.385);
    let stOffset = 0;
    if (condition.includes('Hypoxia') || condition.includes('COPD')) {
      stOffset = -0.06 * Math.sin(Math.PI * stProgress);
    } else if (condition.includes('Cardiac')) {
      stOffset = 0.08 * Math.sin(Math.PI * stProgress);
    }
    v += stOffset;
  }

  // 8. T-Wave (Ventricular Repolarization): smooth, slightly asymmetric wave
  const tCenter = 0.58;
  const tWidth = phi < tCenter ? 0.052 : 0.042;
  let tAmp = 0.3;
  if (condition.includes('COPD') || condition.includes('Hypoxia')) {
    // Hypoxia causes T-wave flattening or inversion
    tAmp = 0.06;
  } else if (condition.includes('Cardiac')) {
    tAmp = 0.44; // Peaked T-wave
  }
  v += gaussian(tCenter, tWidth, tAmp);

  // 9. U-Wave (Purkinje repolarization): subtle late wave
  v += gaussian(0.74, 0.026, 0.035);

  // 10. Ectopic morphology for Arrhythmia
  if (condition.includes('Arrhythmia')) {
    const arrhJitter = 0.03 * Math.sin(2 * Math.PI * 3.7 * timeSec);
    v += arrhJitter;
  }

  return v;
}
