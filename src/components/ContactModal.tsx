import { useEffect, useRef, useState } from 'react';
import type { EmergencyAlert } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { Modal } from './ui/Modal';
import {
  PhoneCall,
  PhoneOff,
  Stethoscope,
  UserRound,
  X
} from 'lucide-react';

type CallState = 'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED';

type ContactModalProps = {
  alert: EmergencyAlert | null;
  onClose: () => void;
};

const DIAL_CONNECT_DELAY_MS = 3000;
const CALL_END_DELAY_MS = 1000;

function formatCallDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function ContactModal({ alert, onClose }: ContactModalProps) {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [timerSecs, setTimerSecs] = useState(0);

  // Timeouts must be cancellable: an operator closing the dialog mid-dial would
  // otherwise leave a live timer that flips state on an unmounted component.
  const timeoutsRef = useRef<number[]>([]);

  const schedule = (action: () => void, delayMs: number) => {
    timeoutsRef.current.push(window.setTimeout(action, delayMs));
  };

  useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    },
    []
  );

  useEffect(() => {
    if (callState !== 'CONNECTED') return;
    const interval = window.setInterval(() => setTimerSecs(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  if (!alert) return null;

  const { contact } = alert;

  const startCall = () => {
    /*
     * Cancel anything already in flight before dialling. `endCall` schedules
     * the close, and the control flips straight back to "Start voice call"
     * while that close is still pending — without this, redialling inside the
     * one-second window let the stale close fire and shut the dialog mid-dial.
     */
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setCallState('DIALING');
    audioSynth.playPhoneRing();
    schedule(() => {
      setCallState('CONNECTED');
      setTimerSecs(0);
    }, DIAL_CONNECT_DELAY_MS);
  };

  const endCall = () => {
    setCallState('ENDED');
    audioSynth.playPhoneDisconnect();
    schedule(onClose, CALL_END_DELAY_MS);
  };

  return (
    <Modal isOpen={Boolean(alert)} onClose={onClose} label={`Caregiver dialer for ${alert.patientName}`}>
      <div className="space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="rounded-xl border border-emerald-800/70 bg-emerald-950/60 p-2 text-emerald-400">
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-100">Caregiver Dialer</h2>
              <p className="text-[11px] text-slate-400 truncate">
                {alert.patientName} &middot; {alert.patientId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialer"
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        {/* Contact card */}
        <div className="space-y-3 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-700/60 bg-navy-850 text-emerald-400 shadow-elev-2">
            <UserRound className="w-7 h-7" aria-hidden="true" />
          </div>

          <div>
            <p className="eyebrow">{contact.relation}</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-100">{contact.primaryName}</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Designated contact for <span className="text-rose-400">{alert.patientName}</span>
            </p>
          </div>

          <div className="panel-inset mx-auto max-w-xs p-3">
            <p className="eyebrow">Ethio-Telecom mobile gateway</p>
            <p className="data-num mt-1 text-base font-extrabold text-emerald-400">
              {contact.primaryPhone}
            </p>
          </div>

          {contact.doctorName && (
            <div className="panel-inset mx-auto flex max-w-xs items-center gap-2 p-2.5 text-left">
              <Stethoscope className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-200">{contact.doctorName}</p>
                <p className="data-num truncate text-[10px] text-slate-400">{contact.doctorPhone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call state */}
        <div role="status" aria-live="polite" className="min-h-[3.5rem]">
          {callState === 'IDLE' && (
            <p className="pt-2 text-center text-[11px] text-slate-500">
              Dial the primary caregiver through the GSM gateway.
            </p>
          )}

          {callState === 'DIALING' && (
            <div className="space-y-2 pt-1 text-center">
              <p className="animate-pulse font-mono text-[11px] font-bold text-amber-400">
                DIALING GSM CELL TOWER…
              </p>
              <div className="flex justify-center gap-1.5" aria-hidden="true">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {callState === 'CONNECTED' && (
            <div className="space-y-2 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3">
              <p className="flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
                CONNECTED
                <span className="data-num font-mono text-slate-200">{formatCallDuration(timerSecs)}</span>
              </p>
              <div className="flex h-6 items-center justify-center gap-1" aria-hidden="true">
                {[40, 70, 30, 90, 50, 80, 40].map((height, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-full bg-emerald-400 animate-pulse"
                    style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {callState === 'ENDED' && (
            <p className="pt-2 text-center text-[11px] font-bold text-slate-400">Call ended</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center border-t border-slate-800 pt-4">
          {callState === 'IDLE' || callState === 'ENDED' ? (
            <button
              type="button"
              onClick={startCall}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-emerald-500"
            >
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
              Start voice call
            </button>
          ) : (
            <button
              type="button"
              onClick={endCall}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-rose-500"
            >
              <PhoneOff className="w-4 h-4" aria-hidden="true" />
              End call
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
