import { useMemo, useState } from 'react';
import type { AmbulanceUnit, EmergencyAlert } from '../types';
import { ADDIS_HOSPITALS } from '../data/mockData';
import { audioSynth } from '../utils/audioSynth';
import {
  rankHospitalsByDistance,
  selectDispatchableAmbulances,
  type RouteEstimate
} from '../utils/dispatch';
import { triageStyle } from '../utils/triage';
import { Modal } from './ui/Modal';
import { Ambulance, MapPin, AlertTriangle, X } from 'lucide-react';

type DispatchModalProps = {
  alert: EmergencyAlert | null;
  fleet: AmbulanceUnit[];
  onClose: () => void;
  onConfirmDispatch: (
    alertId: string,
    hospitalName: string,
    ambulanceId: string,
    etaMinutes: number
  ) => void;
};

export function DispatchModal({ alert, fleet, onClose, onConfirmDispatch }: DispatchModalProps) {
  /*
   * Both selections are stored as ids and resolved against live data during
   * render. Holding the chosen `HospitalNode` object itself meant a stale copy
   * survived across alerts and an unavailable unit could be dispatched twice.
   */
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [ambulanceId, setAmbulanceId] = useState<string | null>(null);

  const ranked = useMemo<RouteEstimate[]>(
    () => (alert ? rankHospitalsByDistance(alert.location, ADDIS_HOSPITALS) : []),
    [alert]
  );

  if (!alert) return null;

  const destination = ranked.find(entry => entry.hospital.id === hospitalId) ?? ranked[0] ?? null;
  const availableUnits = destination
    ? selectDispatchableAmbulances(fleet, destination.hospital.id)
    : [];
  const unit = availableUnits.find(candidate => candidate.id === ambulanceId) ?? availableUnits[0] ?? null;
  const canDispatch = Boolean(destination && unit);
  const style = triageStyle(alert.code);

  const handleConfirm = () => {
    if (!destination || !unit) return;
    audioSynth.playDispatchSound();
    onConfirmDispatch(alert.id, destination.hospital.name, unit.id, destination.etaMinutes);
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(alert)}
      onClose={onClose}
      label={`Ambulance dispatch for ${alert.patientName}`}
      panelClassName="max-w-xl"
    >
      <div className="space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl border border-rose-800/70 bg-rose-950/60 p-2 text-rose-400">
              <Ambulance className="w-4 h-4 animate-pulse" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100">Ambulance Dispatch</h2>
              <p className="text-[11px] text-slate-400">Addis Ababa emergency zone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dispatch dialog"
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        {/* Patient */}
        <div
          className="flex items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: `${style.hex}44`, backgroundColor: `${style.hex}12` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black text-slate-950 font-mono shadow-sm"
            style={{ backgroundColor: style.hex }}
            aria-hidden="true"
          >
            {alert.patientId.replace(/^EB-/, '')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="truncate text-sm font-bold text-slate-100">{alert.patientName}</h3>
              <span className="data-num font-mono text-[10px] text-slate-400">{alert.patientId}</span>
              <span
                className="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ color: style.hex, borderColor: `${style.hex}66` }}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{alert.chronicCondition}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-300">
              <MapPin className="w-3 h-3 shrink-0 text-rose-400" aria-hidden="true" />
              {alert.location.subCity} — {alert.location.address}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="data-num font-mono text-sm font-bold text-rose-400">
              {alert.vitals.heartRate}
            </p>
            <p className="eyebrow">BPM</p>
          </div>
        </div>

        {/* Receiving hospital */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h4 className="eyebrow">Receiving hospital</h4>
            <span className="text-[10px] text-slate-500">Ranked by distance from patient</span>
          </div>

          <div role="radiogroup" aria-label="Receiving hospital" className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {ranked.map((entry, index) => {
              const isSelected = destination?.hospital.id === entry.hospital.id;
              /*
               * Counted from the live fleet, not `hospital.availableAmbulances`.
               * That field is a static seed — it never decrements on dispatch,
               * so the dialog would advertise a unit that is already en route
               * and the operator would then find the unit picker below empty.
               */
              const readyUnits = selectDispatchableAmbulances(fleet, entry.hospital.id).length;

              return (
                <button
                  key={entry.hospital.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setHospitalId(entry.hospital.id);
                    setAmbulanceId(null);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-rose-500/70 bg-rose-950/40 shadow-glow-red'
                      : 'border-slate-800 bg-navy-950/60 hover:border-slate-700 hover:bg-navy-850'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`data-num flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                        isSelected
                          ? 'border-rose-500/60 text-rose-300'
                          : 'border-slate-700 text-slate-500'
                      }`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-100">
                        {entry.hospital.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {entry.hospital.subCity} &middot; {entry.hospital.type} &middot;{' '}
                        {/*
                          A hub with nothing dispatchable is flagged before the
                          operator commits to it, rather than after they select
                          it and the unit picker comes back empty.
                        */}
                        <span
                          className={`data-num font-bold ${
                            readyUnits === 0 ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          {readyUnits}
                        </span>{' '}
                        units
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="data-num font-mono text-xs font-bold text-emerald-400">
                      {entry.distanceKm.toFixed(1)} km
                    </p>
                    <p className="data-num text-[10px] text-slate-400">~{entry.etaMinutes} min</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Ambulance unit */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h4 className="eyebrow">Mobile unit</h4>
            {destination && (
              <span className="text-[10px] text-slate-500">
                Based at {destination.hospital.name.split('(')[0].trim()}
              </span>
            )}
          </div>

          {availableUnits.length === 0 ? (
            <p className="flex items-center gap-2 rounded-xl border border-amber-800/60 bg-amber-950/40 p-3 text-[11px] text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              No unit available at this hospital. Choose another receiving facility.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {availableUnits.map(candidate => {
                const isSelected = unit?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setAmbulanceId(candidate.id)}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-cyan-500/70 bg-cyan-950/40 shadow-glow-cyan'
                        : 'border-slate-800 bg-navy-950/60 hover:border-slate-700 hover:bg-navy-850'
                    }`}
                  >
                    <p className="data-num font-mono text-[11px] font-bold text-cyan-300">
                      {candidate.id}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {candidate.driverName} &middot; {candidate.paramedicName}
                    </p>
                    <p className="data-num mt-0.5 text-[10px] text-slate-500">
                      Fuel {candidate.fuelLevel}% &middot; {candidate.currentSubCity}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Summary + confirm */}
        <footer className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <dl className="flex gap-5">
            <div>
              <dt className="eyebrow">Unit</dt>
              <dd className="data-num mt-0.5 font-mono text-xs font-bold text-cyan-300">
                {unit?.id ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Distance</dt>
              <dd className="data-num mt-0.5 font-mono text-xs font-bold text-slate-200">
                {destination ? `${destination.distanceKm.toFixed(1)} km` : '—'}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">ETA</dt>
              <dd className="data-num mt-0.5 font-mono text-sm font-extrabold text-emerald-400">
                {destination ? `~${destination.etaMinutes} min` : '—'}
              </dd>
            </div>
          </dl>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canDispatch}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              <Ambulance className="w-4 h-4" aria-hidden="true" />
              {canDispatch ? 'Confirm dispatch' : 'No unit available'}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}
