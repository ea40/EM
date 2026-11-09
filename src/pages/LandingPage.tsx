import { useState, useEffect } from 'react';
import type { PageRoute } from '../types';
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Maximize2,
  ShieldAlert,
  X
} from 'lucide-react';

type LandingPageProps = {
  onNavigate: (route: PageRoute) => void;
  onStartTour: () => void;
};

const DECK_SLIDES = [
  {
    num: 1,
    title: 'Cover & Vision',
    subtitle: 'Save lives through instant connectivity',
    image: '/showcase/deck_slide_1.jpg',
    description:
      'A portable and affordable smart emergency alert bracelet connecting high-risk patients directly to hospitals.'
  },
  {
    num: 2,
    title: 'The Problem',
    subtitle: '71% of global deaths from chronic illness',
    image: '/showcase/deck_slide_2.jpg',
    description:
      'Over 85% of chronic disease deaths occur in low- and middle-income nations. 70% of maternal deaths happen due to delayed medical help, and 5M stroke patients die outside the first golden hour.'
  },
  {
    num: 3,
    title: 'The Objective',
    subtitle: 'Cutting preventable mortality by up to 80%',
    image: '/showcase/deck_slide_3.jpg',
    description:
      'Empowering high-risk patients with real-time autonomous alerts for preeclampsia, seizures, stroke, and cardiac arrest in low-resource environments like Ethiopia.'
  },
  {
    num: 4,
    title: 'The Solution',
    subtitle: 'Connected, Autonomous & Immediate',
    image: '/showcase/deck_slide_4.jpg',
    description:
      'Direct SMS + GPS links to hospitals, ambulances, and family caregivers without needing a smartphone. Tracks heart rate, SpO2, temperature, and predicts falls before impact.'
  },
  {
    num: 5,
    title: 'Hardware Components',
    subtitle: 'Engineered for low-cost reliability',
    image: '/showcase/deck_slide_5.jpg',
    description:
      'Arduino Nano microcontroller, MPU6050 motion sensor, Neo-6M GPS receiver, SIM800A GSM transceiver, MAX30100 pulse oximeter, and GY-906 contactless infrared thermometer.'
  },
  {
    num: 6,
    title: 'Clinical & Societal Impact',
    subtitle: '60% faster emergency response',
    image: '/showcase/deck_slide_6.jpg',
    description:
      'Protects 3x more high-risk individuals at a fraction of consumer smartwatch costs, making life-saving telecare accessible across developing regions.'
  },
  {
    num: 7,
    title: 'Future Roadmap',
    subtitle: 'Nationwide healthcare integration',
    image: '/showcase/deck_slide_7.jpg',
    description:
      'Expanding nationwide hospital partnerships, developing integrated ambulance routing, and adding non-invasive continuous blood pressure and glucose tracking.'
  },
  {
    num: 8,
    title: 'Awards & Recognition',
    subtitle: 'African Leadership Academy Winner',
    image: '/showcase/deck_slide_8.jpg',
    description:
      'Winner of the National African Leadership Academy (ALA) "Build-in-a-Box" Summer Program Idea Pitching Competition held in South Africa.'
  },
  {
    num: 9,
    title: 'Dual-PCB 3D CAD Architecture',
    subtitle: 'Compact 2-PCB stacked watch format',
    image: '/showcase/deck_slide_9.jpg',
    description:
      'Top PCB (43×43 mm) outer processing & GSM layer paired with Bottom PCB (26×26 mm) direct skin-contact sensor array in a silicone/recycled polymer enclosure.'
  }
];

const ABSTRACT_PAGES = [
  {
    page: 1,
    title: 'Page 1: Title, Abstract & Medical Background',
    image: '/showcase/abstract_p1_2.png',
    summary:
      'Covers institutional attribution (KUE Minilik I Science Shared Campus), author team (Emran Abduljelil & Aishah Abas), problem motivation (stroke golden hour, maternal preeclampsia), and core sensors.'
  },
  {
    page: 2,
    title: 'Page 2: Clinical Impact, UN SDGs & References',
    image: '/showcase/abstract_p1_1.png',
    summary:
      'Covers system novelty (direct hospital link vs smartphone dependency), alignment with UN SDGs 3 & 9, and peer-reviewed citations (PubMed Central PMC11786524, MDPI, BMC Public Health).'
  }
];

export function LandingPage({ onNavigate, onStartTour }: LandingPageProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [abstractViewerOpen, setAbstractViewerOpen] = useState(false);
  const [abstractPageIndex, setAbstractPageIndex] = useState(0);
  const [genericLightboxImage, setGenericLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top' | 'bottom' | 'enclosure'>('top');

  const activeSlide = DECK_SLIDES[currentSlideIndex];
  const activeAbstractPage = ABSTRACT_PAGES[abstractPageIndex];

  // Keyboard navigation for abstract modal
  useEffect(() => {
    if (!abstractViewerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbstractViewerOpen(false);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setAbstractPageIndex(i => (i === 0 ? 1 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setAbstractPageIndex(i => (i === 1 ? 0 : 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abstractViewerOpen]);

  return (
    <div className="h-full overflow-y-auto bg-[#070b14] text-slate-100 select-text font-sans">
      {/* 1. MULTI-PAGE ABSTRACT POSTER LIGHTBOX MODAL */}
      {abstractViewerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Control Bar */}
          <div className="flex w-full max-w-4xl items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-950/70 text-cyan-400">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white truncate">
                  Scientific Research Paper · {activeAbstractPage.title}
                </h3>
                <span className="text-[11px] font-mono text-cyan-400">
                  Page {activeAbstractPage.page} of {ABSTRACT_PAGES.length}
                </span>
              </div>
            </div>

            {/* Page Switcher Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-700 bg-navy-950 p-0.5">
                {ABSTRACT_PAGES.map((pg, idx) => (
                  <button
                    key={pg.page}
                    type="button"
                    onClick={() => setAbstractPageIndex(idx)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      abstractPageIndex === idx
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Page {pg.page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setAbstractViewerOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close abstract viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* High-Resolution Poster Image Display */}
          <div className="relative my-auto flex w-full max-w-4xl items-center justify-center overflow-hidden py-2">
            <img
              src={activeAbstractPage.image}
              alt={activeAbstractPage.title}
              className="max-h-[75vh] w-auto rounded-lg border border-slate-800 bg-white object-contain shadow-2xl"
            />

            {/* Left / Right chevron buttons */}
            <button
              type="button"
              onClick={() => setAbstractPageIndex(i => (i === 0 ? 1 : 0))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-700 bg-navy-950/90 p-2 text-white hover:bg-cyan-600 transition-colors shadow-lg"
              aria-label="Switch page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setAbstractPageIndex(i => (i === 1 ? 0 : 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-700 bg-navy-950/90 p-2 text-white hover:bg-cyan-600 transition-colors shadow-lg"
              aria-label="Switch page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Bar: Summary & Download */}
          <div className="flex w-full max-w-4xl items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <div className="truncate max-w-xl text-[11px] text-slate-300">
              {activeAbstractPage.summary}
            </div>

            <a
              href="/docs/Emerbrace Abstract.pdf"
              download="Emerbrace Abstract.pdf"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-600/70 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      )}

      {/* 2. GENERIC SLIDE LIGHTBOX MODAL */}
      {genericLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setGenericLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setGenericLightboxImage(null)}
              className="absolute -top-10 right-0 rounded-full bg-slate-800 p-1.5 text-white hover:bg-slate-700"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={genericLightboxImage}
              alt="High resolution preview"
              className="max-h-[85vh] w-auto rounded-lg border border-slate-700 object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* HERO SECTION - TACTICAL BENTO EDITORIAL */}
      <section id="overview" className="border-b border-slate-800/80 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Vision & Primary Calls */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/80 bg-navy-950 px-3 py-1 text-xs font-mono font-semibold text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AUTONOMOUS CLINICAL TELEMETRY</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">ADDIS ABABA</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Emergency Alert Bracelet for{' '}
                <span className="text-cyan-400">High-Risk Patients</span> in Low-Resource Care
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                A dual-PCB wearable medical device engineered to eliminate preventable deaths from
                maternal preeclampsia, stroke, hypoxia, and acute falls. Directly communicates with
                hospital trauma centers and family caregivers via autonomous 2G GSM SMS and GPS —
                with zero reliance on smartphones or internet connectivity.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('DASHBOARD')}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/80 bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-glow-emerald hover:bg-emerald-500 transition-all hover:scale-[1.02]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Launch Live Command Console</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('DASHBOARD');
                    onStartTour();
                  }}
                  className="flex items-center gap-2 rounded-xl border border-cyan-700/80 bg-navy-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-cyan-300 hover:border-cyan-400 hover:bg-navy-850 transition-all"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Walkthrough</span>
                </button>

                <a
                  href="#documents"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-navy-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Explore 3 Research Docs</span>
                </a>
              </div>

              {/* Authors attribution */}
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                <span>Research Authors:</span>
                <strong className="text-slate-200">Emran Abduljelil Reshad</strong>
                <span className="text-slate-600">&amp;</span>
                <strong className="text-slate-200">Aishah Abas</strong>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">KUE Minilik I Science Shared Campus</span>
              </div>
            </div>

            {/* Right Column: Tactical Live Telemetry HUD Widget */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-navy-950/90 p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                      EB-101-ET Telemetry Feed
                    </span>
                  </div>
                  <span className="rounded bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                    SIM800 ONLINE
                  </span>
                </div>

                {/* Vitals grid */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Heart Rate
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-emerald-400 led-glow-emerald">
                        98
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">BPM</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono">Normal sinus</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Oxygen Saturation
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-emerald-400 led-glow-emerald">
                        97%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">SpO₂</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono">Optimal</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      IR Body Temp
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-cyan-400 led-glow-cyan">
                        37.1°
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">C</span>
                    </div>
                    <span className="text-[9px] text-cyan-400 font-mono">GY-906 Contactless</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      GPS Location
                    </span>
                    <div className="mt-1 text-xs font-mono font-bold text-slate-200">
                      9.0024, 38.7842
                    </div>
                    <span className="text-[9px] text-slate-400">Bole Sub-City · Addis</span>
                  </div>
                </div>

                {/* Raw SMS packet preview */}
                <div className="mt-4 rounded-xl border border-slate-800 bg-navy-900 p-2.5 font-mono text-[10px] text-slate-300">
                  <div className="text-slate-500 uppercase tracking-wider text-[9px] mb-1">
                    Cellular GSM SMS Payload:
                  </div>
                  <code className="text-cyan-300">
                    EB-101#MANUAL_SOS#9.0024,38.7842#HR:98#SPO2:97#TMP:37.1#BAT:88%
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO GRID: 4 KEY IMPACT METRICS */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono led-glow-emerald">
                80%
              </div>
              <div className="mt-1 text-xs font-bold text-white">Mortality Reduction</div>
              <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                Early triage for preeclampsia, acute stroke, and sudden cardiac arrhythmia.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono led-glow-cyan">
                60%
              </div>
              <div className="mt-1 text-xs font-bold text-white">Faster Response</div>
              <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                Automated GPS packets route nearest ambulance without delayed verbal directions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono led-glow-amber">
                &lt; 60m
              </div>
              <div className="mt-1 text-xs font-bold text-white">Golden Hour Safe</div>
              <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                Critical 1-hour intervention window for stroke thrombolysis and ICU survival.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4">
              <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono led-glow-red">
                $0
              </div>
              <div className="mt-1 text-xs font-bold text-white">Smartphone Needed</div>
              <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                100% standalone cellular IoT operation over standard 2G Ethio-Telecom SIM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AWARDS & RECOGNITION */}
      <section
        id="accolades"
        className="border-b border-slate-800/80 bg-navy-950/40 px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-navy-900 p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/10 text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="rounded-full bg-amber-950 border border-amber-700/80 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-amber-300">
                  NATIONAL COMPETITION WINNER
                </span>
                <h3 className="mt-1 text-base sm:text-lg font-bold text-white">
                  African Leadership Academy "Build-in-a-Box" Idea Pitching Competition
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  South Africa · Developed at{' '}
                  <strong className="text-amber-300">KUE Minilik I Science Shared Campus</strong>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/70 p-2 text-center min-w-[95px]">
                <div className="text-[9px] font-bold text-emerald-400 uppercase">UN SDG 3</div>
                <div className="text-xs font-black text-white">Good Health</div>
              </div>
              <div className="rounded-xl border border-blue-800/70 bg-blue-950/70 p-2 text-center min-w-[95px]">
                <div className="text-[9px] font-bold text-blue-400 uppercase">UN SDG 9</div>
                <div className="text-xs font-black text-white">Innovation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 SHOWCASE DOCUMENTS SECTION */}
      <section id="documents" className="border-b border-slate-800/80 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-cyan-950 border border-cyan-800 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
              PROJECT ARCHIVE
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-white">
              The 3 EMER-BRACE Project Documents
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Interactive access to the scientific research abstract, the official pitch
              presentation deck, and the two-PCB engineering hardware specification.
            </p>
          </div>

          {/* DOCUMENT 1: RESEARCH ABSTRACT & PAPER */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-navy-900/90 p-6 lg:p-7">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-800 bg-cyan-950 text-cyan-400">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    DOCUMENT 1 · SCIENTIFIC RESEARCH ABSTRACT
                  </span>
                </div>

                <h3 className="mt-2 text-xl font-black text-white">
                  EMER-BRACE: A Smart Emergency Bracelet For Instant Emergency Alerts
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Published by{' '}
                  <strong className="text-slate-200">KUE Minilik I Science Shared Campus</strong> ·
                  Authors: Emran Abduljelil Reshad &amp; Aishah Abas
                </p>

                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  "Unlike traditional alert systems that only notify nearby contacts or require
                  smartphone connectivity, EMER-BRACE directly links patients to hospitals ensuring
                  faster and more reliable medical response. Features include registered patient
                  profiles, automated SMS + GPS coordinates sent to hospital trauma wards and
                  caregivers, continuous photoplethysmography (SpO₂ &amp; pulse) and contactless
                  infrared thermometry, and a tactile manual SOS button."
                </p>

                {/* Peer-reviewed sources referenced */}
                <div className="mt-3 rounded-xl border border-slate-800/80 bg-navy-950/70 p-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Cited Peer-Reviewed Medical Citations:
                  </span>
                  <ul className="mt-1 space-y-1 text-xs text-slate-300">
                    <li>• NIH PubMed Central PMC11786524: Golden Hour Stroke Interventions</li>
                    <li>
                      • MDPI Journal 2077-0383/13/16/4780: Cellular Telemetry in Critical Care
                    </li>
                    <li>
                      • BMC Public Health s12889-021-12169-7: Maternal Mortality in Low-Resource
                      Systems
                    </li>
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAbstractPageIndex(0);
                      setAbstractViewerOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-cyan-500/70 bg-cyan-950/60 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>View 2-Page High-Res Poster</span>
                  </button>

                  <a
                    href="/docs/Emerbrace Abstract.pdf"
                    download="Emerbrace Abstract.pdf"
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-850 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download Abstract PDF</span>
                  </a>
                </div>
              </div>

              {/* Poster 2-Page Thumbnail Switcher */}
              <div className="w-full lg:w-72 shrink-0 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>POSTER PAGES (CLICK TO BROWSE):</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="group cursor-pointer rounded-xl border border-slate-700 bg-white p-1 hover:border-cyan-400 transition-colors"
                    onClick={() => {
                      setAbstractPageIndex(0);
                      setAbstractViewerOpen(true);
                    }}
                  >
                    <img
                      src="/showcase/abstract_p1_2.png"
                      alt="Poster Page 1: Abstract & Study"
                      className="w-full h-28 object-contain rounded"
                    />
                    <div className="mt-1 text-[9px] font-mono text-center text-slate-900 font-bold truncate">
                      Page 1: Abstract
                    </div>
                  </div>

                  <div
                    className="group cursor-pointer rounded-xl border border-slate-700 bg-white p-1 hover:border-cyan-400 transition-colors"
                    onClick={() => {
                      setAbstractPageIndex(1);
                      setAbstractViewerOpen(true);
                    }}
                  >
                    <img
                      src="/showcase/abstract_p1_1.png"
                      alt="Poster Page 2: SDGs & References"
                      className="w-full h-28 object-contain rounded"
                    />
                    <div className="mt-1 text-[9px] font-mono text-center text-slate-900 font-bold truncate">
                      Page 2: References
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT 2: OFFICIAL PITCH DECK & PRESENTATION (9 SLIDES) */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-navy-900/90 p-6 lg:p-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-800 bg-amber-950 text-amber-400">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    DOCUMENT 2 · OFFICIAL PITCH DECK
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-black text-white">
                  EMER-BRACE Pitch Deck &amp; System Overview (9 Slides)
                </h3>
              </div>

              <a
                href="/docs/Emerbrace.pdf"
                download="Emerbrace.pdf"
                className="flex items-center gap-1.5 rounded-lg border border-amber-600/70 bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Deck PDF</span>
              </a>
            </div>

            {/* Interactive Slide Viewer */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <div className="relative group overflow-hidden rounded-2xl border border-slate-700 bg-black aspect-[16/10] flex items-center justify-center shadow-xl">
                  <img
                    src={activeSlide.image}
                    alt={`Slide ${activeSlide.num}: ${activeSlide.title}`}
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => setGenericLightboxImage(activeSlide.image)}
                  />

                  {/* Previous / Next buttons */}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex(i => (i > 0 ? i - 1 : DECK_SLIDES.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-navy-950/90 p-2 text-white hover:bg-cyan-600 transition-colors shadow-md"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex(i => (i < DECK_SLIDES.length - 1 ? i + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-navy-950/90 p-2 text-white hover:bg-cyan-600 transition-colors shadow-md"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenericLightboxImage(activeSlide.image)}
                    className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-navy-950/90 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3 h-3" /> Fullscreen
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-navy-950 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      SLIDE {activeSlide.num} OF {DECK_SLIDES.length}
                    </span>
                    <span className="font-bold text-amber-400">{activeSlide.subtitle}</span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-white">{activeSlide.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {activeSlide.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Jump to Slide:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DECK_SLIDES.map((s, idx) => (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`rounded-lg border p-1 text-center transition-all ${
                          idx === currentSlideIndex
                            ? 'border-amber-400 bg-amber-950/60 text-amber-300 font-bold'
                            : 'border-slate-800 bg-navy-950 text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-mono">#{s.num}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT 3: WEARABLE PCB SYSTEM DOCUMENTATION */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-navy-900/90 p-6 lg:p-7">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-800 bg-emerald-950 text-emerald-400">
                    <Cpu className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    DOCUMENT 3 · HARDWARE ENGINEERING MANUAL
                  </span>
                </div>

                <h3 className="mt-2 text-xl font-black text-white">
                  Wearable Dual-PCB System Documentation &amp; Architecture
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Full Technical Specification: Dual-layer circuit topology, sensor interfaces, and
                  power routing
                </p>

                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  "The system is divided into two printed circuit boards (PCBs). The top PCB (43 ×
                  43 mm) contains the processing and cellular communication components, while the
                  bottom PCB (26 × 26 mm) contains sensors that directly interact with the user's
                  skin. The enclosure and straps are engineered from medical silicone, fabric, and
                  recycled plastic to ensure durability, flexibility, and environmental
                  sustainability."
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <a
                    href="/docs/Emerbrace_Documentation.pdf"
                    download="Emerbrace_Documentation.pdf"
                    className="flex items-center gap-2 rounded-lg border border-emerald-600/70 bg-emerald-950/60 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Engineering PDF</span>
                  </a>

                  <a
                    href="#hardware"
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-850 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Inspect PCB Stack Below</span>
                  </a>
                </div>
              </div>

              {/* 3D CAD Preview Card */}
              <div className="w-full lg:w-80 shrink-0">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-900/60 bg-navy-950 p-2 shadow-lg hover:border-emerald-400 transition-colors"
                  onClick={() => setGenericLightboxImage('/showcase/deck_slide_9.jpg')}
                >
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="3D CAD Render of Dual PCB Hardware"
                    className="w-full rounded-xl object-contain"
                  />
                  <div className="mt-2 text-center text-[10px] font-mono font-bold text-emerald-400">
                    3D PCB CAD Model (Top 43mm + Bottom 26mm)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL-PCB HARDWARE BREAKDOWN */}
      <section id="hardware" className="border-b border-slate-800/80 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              Mechanical &amp; Sensor Architecture
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              The Two-PCB Stacked System
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Separating high-noise cellular transmission from sensitive biometric skin-contact
              transducers ensures medical-grade accuracy in a compact watch footprint.
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {[
              { id: 'top', label: 'Top PCB (Processing & Cellular)', size: '43 × 43 mm' },
              { id: 'bottom', label: 'Bottom PCB (Skin Sensors)', size: '26 × 26 mm' },
              { id: 'enclosure', label: 'Enclosure & Materials', size: 'Eco-Silicone' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'top' | 'bottom' | 'enclosure')}
                className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-400 bg-emerald-950/80 text-white shadow-md'
                    : 'border-slate-800 bg-navy-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-[10px] font-mono font-normal opacity-80">{tab.size}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-navy-950 p-6 lg:p-7">
            {activeTab === 'top' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                    OUTER CONTROL &amp; TELEMETRY UNIT (43 × 43 MM)
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-white">Top PCB Processing Engine</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Houses the computational MCU and cellular antenna system. Positioned on the
                    outer face like a watch dial so RF signals radiate clearly without skin
                    attenuation.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong>Microcontroller:</strong> Arduino Nano (ATmega328P @ 16 MHz)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong>GSM Transceiver:</strong> SIM800A Quad-Band cellular module
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong>Satellite Positioning:</strong> u-blox Neo-6M GPS with ceramic patch
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        <strong>Tactile Trigger:</strong> Micro-push button for instant manual
                        distress
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-800 bg-navy-900 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="Top PCB Layout"
                    className="max-h-44 mx-auto object-contain cursor-pointer"
                    onClick={() => setGenericLightboxImage('/showcase/deck_slide_9.jpg')}
                  />
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Figure: 43×43mm processing &amp; cellular board
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bottom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    SKIN-CONTACT SENSING LAYER (26 × 26 MM)
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-white">Bottom PCB Biometric Array</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Engineered for continuous, reliable skin contact. Shielded against
                    electromagnetic GSM burst interference to preserve clean pulse oximetry and
                    temperature readings.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Pulse Oximeter:</strong> MAX30100 (Red &amp; IR PPG for SpO₂ &amp;
                        HR)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Clinical Thermometer:</strong> GY-906 / MLX90614 Contactless IR
                        sensor
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Inertial Motion:</strong> MPU6050 6-Axis accelerometer &amp;
                        gyroscope (fall detection)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Inter-PCB Bus:</strong> Shielded flex connector for power &amp; I²C
                        communications
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-800 bg-navy-900 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="Bottom PCB Layout"
                    className="max-h-44 mx-auto object-contain cursor-pointer"
                    onClick={() => setGenericLightboxImage('/showcase/deck_slide_9.jpg')}
                  />
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Figure: 26×26mm skin-contact sensor array
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enclosure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="rounded-full bg-teal-950 border border-teal-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-teal-300">
                    ERGONOMICS &amp; SUSTAINABLE DESIGN
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-white">
                    Wearable Enclosure &amp; Straps
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Designed to be worn continuously like a watch. Prioritizes patient comfort,
                    sweat breathability, and eco-friendly recycled polymers.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Wristband:</strong> Breathable woven fabric and hypoallergenic
                        medical silicone
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Casing:</strong> Impact-resistant enclosure molded from recycled
                        plastic
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Safety:</strong> Recessed manual SOS button prevents accidental
                        triggering
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-800 bg-navy-900 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_5.jpg"
                    alt="Materials & Components"
                    className="max-h-44 mx-auto object-contain cursor-pointer"
                    onClick={() => setGenericLightboxImage('/showcase/deck_slide_5.jpg')}
                  />
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    Figure: Wearable hardware components overview
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <footer className="border-t border-slate-800 bg-[#050810] px-4 py-10 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex justify-center mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-950/60 text-emerald-400 shadow-glow-emerald">
              <ShieldAlert className="w-5 h-5" />
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Experience the Emergency Command Center
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 max-w-xl mx-auto">
            Test the live telemetry map, inspect real-time Lead II ECG rhythm traces, simulate GSM
            SMS distress packets, and route ambulance units across Addis Ababa.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('DASHBOARD')}
              className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-glow-emerald hover:bg-emerald-500 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Launch Live Console</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('DASHBOARD');
                onStartTour();
              }}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/80 bg-navy-900 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-navy-850 transition-all"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Start Interactive Tour</span>
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Designed &amp; Developed by{' '}
              <strong className="text-slate-300">Emran Abduljelil Reshad</strong> · Addis Ababa,
              Ethiopia
            </div>
            <div>Winner of the National African Leadership Academy Pitching Competition</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
