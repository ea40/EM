import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type {
  EventType,
  HardwareDeviceDiagnostics,
  TerminalLog,
  ThresholdSettings
} from '../types';
import { HARDWARE_DEVICES } from '../data/mockData';
import { decodeGSMSMS } from '../utils/gsmDecoder';
import { Battery, Cpu, Layers, Radio, Send, ShieldCheck, Terminal, Wifi, Zap } from 'lucide-react';

type HardwareDiagnosticsPageProps = {
  logs: TerminalLog[];
  thresholds: ThresholdSettings;
  onSimulateAlert: (rawPayload: string, deviceLabel?: string) => void;
};

const EVENTS: EventType[] = [
  'MANUAL_SOS',
  'FALL_DETECTED',
  'CRITICAL_HYPOXIA',
  'TACHYCARDIAC_SPIKE',
  'ARRHYTHMIA_DETECTED',
  'ROUTINE_TELEMETRY'
];

const LOW_BATTERY_THRESHOLD = 20;
const WEAK_SIGNAL_DBM = -95;

/** Bole gateway reference point, used to geo-tag injected diagnostic packets. */
const GATEWAY_REFERENCE = { lat: '9.0124', lng: '38.7612' } as const;

const EVENT_LABELS: Record<EventType, string> = {
  MANUAL_SOS: 'Manual SOS press',
  FALL_DETECTED: 'Fall & impact',
  CRITICAL_HYPOXIA: 'Critical SpO₂ hypoxia',
  TACHYCARDIAC_SPIKE: 'Cardiac tachycardia',
  ARRHYTHMIA_DETECTED: 'Arrhythmia detected',
  ROUTINE_TELEMETRY: 'Routine telemetry'
};

type FormState = {
  serial: string;
  /** Numeric fields are held as text: `Number('')` is `0`, which would inject a
   *  flatline heart rate from an emptied field. */
  hr: string;
  spo2: string;
  temp: string;
};

export function HardwareDiagnosticsPage({
  logs,
  thresholds,
  onSimulateAlert
}: HardwareDiagnosticsPageProps) {
  const [selectedSerial, setSelectedSerial] = useState<string | null>(
    () => HARDWARE_DEVICES[0]?.serial ?? null
  );
  const [eventType, setEventType] = useState<EventType>('FALL_DETECTED');
  const [form, setForm] = useState<FormState>({
    serial: 'EB-101',
    hr: '84',
    spo2: '96',
    temp: '37.0'
  });

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [logs]);

  const selectedDevice = useMemo(
    () => HARDWARE_DEVICES.find(device => device.serial === selectedSerial) ?? null,
    [selectedSerial]
  );

  /*
   * Every figure below is computed from the device registry. These four cards
   * previously showed fixed strings ("248 units", "87.4%", "-71 dBm",
   * "v2.4.1-eth") that never moved regardless of what the fleet was doing.
   */
  const fleetStats = useMemo(() => {
    const total = HARDWARE_DEVICES.length;
    const lowBattery = HARDWARE_DEVICES.filter(d => d.batteryLevel < LOW_BATTERY_THRESHOLD);
    const meanBattery =
      total === 0 ? null : HARDWARE_DEVICES.reduce((sum, d) => sum + d.batteryLevel, 0) / total;
    const meanSignal =
      total === 0 ? null : HARDWARE_DEVICES.reduce((sum, d) => sum + d.gsmSignalDbm, 0) / total;
    const online = HARDWARE_DEVICES.filter(d => d.status === 'ONLINE').length;
    const firmwareVersions = [...new Set(HARDWARE_DEVICES.map(d => d.firmwareVersion))];

    return { total, lowBattery, meanBattery, meanSignal, online, firmwareVersions };
  }, []);

  /** Newest packet that actually carried telemetry, not merely the last log entry. */
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

  const hrValue = Number(form.hr);
  const spo2Value = Number(form.spo2);
  const tempValue = Number(form.temp);
  const isFormValid =
    form.serial.trim() !== '' &&
    form.hr.trim() !== '' &&
    form.spo2.trim() !== '' &&
    form.temp.trim() !== '' &&
    Number.isFinite(hrValue) &&
    Number.isFinite(spo2Value) &&
    Number.isFinite(tempValue);

  /** Selecting a device in the registry points the injector at that unit. */
  const handleSelectDevice = (serial: string) => {
    setSelectedSerial(serial);
    setForm(previous => ({ ...previous, serial }));
  };

  const handleInject = (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) return;

    // The diagnostic registry carries no GPS fix, so injected packets are
    // geo-tagged at the Bole gateway reference point.
    const payload = [
      form.serial.trim(),
      eventType,
      `${GATEWAY_REFERENCE.lat},${GATEWAY_REFERENCE.lng}`,
      `HR:${hrValue}`,
      `SPO2:${spo2Value}`,
      `TMP:${tempValue}`,
      'BAT:89%',
      'ACC:3.2,1.8,0.15'
    ].join('#');

    onSimulateAlert(payload, `diagnostics injector (${form.serial.trim()})`);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-amber-700/60 bg-amber-950/60 p-2.5 text-amber-400">
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">
              Wearable 2-PCB hardware &amp; GSM gateway diagnostics
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              SIM800 cellular SMS hardware monitor &middot; Ethio-Telecom gateway
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="data-num flex items-center gap-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/50 px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
            GSM SIM800 online
          </span>
          <span className="data-num rounded-lg border border-slate-800 bg-navy-950 px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
            {thresholds.gsmBaudRate} baud
          </span>
        </div>
      </header>

      {/* Derived fleet metrics */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          icon={<Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />}
          label="Dual-PCB wearables"
          value={String(fleetStats.total)}
          unit="units"
          valueClass="text-slate-100"
          detail={`${fleetStats.online} reporting online`}
        />
        <Metric
          icon={<Battery className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
          label="Mean battery health"
          value={fleetStats.meanBattery === null ? '—' : fleetStats.meanBattery.toFixed(1)}
          unit="%"
          valueClass={fleetStats.lowBattery.length > 0 ? 'text-amber-400' : 'text-emerald-400'}
          detail={
            fleetStats.lowBattery.length === 0
              ? 'No units below 20%'
              : `${fleetStats.lowBattery.length} unit${
                  fleetStats.lowBattery.length === 1 ? '' : 's'
                } below ${LOW_BATTERY_THRESHOLD}%`
          }
        />
        <Metric
          icon={<Wifi className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
          label="Mean cell signal"
          value={fleetStats.meanSignal === null ? '—' : fleetStats.meanSignal.toFixed(0)}
          unit="dBm"
          valueClass={
            fleetStats.meanSignal !== null && fleetStats.meanSignal < WEAK_SIGNAL_DBM
              ? 'text-amber-400'
              : 'text-emerald-400'
          }
          detail="Ethio-Telecom GSM tower"
        />
        <Metric
          icon={<ShieldCheck className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />}
          label="Firmware in field"
          value={fleetStats.firmwareVersions.join(' · ') || '—'}
          unit=""
          valueClass="text-cyan-300"
          small
          detail={`${fleetStats.firmwareVersions.length} build${
            fleetStats.firmwareVersions.length === 1 ? '' : 's'
          } deployed`}
        />
      </section>

      <div className="grid grid-cols-1 gap-3 pb-1 lg:grid-cols-12">
        {/* Device registry */}
        <section className="panel p-4 lg:col-span-7">
          <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Cpu className="w-4 h-4 text-amber-400" aria-hidden="true" />
              Wearable diagnostics registry
            </h2>
            <span className="data-num font-mono text-[10px] text-slate-500">
              {HARDWARE_DEVICES.length} registered
            </span>
          </header>

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">
                Registered wearable devices with battery, signal and lock status
              </caption>
              <thead className="border-b border-slate-800 bg-navy-950/60 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="p-2.5 font-semibold">
                    Serial
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    Wearer
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    PCB
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    Battery
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    GSM
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    GPS sats
                  </th>
                  <th scope="col" className="p-2.5 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {HARDWARE_DEVICES.map(device => {
                  const isSelected = device.serial === selectedSerial;
                  const isLowBattery = device.batteryLevel < LOW_BATTERY_THRESHOLD;
                  const isWeakSignal = device.gsmSignalDbm < WEAK_SIGNAL_DBM;

                  return (
                    <tr
                      key={device.serial}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-950/25' : 'hover:bg-navy-850/60'
                      }`}
                    >
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleSelectDevice(device.serial)}
                          aria-pressed={isSelected}
                          aria-label={`Select device ${device.serial}`}
                          className={`data-num font-mono font-bold transition-colors ${
                            isSelected ? 'text-amber-300' : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                        >
                          {device.serial}
                        </button>
                      </td>
                      <td className="p-2.5 font-medium text-slate-200">{device.patientName}</td>
                      <td className="data-num p-2.5 font-mono text-[11px] text-slate-400">
                        {device.pcbBoardVersion}
                      </td>
                      <td
                        className={`data-num p-2.5 font-mono font-bold ${
                          isLowBattery
                            ? 'text-rose-400 led-glow-red'
                            : 'text-emerald-400 led-glow-emerald'
                        }`}
                      >
                        {device.batteryLevel}%
                      </td>
                      <td
                        className={`data-num p-2.5 font-mono ${
                          isWeakSignal ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {device.gsmSignalDbm} dBm
                      </td>
                      <td className="data-num p-2.5 font-mono text-cyan-300">
                        {device.satellitesLocked}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${DEVICE_STATUS_STYLES[device.status]}`}
                        >
                          {device.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Injector + stream */}
        <div className="flex flex-col gap-3 lg:col-span-5">
          <section className="panel p-4">
            <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                GSM SMS payload injector
              </h2>
            </header>

            {/* The registry selection is the injector's target device. */}
            <dl className="panel-inset mt-3 grid grid-cols-3 gap-2 p-2.5">
              <div>
                <dt className="eyebrow">Target unit</dt>
                <dd className="data-num mt-1 truncate font-mono text-[11px] font-bold text-cyan-300">
                  {selectedDevice ? selectedDevice.serial : 'free-form'}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">SIM card</dt>
                <dd className="data-num mt-1 truncate font-mono text-[11px] text-slate-300">
                  {selectedDevice ? selectedDevice.simCardNumber : '—'}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Last ping</dt>
                <dd className="data-num mt-1 truncate font-mono text-[11px] text-slate-300">
                  {selectedDevice ? selectedDevice.lastPingTimestamp : '—'}
                </dd>
              </div>
            </dl>

            <form onSubmit={handleInject} className="mt-3 grid grid-cols-2 gap-3">
              <Field id="diag-serial" label="Device serial" className="col-span-2">
                <input
                  id="diag-serial"
                  type="text"
                  value={form.serial}
                  onChange={event => setForm({ ...form, serial: event.target.value })}
                  className={`${INPUT_CLASS} text-cyan-300`}
                />
              </Field>

              <Field id="diag-event" label="Trigger event" className="col-span-2">
                <select
                  id="diag-event"
                  value={eventType}
                  onChange={event => setEventType(event.target.value as EventType)}
                  className={INPUT_CLASS}
                >
                  {EVENTS.map(option => (
                    <option key={option} value={option}>
                      {EVENT_LABELS[option]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="diag-hr" label="Heart rate (BPM)">
                <input
                  id="diag-hr"
                  type="number"
                  value={form.hr}
                  onChange={event => setForm({ ...form, hr: event.target.value })}
                  className={`${INPUT_CLASS} text-rose-400`}
                />
              </Field>
              <Field id="diag-spo2" label="SpO₂ (%)">
                <input
                  id="diag-spo2"
                  type="number"
                  value={form.spo2}
                  onChange={event => setForm({ ...form, spo2: event.target.value })}
                  className={`${INPUT_CLASS} text-cyan-400`}
                />
              </Field>
              <Field id="diag-temp" label="Temperature (°C)" className="col-span-2">
                <input
                  id="diag-temp"
                  type="number"
                  step="0.1"
                  value={form.temp}
                  onChange={event => setForm({ ...form, temp: event.target.value })}
                  className={`${INPUT_CLASS} text-amber-300`}
                />
              </Field>

              <button
                type="submit"
                disabled={!isFormValid}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 p-2.5 text-xs font-extrabold text-slate-950 shadow-elev-2 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                Transmit test GSM SMS packet
              </button>
            </form>
          </section>

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
              aria-label="GSM packet stream"
              className="mt-2 h-40 space-y-1.5 overflow-y-auto font-mono text-[11px]"
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

            {decoded && (
              <div className="mt-3 border-t border-slate-800 pt-3">
                <h3 className="eyebrow">Last decoded packet</h3>
                <pre className="data-num mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-cyan-300">
                  {JSON.stringify(decoded, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  'data-num w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 transition-colors focus:border-amber-400 focus:outline-none';

const LOG_TYPE_STYLES: Record<TerminalLog['type'], string> = {
  INFO: 'text-slate-400',
  SMS_INCOMING: 'text-amber-300',
  DECODE: 'text-cyan-300',
  TRIAGE: 'text-rose-400',
  AUDIO: 'text-violet-400',
  DISPATCH: 'text-emerald-400'
};

const DEVICE_STATUS_STYLES: Record<HardwareDeviceDiagnostics['status'], string> = {
  ONLINE: 'border-emerald-800 bg-emerald-950/60 text-emerald-400',
  LOW_BATTERY: 'border-amber-800 bg-amber-950/60 text-amber-400',
  CRITICAL: 'border-rose-800 bg-rose-950/60 text-rose-400 animate-pulse',
  OFFLINE: 'border-slate-700 bg-navy-850 text-slate-400'
};

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  valueClass: string;
  detail: string;
  small?: boolean;
};

function Metric({ icon, label, value, unit, valueClass, detail, small = false }: MetricProps) {
  return (
    <div className="panel p-3.5">
      <span className="eyebrow flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <p
        className={`data-num mt-2 font-mono font-extrabold leading-none ${valueClass} ${
          small ? 'text-base' : 'text-2xl'
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-[10px] font-semibold text-slate-400">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

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
