import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  MapPin,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import type { PageRoute } from '../types';

export type TutorialStep = {
  id: string;
  targetSelector?: string;
  title: string;
  badge: string;
  icon: typeof Activity;
  description: string;
  highlights: string[];
  actionLabel?: string;
  onAction?: () => void;
};

type DashboardTutorialProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: PageRoute) => void;
};

export function DashboardTutorial({ isOpen, onClose, onNavigate }: DashboardTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TutorialStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: 'EMER-BRACE Command Center Walkthrough',
        badge: 'ORIENTATION',
        icon: Sparkles,
        description:
          'Welcome to the Emergency Maternal & Cardiac Telemetry Command Console. This system receives autonomous GSM SMS telemetry from wearable bracelets worn by high-risk patients across Addis Ababa, providing instant clinical triage without requiring internet or smartphones.',
        highlights: [
          'Direct GSM cellular SMS + GPS triage engine',
          'Automatic hospital routing & nearest ambulance dispatch',
          'Real-time Lead II ECG rhythm monitor with vital signs'
        ]
      },
      {
        id: 'distress-queue',
        targetSelector: '[data-tour="distress-queue"]',
        title: 'Live Distress Queue & Triage Feed',
        badge: 'STEP 1 OF 5 · TRIAGE',
        icon: Activity,
        description:
          'The left column displays all active emergency distress calls sorted by clinical severity (Critical Red, Elevated Amber, Stable Green). Each card summarizes vital signs, location, and reason for distress (e.g. Preeclampsia, Hypoxia, Severe Fall).',
        highlights: [
          'Dispatch Button: Instantly assigns the nearest ambulance unit',
          'Contact Button: Directly bridges family & caregiver telephone links',
          'Resolve Button: Archives incident once clinical handover completes',
          'Filter pills & search bar to isolate sub-cities or condition types'
        ]
      },
      {
        id: 'telemetry-map',
        targetSelector: '[data-tour="telemetry-map"]',
        title: 'GIS Telemetry Map & Hospital Routing',
        badge: 'STEP 2 OF 5 · GIS MAP',
        icon: MapPin,
        description:
          'The interactive map tracks patient distress coordinates in Addis Ababa. When an alert arrives, the system calculates proximity to major hospital trauma centers (Landmark, Tikur Anbessa, St. Paul’s) and generates driving ETA.',
        highlights: [
          'Pulsating red ring indicates exact patient GPS location',
          'Cyan cross pins mark participating hospital trauma centers',
          'Dispatch HUD displays receiving hospital, distance, and ETA',
          'Interactive pan, zoom, and instant "Recenter" control'
        ]
      },
      {
        id: 'ecg-monitor',
        targetSelector: '[data-tour="ecg-monitor"]',
        title: 'Real-Time ECG & Biosensor Lead Monitor',
        badge: 'STEP 3 OF 5 · VITALS',
        icon: Heart,
        description:
          'The bottom panel displays the live continuous Lead II electrocardiogram waveform of the selected patient. Vitals are illuminated with phosphor LED glow matching hospital telemetry monitors.',
        highlights: [
          'Dynamic heart rhythm with authentic QRS beeper sound synthesizer',
          'Interactive sweep speed (25 mm/s, 50 mm/s) & gain controls (5 to 20 mm/mV)',
          'Instant SpO₂ oxygen saturation, body temperature, and battery telemetry',
          'Pause & Reset buffer controls for clinical waveform review'
        ]
      },
      {
        id: 'simulator-gateway',
        targetSelector: '[data-tour="header-sim"]',
        title: 'SIM800 GSM Hardware Simulator',
        badge: 'STEP 4 OF 5 · SIMULATOR',
        icon: Zap,
        description:
          'Want to see how the physical wearable bracelet communicates with the cloud? The Hardware Simulator allows you to trigger realistic emergency scenarios (Manual SOS, Preeclampsia spike, Hypoxia, Severe Fall) and watch the raw SMS packet decode live.',
        highlights: [
          'Tests raw NMEA GPS coordinates and formatted SMS payloads',
          'Simulates Ethio-Telecom cellular network relay delays',
          'Inspects terminal logs and gateway baud rate diagnostics'
        ],
        actionLabel: 'Open Hardware Simulator',
        onAction: () => {
          if (onNavigate) {
            onNavigate('SIMULATOR');
            onClose();
          }
        }
      },
      {
        id: 'finish',
        title: 'You Are Ready to Command',
        badge: 'TUTORIAL COMPLETE',
        icon: CheckCircle2,
        description:
          'You now understand the core triage loop of EMER-BRACE. You can relaunch this tutorial anytime using the "Tour" button in the top navigation bar, or explore the research paper, pitch deck, and dual-PCB documentation on the About page.',
        highlights: [
          'Check the "Fleet & Hospitals" tab to manage ambulance units',
          'View "Diagnostics" for dual-PCB hardware register status',
          'Review "Analytics" for clinical response time metrics'
        ]
      }
    ],
    [onNavigate, onClose]
  );

  const currentStep = steps[currentStepIndex] ?? steps[0];

  // Update target rect on step change or resize
  const updateTargetRect = useCallback(() => {
    if (!currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [isOpen, currentStepIndex, updateTargetRect]);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('emer_tutorial_seen', 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  }, [dontShowAgain, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight' && currentStepIndex < steps.length - 1) {
        e.preventDefault();
        setCurrentStepIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        e.preventDefault();
        setCurrentStepIndex(i => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, handleClose]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      {/* Target spotlight border when an element is targeted */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all duration-300 ease-out z-40 animate-pulse"
          style={{
            top: `${Math.max(8, targetRect.top - 4)}px`,
            left: `${Math.max(8, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`
          }}
        />
      )}

      {/* Tutorial Floating Modal Card */}
      <div
        className="relative z-50 w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-navy-900/95 p-6 shadow-2xl shadow-cyan-950/70 backdrop-blur-xl animate-scale-in text-slate-100"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.25)'
        }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/60 text-cyan-400 shadow-sm">
              <StepIcon className="w-4 h-4" />
            </span>
            <div>
              <span className="rounded-full bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-cyan-300">
                {currentStep.badge}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="mt-4 space-y-4">
          <div>
            <h2 id="tutorial-title" className="text-lg font-bold text-white tracking-tight">
              {currentStep.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{currentStep.description}</p>
          </div>

          {/* Highlights bullet list */}
          <div className="rounded-xl border border-slate-800/80 bg-navy-950/70 p-3 space-y-2">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Key Capabilities:
            </div>
            <ul className="space-y-1.5">
              {currentStep.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Action trigger */}
          {currentStep.actionLabel && currentStep.onAction && (
            <div className="pt-1">
              <button
                type="button"
                onClick={currentStep.onAction}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                {currentStep.actionLabel}
              </button>
            </div>
          )}
        </div>

        {/* Footer with Step Dots & Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Don't show again toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 bg-navy-950 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Don't show automatically on start</span>
          </label>

          {/* Step dots & buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Dots */}
            <div className="flex items-center gap-1.5 mr-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStepIndex(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStepIndex
                      ? 'w-5 bg-cyan-400'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-navy-850 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-400/60 bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-900/40 hover:from-cyan-500 hover:to-emerald-500 transition-all"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStepIndex < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
