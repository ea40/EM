import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ThresholdSettings } from '../types';
import {
  DEFAULT_THRESHOLDS,
  NUMERIC_THRESHOLD_LABELS,
  validateThresholds,
  type NumericThresholdKey
} from '../config/thresholds';
import { THRESHOLD_RANGES, isWithinRange } from '../utils/validation';
import { audioSynth } from '../utils/audioSynth';
import {
  AudioLines,
  CheckCircle2,
  Cpu,
  Radio,
  RotateCcw,
  Save,
  Settings,
  Sliders,
  AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react';

type SettingsPageProps = {
  thresholds: ThresholdSettings;
  onSaveThresholds: (next: ThresholdSettings) => void;
};

const BAUD_RATES = [9600, 115200] as const;
const SAVED_BANNER_MS = 3000;

/** Field unit suffixes, so the input labels stay short and scannable. */
const THRESHOLD_UNITS: Record<NumericThresholdKey, string> = {
  spo2Critical: '%',
  spo2Warning: '%',
  hrCriticalHigh: 'BPM',
  hrWarningHigh: 'BPM',
  hrCriticalLow: 'BPM',
  tempFeverHigh: '°C',
  fallAccelG: 'g'
};

export function SettingsPage({ thresholds, onSaveThresholds }: SettingsPageProps) {
  /**
   * Draft copy so typing does not mutate live triage behaviour on every
   * keystroke. The decoder keeps using the committed thresholds until save.
   */
  const [draft, setDraft] = useState<ThresholdSettings>(thresholds);
  const [committed, setCommitted] = useState<ThresholdSettings>(thresholds);
  const [isAudioMuted, setIsAudioMuted] = useState(audioSynth.getMuted());
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<number | null>(null);

  // Re-sync if the parent's thresholds change while this page is mounted.
  if (committed !== thresholds && draft === committed) {
    setCommitted(thresholds);
    setDraft(thresholds);
  }

  useEffect(
    () => () => {
      if (savedTimeoutRef.current !== null) clearTimeout(savedTimeoutRef.current);
    },
    []
  );

  const errors = validateThresholds(draft);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(committed);
  const canSave = isDirty && errors.length === 0;

  const patch = <K extends keyof ThresholdSettings>(key: K, value: ThresholdSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const patchNumeric = (key: NumericThresholdKey, raw: string) => {
    // `Number('')` is 0, not NaN — an emptied field would otherwise commit a
    // threshold that makes every patient look stable.
    patch(key, raw.trim() === '' ? Number.NaN : Number(raw));
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    onSaveThresholds(draft);
    setCommitted(draft);
    audioSynth.playResolveSound();

    setShowSaved(true);
    if (savedTimeoutRef.current !== null) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = window.setTimeout(() => {
      setShowSaved(false);
      savedTimeoutRef.current = null;
    }, SAVED_BANNER_MS);
  };

  const handleReset = () => setDraft(DEFAULT_THRESHOLDS);

  const toggleAudio = () => {
    const next = !isAudioMuted;
    audioSynth.setMuted(next);
    setIsAudioMuted(next);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      {/* Header */}
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-slate-700 bg-navy-850 p-2.5 text-cyan-400">
            <Settings className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">System configuration</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Clinical triage thresholds and SIM800 gateway parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && errors.length === 0 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-800/70 bg-amber-950/50 px-2.5 py-1.5 text-[11px] font-bold text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              Unsaved changes
            </span>
          )}
          {showSaved && (
            <span
              role="status"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-800/70 bg-emerald-950/50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400 animate-fade-in"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Applied to triage engine
            </span>
          )}
        </div>
      </header>

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-rose-800/70 bg-rose-950/40 p-3.5"
        >
          <p className="flex items-center gap-2 text-xs font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            Configuration cannot be applied
          </p>
          <ul className="mt-2 space-y-1 pl-6 text-[11px] text-rose-200/90 list-disc">
            {errors.map(error => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Clinical thresholds */}
        <section className="panel p-4">
          <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Sliders className="w-4 h-4 text-rose-400" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Clinical threshold rules
            </h2>
          </header>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Applied by the decoder to every inbound GSM payload. A value crossing the critical
            bound escalates the alert to <span className="font-bold text-rose-400">Critical</span>;
            a value crossing the warning bound escalates to{' '}
            <span className="font-bold text-amber-400">Elevated</span>.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(NUMERIC_THRESHOLD_LABELS) as NumericThresholdKey[]).map(key => {
              const value = draft[key];
              const invalid = !isWithinRange(value, THRESHOLD_RANGES[key]);
              return (
                <label key={key} className="block">
                  <span className="eyebrow">{NUMERIC_THRESHOLD_LABELS[key]}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number"
                      step={key === 'tempFeverHigh' || key === 'fallAccelG' ? '0.1' : '1'}
                      min={THRESHOLD_RANGES[key].min}
                      max={THRESHOLD_RANGES[key].max}
                      value={Number.isFinite(value) ? value : ''}
                      onChange={event => patchNumeric(key, event.target.value)}
                      aria-invalid={invalid}
                      className={`data-num w-full rounded-lg border bg-navy-950 p-2 font-mono text-sm font-bold transition-colors focus:outline-none ${
                        invalid
                          ? 'border-rose-600 text-rose-400 focus:border-rose-400'
                          : 'border-slate-700 text-slate-100 focus:border-cyan-400'
                      }`}
                    />
                    <span className="w-10 shrink-0 text-[10px] font-bold text-slate-500">
                      {THRESHOLD_UNITS[key]}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Gateway + audio */}
        <div className="flex flex-col gap-3">
          <section className="panel p-4">
            <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                GSM SMS gateway
              </h2>
            </header>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="eyebrow">Serial gateway port</span>
                <input
                  type="text"
                  value={draft.gsmPort}
                  onChange={event => patch('gsmPort', event.target.value)}
                  className="data-num mt-1.5 w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-cyan-300 transition-colors focus:border-cyan-400 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="eyebrow">Baud rate</span>
                  <select
                    value={draft.gsmBaudRate}
                    onChange={event => patch('gsmBaudRate', Number(event.target.value))}
                    className="data-num mt-1.5 w-full rounded-lg border border-slate-700 bg-navy-950 p-2 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                  >
                    {BAUD_RATES.map(rate => (
                      <option key={rate} value={rate}>
                        {rate} baud{rate === 115200 ? ' (standard)' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="eyebrow">Cell network</span>
                  <p className="data-num mt-1.5 rounded-lg border border-slate-800 bg-navy-950 p-2 font-mono text-xs text-slate-400">
                    Ethio-Telecom GSM
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-4">
            <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <AudioLines className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Alert audio
              </h2>
            </header>

            <button
              type="button"
              onClick={toggleAudio}
              aria-pressed={isAudioMuted}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-navy-950 p-3 text-left transition-colors hover:border-slate-700"
            >
              <span className="flex items-center gap-2.5">
                {isAudioMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                )}
                <span>
                  <span className="block text-xs font-bold text-slate-200">
                    {isAudioMuted ? 'Alert audio muted' : 'Alert audio enabled'}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Critical, elevated and dispatch cues
                  </span>
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  isAudioMuted ? 'bg-slate-700' : 'bg-emerald-600'
                }`}
                aria-hidden="true"
              >
                {/*
                  `translate-x-4.5` is not on Tailwind's spacing scale, so it
                  compiled to nothing and the knob never left the left edge.
                  36px track - 16px knob - 2px inset = 18px.
                */}
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    isAudioMuted ? 'translate-x-0.5' : 'translate-x-[18px]'
                  }`}
                />
              </span>
            </button>

            <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
              <Cpu className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              Audio starts only after the browser registers a user gesture. If cues are silent,
              check the tab's autoplay permission.
            </p>
          </section>
        </div>

        {/* Actions */}
        <footer className="lg:col-span-2 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 self-start rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Restore defaults
          </button>

          <button
            type="submit"
            disabled={!canSave}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Save &amp; apply
          </button>
        </footer>
      </form>
    </div>
  );
}
