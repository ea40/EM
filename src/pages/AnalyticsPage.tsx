import { useMemo, type ReactNode } from 'react';
import type { EmergencyAlert, EventType, Patient } from '../types';
import { TRIAGE_STYLES, triageStyle } from '../utils/triage';
import {
  Activity,
  BarChart3,
  MapPin,
  PieChart,
  ShieldCheck,
  Timer,
  TrendingDown,
  Zap
} from 'lucide-react';

type AnalyticsPageProps = {
  alerts: EmergencyAlert[];
  patients: Patient[];
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MANUAL_SOS: 'Manual SOS press',
  FALL_DETECTED: 'Maternal fall & impact',
  CRITICAL_HYPOXIA: 'Critical SpO₂ hypoxia',
  TACHYCARDIAC_SPIKE: 'Cardiac tachycardia',
  ARRHYTHMIA_DETECTED: 'Arrhythmia detected',
  ROUTINE_TELEMETRY: 'Routine telemetry'
};

/** Categorical palette — deliberately distinct from the triage semantic colours. */
const CATEGORY_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-slate-500'
];

export function AnalyticsPage({ alerts, patients }: AnalyticsPageProps) {
  const subCityStats = useMemo(() => groupCounts(alerts.map(a => a.location.subCity)), [alerts]);
  const triggerStats = useMemo(() => groupCounts(alerts.map(a => a.eventType)), [alerts]);

  const dispatched = useMemo(() => alerts.filter(a => typeof a.etaMinutes === 'number'), [alerts]);

  const meanEtaMinutes = useMemo(() => {
    if (dispatched.length === 0) return null;
    const total = dispatched.reduce((sum, alert) => sum + (alert.etaMinutes ?? 0), 0);
    return total / dispatched.length;
  }, [dispatched]);

  const resolvedCount = useMemo(() => alerts.filter(a => a.code === 'RESOLVED').length, [alerts]);

  const triageBreakdown = useMemo(
    () =>
      (['RED', 'AMBER', 'GREEN', 'RESOLVED'] as const).map(code => ({
        code,
        count: alerts.filter(a => a.code === code).length
      })),
    [alerts]
  );

  const resolutionRate = alerts.length === 0 ? null : (resolvedCount / alerts.length) * 100;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-violet-800/60 bg-violet-950/60 p-2.5 text-violet-400">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">
              Telemetry &amp; triage intelligence
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Live aggregates over {alerts.length} alerts from {patients.length} enrolled wearables
            </p>
          </div>
        </div>
      </header>

      {/* KPIs — every figure is derived from current state, none are placeholders. */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          icon={<Timer className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Mean dispatch ETA"
          value={meanEtaMinutes === null ? '—' : `${meanEtaMinutes.toFixed(1)} min`}
          accent="text-emerald-400"
          detail={
            dispatched.length === 0
              ? 'No units dispatched yet'
              : `Across ${dispatched.length} dispatched incident${dispatched.length === 1 ? '' : 's'}`
          }
        />
        <Kpi
          icon={<TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Open critical incidents"
          value={String(alerts.filter(a => a.code === 'RED').length)}
          accent="text-rose-400"
          detail={`${alerts.filter(a => a.code === 'AMBER').length} elevated alongside`}
        />
        <Kpi
          icon={<ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Resolution rate"
          value={resolutionRate === null ? '—' : `${resolutionRate.toFixed(0)}%`}
          accent="text-cyan-300"
          detail={`${resolvedCount} of ${alerts.length} incidents closed`}
        />
        <Kpi
          icon={<Activity className="w-3.5 h-3.5" aria-hidden="true" />}
          label="Wearables online"
          value={String(patients.length)}
          accent="text-slate-100"
          detail="Zero smartphone or Wi-Fi dependency"
        />
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DistributionCard
          title="Distress incidents by sub-city"
          icon={<MapPin className="w-4 h-4 text-rose-500" aria-hidden="true" />}
          unit="incident"
          emptyMessage="No geo-tagged incidents have been received yet."
          rows={subCityStats}
        />

        <DistributionCard
          title="Emergency trigger categories"
          icon={<Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />}
          unit="alert"
          emptyMessage="No alerts have been decoded from the GSM gateway yet."
          rows={triggerStats.map(row => ({
            ...row,
            label: EVENT_TYPE_LABELS[row.label as EventType] ?? row.label
          }))}
        />
      </div>

      {/* Triage mix — the semantic colour scale, used the same way everywhere. */}
      <section className="panel p-4">
        <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <PieChart className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Triage mix across the active board
          </h2>
        </header>

        <div className="mt-3 space-y-2.5">
          {triageBreakdown.map(({ code, count }) => {
            const style = triageStyle(code);
            const pct = alerts.length === 0 ? 0 : (count / alerts.length) * 100;

            return (
              <div key={code} className="space-y-1">
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: style.hex }}>
                    {style.label}
                  </span>
                  <span className="data-num font-mono font-bold text-slate-300">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950">
                  <div
                    className="h-full transition-[width] duration-500 ease-out-expo"
                    style={{ width: `${pct}%`, backgroundColor: style.hex }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 flex items-center gap-1.5 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: TRIAGE_STYLES.RED.hex }}
            aria-hidden="true"
          />
          Colour is paired with its label everywhere in the console — triage is never colour-only.
        </p>
      </section>
    </div>
  );
}

type KpiProps = {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
  detail: string;
};

function Kpi({ icon, label, value, accent, detail }: KpiProps) {
  return (
    <div className="panel p-4">
      <span className="eyebrow flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <p className={`data-num mt-2 font-mono text-2xl font-extrabold leading-none ${accent}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

type DistributionRow = { label: string; count: number; pct: number; color: string };

type DistributionCardProps = {
  title: string;
  icon: ReactNode;
  unit: string;
  emptyMessage: string;
  rows: DistributionRow[];
};

function DistributionCard({ title, icon, unit, emptyMessage, rows }: DistributionCardProps) {
  return (
    <section className="panel p-4">
      <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        {icon}
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="mt-4 text-[11px] text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {rows.map(row => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="font-medium text-slate-300">{row.label}</span>
                <span className="data-num font-mono font-bold text-slate-400">
                  {row.count} {unit}
                  {row.count === 1 ? '' : 's'} ({row.pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-navy-950">
                <div
                  className={`h-full ${row.color} transition-[width] duration-500 ease-out-expo`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Counts occurrences of a key, ordered most-frequent first.
 *
 * Percentages are relative to the number of *buckets counted*, not to the
 * caller's total, so a distribution over a filtered subset still sums to 100.
 */
function groupCounts(keys: readonly string[]): DistributionRow[] {
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = keys.length;

  // Colour is assigned after sorting so the palette runs in rank order rather
  // than in first-seen order, which would make the same category change colour
  // as incident counts shift.
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, pct: total === 0 ? 0 : (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .map((row, index) => ({ ...row, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }));
}
