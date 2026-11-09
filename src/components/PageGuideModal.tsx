import { useState, useEffect, useCallback } from 'react';
import type { PageRoute } from '../types';
import { ArrowLeft, ArrowRight, HelpCircle, Sparkles, X } from 'lucide-react';

type GuideStep = {
  id: string;
  targetSelector?: string;
  badge: string;
  title: string;
  description: string;
  keyPoints: string[];
};

type PageGuideConfig = {
  pageTitle: string;
  pageSubtitle: string;
  steps: GuideStep[];
};

const PAGE_GUIDES: Record<PageRoute, PageGuideConfig> = {
  DASHBOARD: {
    pageTitle: 'Command Center · Live Telemetry & Triage',
    pageSubtitle: 'Real-time maternal and cardiac emergency triage across Addis Ababa',
    steps: [
      {
        id: 'distress-queue',
        targetSelector: '[data-tour="distress-queue"]',
        badge: 'PANEL 1 · LIVE TRIAGE QUEUE',
        title: 'Emergency Distress Queue',
        description:
          'Monitors incoming autonomous GSM SMS distress alerts prioritized by clinical severity. High-risk maternal preeclampsia and cardiac hypoxia triggers are immediately placed at the top of the queue.',
        keyPoints: [
          'Red Critical: Requires immediate ambulance dispatch or ICU transfer',
          'Amber Elevated: Urgent biometric anomaly requiring clinical evaluation',
          'One-click Dispatch, Contact Caregiver, and Resolve actions on every card'
        ]
      },
      {
        id: 'telemetry-map',
        targetSelector: '[data-tour="telemetry-map"]',
        title: 'Addis Ababa GIS Telemetry Map',
        badge: 'PANEL 2 · GIS MAP',
        description:
          'Interactive Leaflet GIS map tracking patient coordinates. When a distress signal arrives, the engine automatically routes the nearest ambulance and calculates driving ETA to receiving hospital trauma centers.',
        keyPoints: [
          'Pulsating red beacons mark exact patient distress GPS coordinates',
          'Cyan hospital pins indicate trauma centers (Landmark, Tikur Anbessa, St. Paul’s)',
          'Dispatch HUD shows nearest hospital recommendation with real-time ETA'
        ]
      },
      {
        id: 'ecg-monitor',
        targetSelector: '[data-tour="ecg-monitor"]',
        badge: 'PANEL 3 · LIVE VITALS',
        title: 'Real-Time Lead II ECG & Biosensors',
        description:
          'Continuous Lead II electrocardiogram waveform sweep paired with real-time photoplethysmography (SpO₂), contactless infrared body temperature, and battery telemetry with phosphor LED illumination.',
        keyPoints: [
          'Dynamic heart rhythm sweep with authentic QRS acoustic beeper',
          'Clinical speed (25/50 mm/s) and gain controls (5 to 20 mm/mV)',
          'Pause and reset buffer for careful arrhythmia and baseline analysis'
        ]
      }
    ]
  },
  FLEET: {
    pageTitle: 'Hospital Hubs & Emergency Fleet Network',
    pageSubtitle: 'Coordinate ambulance dispatch and hospital trauma centers in Addis Ababa',
    steps: [
      {
        id: 'fleet-hospitals',
        badge: 'HOSPITAL HUBS',
        title: 'Participating Hospital Network',
        description:
          'Direct integration with major emergency facilities across Addis Ababa, including Tikur Anbessa (Black Lion), St. Paul’s Millennium Medical College, and Landmark General Hospital.',
        keyPoints: [
          'Live receiving status: Intensive Care (ICU) and Obstetric Trauma capacity',
          'Average response times and designated sub-city catchment zones',
          'Direct trauma unit phone bridge for immediate clinical pre-notification'
        ]
      },
      {
        id: 'fleet-units',
        badge: 'AMBULANCE FLEET',
        title: 'Active Ambulance Readiness',
        description:
          'Tracks mobile ambulance units, their readiness status (Ready, En Route, In Maintenance), assigned crew certifications, and onboard life-support equipment.',
        keyPoints: [
          'Real-time vehicle status indicators (Available vs Deployed)',
          'Quick dispatch re-assignment during multi-patient incidents',
          'Integrated telemetry relay between paramedic tablets and central command'
        ]
      }
    ]
  },
  SIMULATOR: {
    pageTitle: 'EMER-BRACE SIM800 Hardware Testing Console',
    pageSubtitle: 'Simulate GSM SMS cellular packets and raw NMEA GPS streams',
    steps: [
      {
        id: 'sim-scenarios',
        badge: 'EMERGENCY SCENARIOS',
        title: 'One-Click Trigger Presets',
        description:
          'Inject realistic emergency scenarios into the command network to test triage thresholds, alarm synthesizers, and hospital dispatch workflows.',
        keyPoints: [
          'Manual SOS Trigger: Simulates patient pressing the tactile micro-button',
          'Preeclampsia Spike: High systolic blood pressure & tachycardia telemetry',
          'Critical Hypoxia: Blood oxygen (SpO₂) drop below 80% threshold',
          'Severe Fall Impact: MPU6050 6-axis accelerometer spike (>3.2g)'
        ]
      },
      {
        id: 'sim-terminal',
        badge: 'GSM TERMINAL',
        title: 'Raw SMS & NMEA Packet Decoder',
        description:
          'Inspect the exact cellular payloads sent over the Ethio-Telecom 2G network. Verifies packet framing, checksums, and baud rate parsing.',
        keyPoints: [
          'Format: [ID]#[EVENT]#[LAT,LNG]#[HR]#[SPO2]#[TEMP]#[BAT]',
          'Real-time terminal log stream with CRT phosphor styling',
          'Simulates cellular propagation delay and network carrier handshakes'
        ]
      }
    ]
  },
  PATIENTS: {
    pageTitle: 'Patient Directory & Biometric Registry',
    pageSubtitle: 'High-risk patient clinical profiles and assigned hardware bracelets',
    steps: [
      {
        id: 'patients-registry',
        badge: 'PATIENT PROFILES',
        title: 'Clinical Condition Tracking',
        description:
          'Maintains detailed health profiles for registered patients, including 34-week high-risk pregnancies, severe COPD, epilepsy, and cardiac arrhythmia risk.',
        keyPoints: [
          'Emergency contact details for family and attending obstetricians/cardiologists',
          'Unique wearable serial number mapping (e.g. EB-101-ET)',
          'Search and filter by sub-city (Bole, Yeka, Kirkos) and blood type'
        ]
      }
    ]
  },
  HARDWARE: {
    pageTitle: 'Dual-PCB Hardware Diagnostics & Sensors',
    pageSubtitle: 'Inspect register health for Arduino Nano, SIM800A, Neo-6M, and MAX30100',
    steps: [
      {
        id: 'hardware-registers',
        badge: 'DIAGNOSTICS MATRIX',
        title: 'Sensor & Gateway Health',
        description:
          'Monitors internal hardware registers across the Top processing PCB and Bottom sensor layer to ensure reliability before field deployment.',
        keyPoints: [
          'SIM800A GSM signal strength (dBm) and Ethio-Telecom registration',
          'u-blox Neo-6M GPS satellite fix quality and HDOP dilution',
          'MAX30100 optical LED photodiode current and GY-906 IR thermopile calibration',
          'MPU6050 6-axis gyroscope zero-g baseline and LiPo battery voltage'
        ]
      }
    ]
  },
  ANALYTICS: {
    pageTitle: 'Triage Intelligence & Clinical Analytics',
    pageSubtitle: 'Measure ambulance response times and Golden Hour preservation',
    steps: [
      {
        id: 'analytics-kpis',
        badge: 'CLINICAL KPIS',
        title: 'Response Time & Mortality Impact',
        description:
          'Quantifies how automated GSM telemetry reduces dispatch delay compared to traditional phone calls, tracking the critical first 60 minutes.',
        keyPoints: [
          'Average Emergency Response Time (ETA vs on-scene arrival)',
          'Golden Hour Stroke & Cardiac Protection percentage',
          'Sub-city incident density distribution across Addis Ababa'
        ]
      }
    ]
  },
  CAREGIVERS: {
    pageTitle: 'Caregiver Emergency Network & SMS Broadcasts',
    pageSubtitle: 'Manage direct family communication bridges during acute crises',
    steps: [
      {
        id: 'caregivers-broadcast',
        badge: 'EMERGENCY BRIDGES',
        title: 'Automated Family Alerts',
        description:
          'When a distress event triggers, the system automatically transmits localized SMS notifications to designated family caregivers alongside hospital dispatch.',
        keyPoints: [
          'Primary and secondary caregiver telephone registries',
          'One-click direct phone dial bridge for triage operators',
          'Delivery confirmation receipts over Ethio-Telecom gateway'
        ]
      }
    ]
  },
  SETTINGS: {
    pageTitle: 'Triage Rules & Gateway Configuration',
    pageSubtitle: 'Configure physiological thresholds and acoustic alarm synthesizer',
    steps: [
      {
        id: 'settings-thresholds',
        badge: 'CLINICAL THRESHOLDS',
        title: 'Customizable Triage Limits',
        description:
          'Adjust vital sign triggers for automatic emergency categorization based on medical protocol.',
        keyPoints: [
          'SpO₂ Hypoxia cutoff (default: <90% elevated, <85% critical)',
          'Tachycardia & Bradycardia heart rate limits (BPM)',
          'MPU6050 fall detection acceleration threshold (g-force)',
          'Audio synthesizer master volume and alarm frequency controls'
        ]
      }
    ]
  },
  LANDING: {
    pageTitle: 'EMER-BRACE Project Overview & Publications',
    pageSubtitle: 'Research paper, pitch presentation deck, and 2-PCB hardware architecture',
    steps: [
      {
        id: 'landing-docs',
        badge: '3 SHOWCASE DOCUMENTS',
        title: 'Official Publications & Deck',
        description:
          'Explore the scientific abstract paper (with 2-page high-resolution poster viewer), the official 9-slide pitch presentation deck, and the dual-PCB engineering manual.',
        keyPoints: [
          'Interactive 2-page poster viewer with clinical citations',
          '9-slide pitch presentation carousel with lightbox zoom',
          'Direct PDF download buttons for all 3 original documents',
          'Dual-PCB architecture breakdown with 3D CAD model'
        ]
      }
    ]
  }
};

type PageGuideModalProps = {
  currentRoute: PageRoute;
  isOpen: boolean;
  onClose: () => void;
};

export function PageGuideModal({ currentRoute, isOpen, onClose }: PageGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const guide = PAGE_GUIDES[currentRoute] ?? PAGE_GUIDES.DASHBOARD;
  const steps = guide.steps;
  const currentStep = steps[currentStepIndex] ?? steps[0];

  // Reset step index when route changes
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [currentRoute]);

  // Update target bounding box without scrolling violently
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
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
    try {
      localStorage.setItem(`emer_guide_seen_${currentRoute}`, 'true');
    } catch {
      // ignore
    }
    onClose();
  }, [currentRoute, onClose]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-end sm:justify-end p-4 sm:p-6"
      role="dialog"
      aria-modal="false"
      aria-labelledby="guide-title"
    >
      {/* Target illuminated spotlight frame - pointer events disabled so dashboard remains interactive */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-300 ease-out z-40 animate-pulse"
          style={{
            top: `${Math.max(6, targetRect.top - 4)}px`,
            left: `${Math.max(6, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`
          }}
        />
      )}

      {/* Floating Tactical Callout Card - docked cleanly on the side */}
      <div
        className="pointer-events-auto relative z-50 w-full max-w-md rounded-2xl border border-cyan-500/40 bg-navy-900/95 p-5 shadow-2xl backdrop-blur-xl animate-scale-in text-slate-100"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(6, 182, 212, 0.25)'
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/70 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-cyan-300">
                {currentStep.badge}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="mt-3 space-y-3">
          <div>
            <h2 id="guide-title" className="text-base font-bold text-white tracking-tight">
              {currentStep.title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{currentStep.description}</p>
          </div>

          {/* Key capabilities bullet list */}
          <div className="rounded-xl border border-slate-800/90 bg-navy-950/80 p-3 space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Operational Focus:
            </div>
            <ul className="space-y-1">
              {currentStep.keyPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-200">
                  <span className="h-1 w-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Re-open guide tip notice */}
          <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/30 px-2.5 py-1.5 flex items-center gap-2 text-[11px] text-cyan-300">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Tip: Revisit this guide anytime by clicking the <strong>?</strong> icon in the top
              header.
            </span>
          </div>
        </div>

        {/* Footer: Pagination & Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStepIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIndex
                    ? 'w-4 bg-cyan-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
            <span className="ml-1 text-[10px] font-mono text-slate-400">
              {currentStepIndex + 1}/{steps.length}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-navy-850 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (currentStepIndex < steps.length - 1) {
                  setCurrentStepIndex(i => i + 1);
                } else {
                  handleClose();
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-cyan-400/60 bg-gradient-to-r from-cyan-600 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:from-cyan-500 hover:to-emerald-500 transition-all"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Got it' : 'Next'}</span>
              {currentStepIndex < steps.length - 1 && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
