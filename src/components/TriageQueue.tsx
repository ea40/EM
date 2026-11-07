import { useMemo, useState, type ReactNode } from 'react';
import type { EmergencyAlert, ThresholdSettings, TriageCode } from '../types';
import { formatElapsed } from '../utils/format';
import { triageStyle } from '../utils/triage';
import {
  heartRateSeverity,
  spo2Severity,
  temperatureSeverity,
  type VitalSeverity
} from '../utils/vitals';
import {
  Ambulance,
  Battery,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  PhoneCall,
  Search,
  ShieldAlert,
  Zap
} from 'lucide-react';

type TriageQueueProps = {
  alerts: EmergencyAlert[];
  thresholds: ThresholdSettings;
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
  onDispatchClick: (alert: EmergencyAlert) => void;
  onContactClick: (alert: EmergencyAlert) => void;
  onResolveClick: (alert: EmergencyAlert) => void;
};

type FilterId = 'ALL' | TriageCode;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'RED', label: 'Critical' },
  { id: 'AMBER', label: 'Elevated' },
  { id: 'GREEN', label: 'Stable' },
  { id: 'RESOLVED', label: 'Resolved' }
];

/**
 * Severity colours, driven by the configured clinical thresholds rather than by
 * literals in the markup — see `utils/vitals.ts` for why that matters.
 */
const VITAL_TONE: Record<VitalSeverity, string> = {
  critical: 'text-rose-400',
  warning: 'text-amber-400',
  normal: 'text-slate-200'
};

/**
 * Device health, not clinical triage: the decoder never classifies on battery,
 * so this is a plain product constant rather than an operator-set threshold.
 */
const LOW_BATTERY_PERCENT = 20;

export function TriageQueue({
  alerts,
  thresholds,
  selectedAlertId,
  onSelectAlert,
  onDispatchClick,
  onContactClick,
  onResolveClick
}: TriageQueueProps) {
  const [filterCode, setFilterCode] = useState<FilterId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    const tally: Record<FilterId, number> = {
      ALL: alerts.length,
      RED: 0,
      AMBER: 0,
      GREEN: 0,
      RESOLVED: 0
    };
    for (const alert of alerts) tally[alert.code] += 1;
    return tally;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return alerts.filter(alert => {
      if (filterCode !== 'ALL' && alert.code !== filterCode) return false;
      if (query === '') return true;

      return (
        alert.patientName.toLowerCase().includes(query) ||
        alert.patientId.toLowerCase().includes(query) ||
        alert.chronicCondition.toLowerCase().includes(query) ||
        alert.location.subCity.toLowerCase().includes(query)
      );
    });
  }, [alerts, filterCode, searchQuery]);

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      {/* Controls */}
      <div className="space-y-2 border-b border-slate-800 bg-navy-950/60 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            Distress queue
          </h2>
          <span className="data-num rounded border border-slate-700 bg-navy-950 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">
            {filteredAlerts.length}/{alerts.length}
          </span>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-2 h-3 w-3 text-slate-500"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="triage-search">
            Search alerts
          </label>
          <input
            id="triage-search"
            type="search"
            placeholder="Patient, ID, condition, sub-city…"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-navy-950 py-1 pl-7 pr-2 text-xs text-slate-200 transition-colors placeholder:text-slate-600 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by triage code"
          className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-0.5"
        >
          {FILTERS.map(filter => {
            const isActive = filterCode === filter.id;
            const style = filter.id === 'ALL' ? null : triageStyle(filter.id);

            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilterCode(filter.id)}
                className={`flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'border-slate-600 bg-navy-850 font-semibold text-slate-100'
                    : 'border-slate-800 bg-navy-950/50 text-slate-400 hover:bg-navy-850 hover:text-slate-200'
                }`}
              >
                {filter.label}
                <span
                  className={`data-num rounded-full bg-navy-950 px-1 py-0.2 text-[9px] font-bold ${
                    style ? style.text : 'text-slate-400'
                  }`}
                >
                  {counts[filter.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2 p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" aria-hidden="true" />
            <p className="text-xs font-semibold text-slate-400">No alerts match this filter</p>
            <p className="max-w-[14rem] text-[10px] leading-relaxed text-slate-600">
              Inject a GSM payload from the simulator page to raise a new emergency alert.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              thresholds={thresholds}
              isSelected={alert.id === selectedAlertId}
              onSelect={() => onSelectAlert(alert.id)}
              onDispatch={() => onDispatchClick(alert)}
              onContact={() => onContactClick(alert)}
              onResolve={() => onResolveClick(alert)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type AlertCardProps = {
  alert: EmergencyAlert;
  thresholds: ThresholdSettings;
  isSelected: boolean;
  onSelect: () => void;
  onDispatch: () => void;
  onContact: () => void;
  onResolve: () => void;
};

function AlertCard({
  alert,
  thresholds,
  isSelected,
  onSelect,
  onDispatch,
  onContact,
  onResolve
}: AlertCardProps) {
  const style = triageStyle(alert.code);
  const isRed = alert.code === 'RED';
  const isDispatched = alert.dispatchStatus !== 'UNASSIGNED';

  /*
   * Severity is scored against the operator's configured thresholds, so a vital
   * is painted the same colour the decoder used to raise the alert. Hardcoded
   * cutoffs here used to disagree with the decoder under the *default* settings.
   */
  const hrTone = VITAL_TONE[heartRateSeverity(alert.vitals.heartRate, thresholds)];
  const spo2Tone = VITAL_TONE[spo2Severity(alert.vitals.spo2, thresholds)];
  const tempTone = VITAL_TONE[temperatureSeverity(alert.vitals.temperature, thresholds)];
  const batteryTone =
    alert.vitals.battery < LOW_BATTERY_PERCENT ? 'text-rose-400' : 'text-slate-300';

  return (
    <article
      className={`relative rounded-xl border transition-colors ${
        isSelected
          ? 'border-rose-500/70 shadow-glow-red'
          : isRed
            ? 'border-rose-800/60'
            : 'border-slate-800 hover:border-slate-700'
      }`}
      style={{ backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.9)' : `${style.hex}08` }}
    >
      {isRed && (
        <span
          className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-rose-500 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/*
        Whole-card selection as an overlay button rather than a click handler on
        a div: this is focusable, Enter/Space-activatable, and announced as a
        button. The content layer sits above it but is pointer-transparent, so a
        click anywhere except the action row falls through to this button.
      */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`Select ${alert.patientName}, ${style.label}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl"
      />

      <div className="pointer-events-none relative z-10 space-y-2 p-2.5">
        {/* Identity + triage */}
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-slate-950 font-mono shadow-sm"
              style={{ backgroundColor: style.hex }}
              aria-hidden="true"
            >
              {alert.patientId.replace(/^EB-/, '')}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-xs font-bold text-slate-100">{alert.patientName}</h3>
                <span className="data-num shrink-0 font-mono text-[9px] text-slate-500">
                  {alert.patientId}
                </span>
              </div>
              <p className="truncate text-[10px] text-slate-400">
                {alert.chronicCondition}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 text-[9px] font-black uppercase"
              style={{
                color: style.hex,
                borderColor: `${style.hex}80`,
                backgroundColor: `${style.hex}1F`
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: style.hex }}
                aria-hidden="true"
              />
              {style.label}
            </span>
            <span className="data-num flex items-center gap-1 font-mono text-[9px] text-slate-500">
              <Clock className="w-2.5 h-2.5 text-cyan-400" aria-hidden="true" />
              {formatElapsed(alert.timestamp)}
            </span>
          </div>
        </header>

        {/* Distress reason */}
        <p className="panel-inset flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-slate-200">
          <Zap
            className={`w-3 h-3 shrink-0 ${isRed ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}
            aria-hidden="true"
          />
          <span className="truncate">{alert.title}</span>
        </p>

        {/* Vitals strip */}
        <dl className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-navy-950/60 p-1 text-[10px]">
          <Vital label="HR" icon={<Heart className="w-2 h-2 text-rose-400" aria-hidden="true" />}>
            <span className={hrTone}>{alert.vitals.heartRate}</span>
          </Vital>
          <Vital label="SpO₂">
            <span className={spo2Tone}>{alert.vitals.spo2}%</span>
          </Vital>
          <Vital label="Temp">
            <span className={tempTone}>{alert.vitals.temperature}°C</span>
          </Vital>
          <Vital
            label="Bat"
            icon={<Battery className="w-2 h-2 text-emerald-400" aria-hidden="true" />}
          >
            <span className={batteryTone}>{alert.vitals.battery}%</span>
          </Vital>
        </dl>

        {/* Location + dispatch state */}
        <div className="flex items-center justify-between gap-1.5 text-[10px]">
          <span className="flex min-w-0 items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 shrink-0 text-rose-400" aria-hidden="true" />
            <span className="truncate">
              {alert.location.subCity} — {alert.location.address}
            </span>
          </span>
          {isDispatched && (
            <span className="shrink-0 rounded border border-cyan-800 bg-cyan-950/60 px-1 py-0.2 text-[9px] font-bold text-cyan-400">
              {alert.dispatchStatus.replaceAll('_', ' ')}
            </span>
          )}
        </div>

        {/* Actions — the only interactive children, so they re-enable pointer events. */}
        <div className="pointer-events-auto grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={onDispatch}
            className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold transition-colors ${
              isDispatched
                ? 'border border-cyan-700/60 bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-rose-600 text-white shadow-elev-1 hover:bg-rose-500'
            }`}
          >
            <Ambulance className="w-3 h-3 shrink-0" aria-hidden="true" />
            {isDispatched ? 'Dispatched' : 'Dispatch'}
          </button>

          <button
            type="button"
            onClick={onContact}
            className="flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-navy-850 px-1.5 py-1 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <PhoneCall className="w-3 h-3 shrink-0 text-emerald-400" aria-hidden="true" />
            Contact
          </button>

          <button
            type="button"
            onClick={onResolve}
            className="flex items-center justify-center gap-1 rounded-md border border-slate-800 bg-navy-950 px-1.5 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-navy-850"
          >
            <CheckCircle2 className="w-3 h-3 shrink-0 text-cyan-400" aria-hidden="true" />
            Resolve
          </button>
        </div>
      </div>
    </article>
  );
}

type VitalProps = {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
};

function Vital({ label, icon, children }: VitalProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded bg-navy-950/50 p-1">
      <dt className="flex items-center gap-0.5 text-[9px] uppercase text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="data-num font-mono font-bold">{children}</dd>
    </div>
  );
}
