import { useMemo } from 'react';
import type { AmbulanceUnit, EmergencyAlert } from '../types';
import { ADDIS_HOSPITALS } from '../data/mockData';
import { selectDispatchableAmbulances, deployedAmbulanceCount } from '../utils/dispatch';
import { triageStyle } from '../utils/triage';
import { Ambulance, Building2, Fuel, MapPin, Phone } from 'lucide-react';

type FleetNetworkPageProps = {
  fleet: AmbulanceUnit[];
  alerts: EmergencyAlert[];
};

const UNIT_STATUS_STYLES: Record<AmbulanceUnit['status'], string> = {
  AVAILABLE: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
  EN_ROUTE: 'bg-rose-950/60 text-rose-400 border-rose-800 animate-pulse',
  ON_SCENE: 'bg-cyan-950/60 text-cyan-400 border-cyan-800',
  MAINTENANCE: 'bg-slate-800 text-slate-400 border-slate-700'
};

export function FleetNetworkPage({ fleet, alerts }: FleetNetworkPageProps) {
  const availableCount = useMemo(
    () => fleet.filter(unit => unit.status === 'AVAILABLE').length,
    [fleet]
  );

  /** Alert lookup so a dispatched unit can name the incident it is serving. */
  const alertById = useMemo(() => {
    const index = new Map<string, EmergencyAlert>();
    for (const alert of alerts) index.set(alert.id, alert);
    return index;
  }, [alerts]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-emerald-800/60 bg-emerald-950/60 p-2.5 text-emerald-400">
            <Ambulance className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">
              Addis Ababa dispatch fleet &amp; medical hub network
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Live vehicle availability across {ADDIS_HOSPITALS.length} clinical hubs
            </p>
          </div>
        </div>

        <span className="data-num flex items-center gap-1.5 self-start rounded-lg border border-emerald-800/70 bg-emerald-950/50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          {availableCount} of {fleet.length} units ready
        </span>
      </header>

      {/* Hospital hubs */}
      <section className="space-y-2">
        <h2 className="eyebrow flex items-center gap-2 px-1">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          Emergency medical dispatch hubs
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ADDIS_HOSPITALS.map(hospital => {
            /*
             * Counted from the live fleet, not `hospital.availableAmbulances`.
             * The static number does not move when a unit is dispatched, so the
             * hub card would keep advertising a vehicle that is already en route.
             */
            const readyUnits = selectDispatchableAmbulances(fleet, hospital.id).length;
            const deployedUnits = deployedAmbulanceCount(fleet, hospital.id);
            /*
             * Denominator for the readiness bar. Every unit homed at this hub,
             * maintenance included, so the bar measures readiness against the
             * real fleet rather than an already-filtered subset.
             */
            const totalUnits = fleet.filter(unit => unit.hospitalId === hospital.id).length;

            return (
              <article key={hospital.id} className="panel flex flex-col p-4">
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-100">{hospital.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 shrink-0 text-rose-400" aria-hidden="true" />
                      {hospital.subCity} &middot; {hospital.type}
                    </p>
                  </div>
                  <span className="data-num shrink-0 rounded border border-cyan-800 bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
                    {hospital.id}
                  </span>
                </header>

                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <div className="panel-inset p-2">
                    <dt className="eyebrow">Units ready</dt>
                    <dd
                      className={`data-num mt-1 font-mono text-sm font-extrabold ${
                        readyUnits === 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {readyUnits}
                    </dd>
                  </div>
                  {/*
                    Was "Dispatches today", seeded from a static field that never
                    moved — sitting next to a live count, it read as live too.
                    Deployed units are the honest live counterpart: both tiles now
                    come from the same fleet array the dispatch dialog acts on.
                  */}
                  <div className="panel-inset p-2">
                    <dt className="eyebrow">Units deployed</dt>
                    <dd className="data-num mt-1 font-mono text-sm font-extrabold text-cyan-300">
                      {deployedUnits}
                    </dd>
                  </div>
                </dl>

                {/*
                  Readiness proportion. The tiles carry the numbers; the bar lets
                  a hub at one-of-four read as strained while scanning the grid,
                  before any figure is actually read.
                */}
                {totalUnits > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full border border-slate-800 bg-navy-950"
                      role="presentation"
                    >
                      <div
                        className={`h-full transition-[width] duration-500 ease-out-expo ${
                          readyUnits === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(readyUnits / totalUnits) * 100}%` }}
                      />
                    </div>
                    <span className="data-num shrink-0 font-mono text-[10px] text-slate-500">
                      {readyUnits}/{totalUnits} ready
                    </span>
                  </div>
                )}

                <p className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-2.5 text-[11px]">
                  <span className="text-slate-500">Emergency hotline</span>
                  <span className="data-num font-mono font-semibold text-slate-200">
                    {hospital.phone}
                  </span>
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Fleet registry */}
      <section className="space-y-2 pb-1">
        <h2 className="eyebrow flex items-center gap-2 px-1">
          <Ambulance className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          Active ambulance registry
        </h2>

        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Ambulance units, crew and current assignments</caption>
            <thead className="border-b border-slate-800 bg-navy-950/60 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="p-3 font-semibold">Unit</th>
                <th scope="col" className="p-3 font-semibold">Home hub</th>
                <th scope="col" className="p-3 font-semibold">Status</th>
                <th scope="col" className="p-3 font-semibold">Crew</th>
                <th scope="col" className="p-3 font-semibold">Zone</th>
                <th scope="col" className="p-3 font-semibold">Fuel</th>
                <th scope="col" className="p-3 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fleet.map(unit => {
                const assignedAlert = unit.assignedAlertId
                  ? alertById.get(unit.assignedAlertId) ?? null
                  : null;
                const assignedStyle = assignedAlert ? triageStyle(assignedAlert.code) : null;

                return (
                  <tr key={unit.id} className="transition-colors hover:bg-navy-850/60">
                    <td className="data-num p-3 font-mono font-bold text-cyan-300">{unit.id}</td>
                    <td className="p-3 font-medium text-slate-200">{unit.hospitalName}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${UNIT_STATUS_STYLES[unit.status]}`}
                      >
                        {unit.status.replaceAll('_', ' ')}
                      </span>
                      {assignedStyle && (
                        <span
                          className="data-num ml-1.5 font-mono text-[10px]"
                          style={{ color: assignedStyle.hex }}
                        >
                          {unit.assignedAlertId}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="block font-semibold text-slate-200">
                        {unit.paramedicName}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Driver: {unit.driverName}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{unit.currentSubCity}</td>
                    <td className="p-3">
                      <span
                        className={`data-num flex items-center gap-1 font-mono font-bold ${
                          unit.fuelLevel < 25 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        <Fuel className="w-3 h-3" aria-hidden="true" />
                        {unit.fuelLevel}%
                      </span>
                    </td>
                    <td className="data-num p-3 font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        {unit.phone}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
