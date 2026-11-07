import { useEffect, useState } from 'react';
import type { PageRoute } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { formatClockTime } from '../utils/format';
import { Clock, Heart, Menu, Radio, ShieldAlert, Volume2, VolumeX, Zap } from 'lucide-react';

type HeaderProps = {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  redCount: number;
  amberCount: number;
  totalWearables: number;
  activeDispatches?: number;
  onMobileMenuToggle?: () => void;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
};

/** Exhaustive by type — a new route cannot be added without naming its page. */
const PAGE_TITLES: Record<PageRoute, string> = {
  DASHBOARD: 'Command center · dispatch & live ECG monitor',
  PATIENTS: 'Patient directory & health profile registry',
  SIMULATOR: 'EMER-BRACE hardware testing console',
  HARDWARE: 'SIM800 dual-PCB hardware & gateway diagnostics',
  FLEET: 'Addis Ababa hospital hubs & ambulance fleet',
  ANALYTICS: 'Triage intelligence & clinical impact',
  CAREGIVERS: 'Caregiver emergency network & SMS broadcasts',
  SETTINGS: 'Threshold rules & gateway configuration'
};

export function Header({
  currentRoute,
  onNavigate,
  redCount,
  amberCount,
  totalWearables,
  activeDispatches = 0,
  onMobileMenuToggle,
  onMenuToggle,
  isSidebarOpen
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState(() => formatClockTime());

  const handleMenuClick = onMenuToggle ?? onMobileMenuToggle;

  /*
   * Seeded from the synthesizer, not `false`: the settings page can mute the
   * console, and a local default of "unmuted" made the header icon disagree
   * with the actual audio state until the operator toggled it twice.
   */
  const [isMuted, setIsMuted] = useState(() => audioSynth.getMuted());

  useEffect(() => {
    const interval = window.setInterval(() => setTimeStr(formatClockTime()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioSynth.setMuted(nextMuted);
    // Played on unmute only, as an audible confirmation that audio is live.
    if (!nextMuted) audioSynth.playAmberAlert();
  };

  return (
    <header className="sticky top-0 z-30 h-11 shrink-0 border-b border-slate-800 bg-navy-900/95 px-3 text-slate-100 shadow-elev-1 backdrop-blur-md flex items-center">
      <div className="flex w-full items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Menu & Identity */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleMenuClick}
            aria-label="Toggle navigation menu"
            title="Toggle navigation sidebar (Alt+M)"
            className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
              isSidebarOpen
                ? 'border-cyan-500/60 bg-cyan-950/60 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'border-slate-700 bg-navy-850 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Menu className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline text-[11px]">Menu</span>
          </button>

          <span
            className="hidden sm:flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-rose-800/70 bg-rose-950/60 p-1 text-rose-400"
            aria-hidden="true"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="truncate text-xs font-extrabold tracking-tight text-white sm:text-sm">
                {PAGE_TITLES[currentRoute]}
              </h1>
              <span className="hidden xl:inline text-[10px] text-slate-500 font-mono">·</span>
              <span className="hidden xl:inline text-[10px] text-slate-400 truncate">
                Designed by{' '}
                <strong className="font-semibold text-slate-300">Emran Abduljelil Reshad</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Operations telemetry pills (Unified single-row) */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* GSM Gateway */}
          <span className="flex items-center gap-1 rounded-md border border-emerald-800/70 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" aria-hidden="true" />
            <span>SIM800</span>
          </span>

          {/* Critical alerts count */}
          <span
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${
              redCount > 0
                ? 'border-rose-800/80 bg-rose-950/70 text-rose-300 animate-pulse'
                : 'border-slate-800 bg-navy-950 text-slate-400'
            }`}
            title="Red critical triage cases"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${redCount > 0 ? 'bg-rose-400' : 'bg-slate-600'}`}
              aria-hidden="true"
            />
            <span>{redCount} Critical</span>
          </span>

          {/* Elevated amber alerts count */}
          {amberCount > 0 && (
            <span className="hidden sm:flex items-center gap-1 rounded-md border border-amber-800/70 bg-amber-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
              <span>{amberCount} Elevated</span>
            </span>
          )}

          {/* En route dispatches */}
          {activeDispatches > 0 && (
            <span className="hidden md:flex items-center gap-1 rounded-md border border-cyan-800/70 bg-cyan-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
              <span>{activeDispatches} En Route</span>
            </span>
          )}

          {/* Wearables Online */}
          <span className="flex items-center gap-1 rounded-md border border-slate-700 bg-navy-950 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
            <Heart className="w-2.5 h-2.5 fill-rose-500/30 text-rose-400" aria-hidden="true" />
            <span>{totalWearables} Online</span>
          </span>

          {/* Clock (EAT) */}
          <span className="hidden md:flex items-center gap-1 rounded-md border border-slate-700 bg-navy-950 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
            <Clock className="w-2.5 h-2.5 text-cyan-400" aria-hidden="true" />
            <span>{timeStr} EAT</span>
          </span>
        </div>

        {/* Right: Quick actions & Audio toggle */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate('SIMULATOR')}
            aria-current={currentRoute === 'SIMULATOR' ? 'page' : undefined}
            className={`hidden lg:flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors ${
              currentRoute === 'SIMULATOR'
                ? 'border-amber-400 bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                : 'border-amber-500/40 bg-navy-850 text-amber-400 hover:border-amber-400 hover:bg-navy-800'
            }`}
          >
            <Zap className="w-3 h-3" aria-hidden="true" />
            Hardware
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-pressed={!isMuted}
            aria-label={isMuted ? 'Unmute console audio alerts' : 'Mute console audio alerts'}
            className={`rounded-md border p-1.5 transition-colors ${
              isMuted
                ? 'border-slate-700 bg-navy-850 text-slate-500 hover:text-slate-300'
                : 'border-rose-800/60 bg-rose-950/60 text-rose-400 shadow-elev-1 hover:bg-rose-900/70'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
