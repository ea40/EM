import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { EventType, TerminalLog, ThresholdSettings } from '../types';
import { decodeGSMSMS } from '../utils/gsmDecoder';
import { triageStyle } from '../utils/triage';
import {
  Activity,
  AlertTriangle,
  Code,
  Cpu,
  Radio,
  Send,
  Sparkles,
  Terminal,
  Zap
} from 'lucide-react';

type SimulatorPageProps = {
  onSimulateAlert: (rawPayload: string, deviceLabel?: string) => void;
  logs: TerminalLog[];
  thresholds: ThresholdSettings;
};

const PRESETS: {
  id: string;
  label: string;
  patient: string;
  eventType: EventType;
  payload: string;
}[] = [
  {
    id: 'SOS',
    label: 'Simulate SOS press',
    patient: 'Abeba Tadesse — 34-week high-risk pregnancy, Bole',
    eventType: 'MANUAL_SOS',
    payload: 'EB-101#MANUAL_SOS#9.0024,38.7842#HR:88#SPO2:97#TMP:37.1#BAT:88%#ACC:0.1,0.0,0.98'
  },
  {
    id: 'SPO2',
    label: 'Simulate SpO₂ drop',
    patient: 'Mulugeta Assefa — COPD & hypoxia, Lideta',
    eventType: 'CRITICAL_HYPOXIA',
    payload:
      'EB-102#CRITICAL_HYPOXIA#9.0188,38.7431#HR:78#SPO2:76#TMP:36.6#BAT:91%#ACC:0.0,-0.1,0.99'
  },
  {
    id: 'FALL',
    label: 'Simulate fall impact',
    patient: 'Tigist Haile — epilepsy impact alert, Yeka',
    eventType: 'FALL_DETECTED',
    payload: 'EB-103#FALL_DETECTED#9.0355,38.7690#HR:82#SPO2:95#TMP:36.9#BAT:89%#ACC:3.2,1.8,0.15'
  },
  {
    id: 'TACHY',
    label: 'Simulate cardiac spike',
    patient: 'Abeba Tadesse — acute tachycardia spike (>150 BPM)',
    eventType: 'TACHYCARDIAC_SPIKE',
    payload:
      'EB-101#TACHYCARDIAC_SPIKE#9.0024,38.7842#HR:158#SPO2:92#TMP:37.2#BAT:85%#ACC:0.2,0.1,0.97'
  }
];

export function SimulatorPage({ onSimulateAlert, logs, thresholds }: SimulatorPageProps) {
  const [deviceSerial, setDeviceSerial] = useState('EB-101');
  const [eventType, setEventType] = useState<EventType>('MANUAL_SOS');
  const [lat, setLat] = useState('9.0024');
  const [lng, setLng] = useState('38.7842');
  const [hr, setHr] = useState('88');
  const [spo2, setSpo2] = useState('97');
  const [temp, setTemp] = useState('37.4');
  const [battery, setBattery] = useState('89');
  const [accelX, setAccelX] = useState('3.2');

  const terminalRef = useRef<HTMLDivElement>(null);

  // Keep the newest packet in view — this is a live stream, not a log file.
  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [logs]);

  /*
   * Show the most recent packet that actually carried telemetry. Reading
   * `logs[logs.length - 1]` meant an INFO or DISPATCH entry ending the stream
   * blanked the JSON inspector until the next SMS arrived.
   */
  const latestPayload = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      const payload = logs[i]?.rawPayload;
      if (payload) return payload;
    }
    return null;
  }, [logs]);

  const decoded = useMemo(
    () => (latestPayload ? decodeGSMSMS(latestPayload, thresholds) : null),
    [latestPayload, thresholds]
  );

  const handleInjectCustom = (event: FormEvent) => {
    event.preventDefault();
    const payload = [
      deviceSerial,
      eventType,
      `${lat},${lng}`,
      `HR:${hr}`,
      `SPO2:${spo2}`,
      `TMP:${temp}`,
      `BAT:${battery}%`,
      `ACC:${accelX},0.4,0.15`
    ].join('#');

    onSimulateAlert(payload, 'custom injector');
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-amber-700/60 bg-amber-950/60 p-2.5 text-amber-400">
            <Zap className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">Hardware testing console</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Inject SIM800 gateway SMS packets without a physical wearable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-800/70 bg-amber-950/50 px-2.5 py-1.5 text-[11px] font-bold text-amber-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
            Cell tower simulator active
          </span>
          <span className="data-num rounded-lg border border-slate-800 bg-navy-950 px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
            {thresholds.gsmBaudRate} baud
          </span>
        </div>
      </header>

      {/* Presets */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="eyebrow flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            One-click emergency presets
          </h2>
          <p className="text-[10px] text-slate-500">
            Triage badge shows the live engine verdict for the current thresholds
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRESETS.map(preset => {
            // Decoded here so the badge cannot drift from what the engine will do.
            const verdict = decodeGSMSMS(preset.payload, thresholds);
            const style = triageStyle(verdict.triageCode);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSimulateAlert(preset.payload, preset.label)}
                className="panel group flex flex-col gap-3 p-4 text-left transition-colors hover:border-slate-600"
                style={{ borderColor: `${style.hex}44` }}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-100">
                    {preset.id === 'FALL' ? (
                      <AlertTriangle
                        className="w-4 h-4"
                        style={{ color: style.hex }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Activity
                        className="w-4 h-4"
                        style={{ color: style.hex }}
                        aria-hidden="true"
                      />
                    )}
                    {preset.label}
                  </span>
                  <span
                    className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black uppercase"
                    style={{ color: style.hex, borderColor: `${style.hex}66` }}
                  >
                    {style.label}
                  </span>
                </span>

                <span className="text-[11px] font-semibold text-slate-300">{preset.patient}</span>

                <code className="data-num block truncate rounded-lg border border-slate-800 bg-navy-950 p-2 font-mono text-[10px] text-slate-500">
                  {preset.payload.slice(0, 34)}…
                </code>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 pb-1 lg:grid-cols-12">
        {/* Custom injector */}
        <section className="panel p-4 lg:col-span-5">
          <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Cpu className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Custom GSM telemetry injector
            </h2>
          </header>

          <form onSubmit={handleInjectCustom} className="mt-3 grid grid-cols-2 gap-3">
            <Field id="sim-serial" label="Device serial" className="col-span-2">
              <input
                id="sim-serial"
                type="text"
                value={deviceSerial}
                onChange={event => setDeviceSerial(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-cyan-300 focus:border-amber-400 focus:outline-none"
              />
            </Field>

            <Field id="sim-event" label="Trigger event" className="col-span-2">
              <select
                id="sim-event"
                value={eventType}
                onChange={event => setEventType(event.target.value as EventType)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="MANUAL_SOS">MANUAL_SOS</option>
                <option value="FALL_DETECTED">FALL_DETECTED</option>
                <option value="CRITICAL_HYPOXIA">CRITICAL_HYPOXIA</option>
                <option value="TACHYCARDIAC_SPIKE">TACHYCARDIAC_SPIKE</option>
                <option value="ARRHYTHMIA_DETECTED">ARRHYTHMIA_DETECTED</option>
                <option value="ROUTINE_TELEMETRY">ROUTINE_TELEMETRY</option>
              </select>
            </Field>

            <Field id="sim-lat" label="GPS latitude">
              <input
                id="sim-lat"
                type="text"
                value={lat}
                onChange={event => setLat(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </Field>
            <Field id="sim-lng" label="GPS longitude">
              <input
                id="sim-lng"
                type="text"
                value={lng}
                onChange={event => setLng(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </Field>

            <Field id="sim-hr" label="Heart rate (BPM)">
              <input
                id="sim-hr"
                type="number"
                value={hr}
                onChange={event => setHr(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs font-bold text-rose-400 focus:border-amber-400 focus:outline-none"
              />
            </Field>
            <Field id="sim-spo2" label="SpO₂ (%)">
              <input
                id="sim-spo2"
                type="number"
                value={spo2}
                onChange={event => setSpo2(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs font-bold text-cyan-400 focus:border-amber-400 focus:outline-none"
              />
            </Field>
            <Field id="sim-temp" label="Temperature (°C)">
              <input
                id="sim-temp"
                type="number"
                step="0.1"
                value={temp}
                onChange={event => setTemp(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </Field>
            <Field id="sim-battery" label="Battery (%)">
              <input
                id="sim-battery"
                type="number"
                value={battery}
                onChange={event => setBattery(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </Field>
            <Field id="sim-accel" label="Impact force (g)" className="col-span-2">
              <input
                id="sim-accel"
                type="number"
                step="0.1"
                value={accelX}
                onChange={event => setAccelX(event.target.value)}
                className="data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </Field>

            <button
              type="submit"
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 p-2.5 text-xs font-extrabold text-slate-950 shadow-elev-2 transition-colors hover:bg-amber-400"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              Transmit GSM SMS packet
            </button>
          </form>
        </section>

        {/* Stream + inspector */}
        <div className="flex flex-col gap-3 lg:col-span-7">
          <section className="panel p-3">
            <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                SIM800 packet stream
              </h2>
              <span className="data-num font-mono text-[10px] text-slate-500">
                {logs.length} entries
              </span>
            </header>

            <div
              ref={terminalRef}
              role="log"
              aria-live="polite"
              aria-label="GSM packet stream"
              className="mt-2 h-48 space-y-1.5 overflow-y-auto font-mono text-[11px]"
            >
              {logs.length === 0 ? (
                <p className="pt-6 text-center text-[10px] text-slate-600">
                  Waiting for the first packet…
                </p>
              ) : (
                logs.map(log => (
                  <p key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <time className="data-num shrink-0 text-slate-500">{log.timestamp}</time>
                    <span className={LOG_TYPE_STYLES[log.type]}>{log.message}</span>
                  </p>
                ))
              )}
            </div>
          </section>

          <section className="panel p-3">
            <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Decoded telemetry inspector
              </h2>
              <Code className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </header>

            <div className="mt-2 h-40 overflow-y-auto">
              {decoded ? (
                <>
                  <pre className="data-num whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-cyan-300">
                    {JSON.stringify(decoded, null, 2)}
                  </pre>
                  {decoded.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {decoded.warnings.map(warning => (
                        <li
                          key={warning}
                          className="rounded border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-[10px] text-amber-300"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="pt-14 text-center text-[10px] text-slate-600">
                  No GSM SMS payload received yet
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const LOG_TYPE_STYLES: Record<TerminalLog['type'], string> = {
  INFO: 'text-slate-400',
  SMS_INCOMING: 'text-amber-300',
  DECODE: 'text-cyan-300',
  TRIAGE: 'text-rose-400',
  AUDIO: 'text-violet-400',
  DISPATCH: 'text-emerald-400'
};

type FieldProps = {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
};

function Field({ id, label, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
