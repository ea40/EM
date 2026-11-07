import { useState, type FormEvent } from 'react';
import type { EmergencyAlert } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { triageStyle } from '../utils/triage';
import { Modal } from './ui/Modal';
import { CheckCircle2, X } from 'lucide-react';

type ResolutionModalProps = {
  alert: EmergencyAlert | null;
  onClose: () => void;
  onConfirmResolve: (alertId: string, notes: string) => void;
};

const DEFAULT_NOTE = 'Patient stabilized by clinical dispatch team. Vitals within safe threshold.';

export function ResolutionModal({ alert, onClose, onConfirmResolve }: ResolutionModalProps) {
  /**
   * Reset per alert. The dialog is keyed by alert id in App, so a fresh mount
   * already clears this — the render-phase reset below is the belt to that
   * braces, covering any future caller that renders the modal without a key.
   */
  const [notes, setNotes] = useState(DEFAULT_NOTE);
  const [forAlertId, setForAlertId] = useState<string | null>(alert?.id ?? null);

  if (!alert) return null;

  if (forAlertId !== alert.id) {
    setForAlertId(alert.id);
    setNotes(DEFAULT_NOTE);
  }

  const style = triageStyle(alert.code);

  const handleResolve = (event: FormEvent) => {
    event.preventDefault();
    audioSynth.playResolveSound();
    onConfirmResolve(alert.id, notes.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(alert)}
      onClose={onClose}
      label={`Resolve alert for ${alert.patientName}`}
      panelClassName="max-w-md"
    >
      <form onSubmit={handleResolve} className="space-y-4">
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl border border-cyan-800/70 bg-cyan-950/60 p-2 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100">Acknowledge &amp; resolve</h2>
              <p className="text-[11px] text-slate-400">Record the clinical outcome</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resolution dialog"
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <div
          className="rounded-xl border p-3"
          style={{ borderColor: `${style.hex}44`, backgroundColor: `${style.hex}12` }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-xs font-bold text-slate-100">{alert.patientName}</p>
            <span className="data-num font-mono text-[10px] text-slate-400">{alert.patientId}</span>
          </div>
          <p className="mt-1 text-[11px]" style={{ color: style.hex }}>
            {alert.title}
          </p>
          {alert.assignedAmbulanceId && (
            <p className="data-num mt-1.5 font-mono text-[10px] text-slate-400">
              Dispatched: {alert.assignedAmbulanceId}
              {alert.dispatchedHospital ? ` from ${alert.dispatchedHospital}` : ''}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="resolution-notes" className="eyebrow block">
            Clinical outcome notes
          </label>
          <textarea
            id="resolution-notes"
            rows={4}
            required
            value={notes}
            onChange={event => setNotes(event.target.value)}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-700 bg-navy-950 p-3 text-xs text-slate-100 transition-colors placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={notes.trim().length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Mark as resolved
          </button>
        </footer>
      </form>
    </Modal>
  );
}
