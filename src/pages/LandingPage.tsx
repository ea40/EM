import { useState } from 'react';
import type { PageRoute } from '../types';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  Eye,
  FileText,
  Heart,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Maximize2,
  Radio,
  ShieldAlert,
  X,
  Zap
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

export function LandingPage({ onNavigate, onStartTour }: LandingPageProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top' | 'bottom' | 'enclosure'>('top');

  const activeSlide = DECK_SLIDES[currentSlideIndex];

  return (
    <div className="h-full overflow-y-auto bg-navy-900 text-slate-100 select-text">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="High resolution document preview"
              className="max-h-[85vh] w-auto rounded-lg border border-slate-700 object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 px-4 py-12 sm:px-6 lg:px-8">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl text-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/80 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-semibold text-cyan-300 shadow-sm backdrop-blur">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>EMER-BRACE Telemetry Network · Addis Ababa Command Hub</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-emerald-400 font-bold">SIM800 GSM Active</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Instant Emergency Alerts for{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              High-Risk Lives
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base sm:text-lg text-slate-300 leading-relaxed">
            A low-cost, portable dual-PCB smart emergency bracelet designed for low-resource
            settings. Autonomous vital signs tracking, preeclampsia detection, and instant GSM SMS +
            GPS hospital dispatch without smartphones or internet connection.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('DASHBOARD')}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/80 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.02]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Launch Command Console</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('DASHBOARD');
                onStartTour();
              }}
              className="flex items-center gap-2 rounded-xl border border-cyan-700/80 bg-navy-850 px-5 py-3 text-sm font-bold text-cyan-300 hover:border-cyan-400 hover:bg-navy-800 transition-all"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Take Guided Tour</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('SIMULATOR')}
              className="flex items-center gap-2 rounded-xl border border-amber-600/60 bg-amber-950/40 px-5 py-3 text-sm font-bold text-amber-300 hover:border-amber-400 hover:bg-amber-950/60 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Test SMS Simulator</span>
            </button>

            <a
              href="#documents"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-navy-950 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>View 3 Research Documents</span>
            </a>
          </div>

          {/* Core Telemetry Stats Grid */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4 text-center">
              <div className="text-3xl font-black text-emerald-400 font-mono led-glow-emerald">
                80%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Mortality Reduction in Chronic & Maternal Emergencies
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4 text-center">
              <div className="text-3xl font-black text-cyan-400 font-mono led-glow-cyan">60%</div>
              <div className="mt-1 text-xs text-slate-400">
                Faster Ambulance Dispatch via Direct GPS Packets
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4 text-center">
              <div className="text-3xl font-black text-amber-400 font-mono led-glow-amber">
                &lt; 1 HR
              </div>
              <div className="mt-1 text-xs text-slate-400">
                "Golden Hour" Protected for Stroke & Infarction
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4 text-center">
              <div className="text-3xl font-black text-rose-400 font-mono led-glow-red">0</div>
              <div className="mt-1 text-xs text-slate-400">
                Smartphone or WiFi Required (100% Autonomous 2G)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AWARDS & INSTITUTIONAL RECOGNITION */}
      <section className="border-b border-slate-800 bg-navy-950/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-navy-900 to-navy-900 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/10 text-amber-400">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="rounded-full bg-amber-950 border border-amber-700/80 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider text-amber-300">
                  NATIONAL COMPETITION WINNER
                </span>
                <h3 className="mt-1 text-base sm:text-lg font-bold text-white">
                  African Leadership Academy "Build-in-a-Box" Idea Pitching Competition
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  South Africa · Developed at{' '}
                  <strong className="text-amber-300">KUE Minilik I Science Shared Campus</strong> by{' '}
                  <strong className="text-slate-100">Emran Abduljelil Reshad</strong> &amp;{' '}
                  <strong className="text-slate-100">Aishah Abas</strong>.
                </p>
              </div>
            </div>

            {/* UN SDGs */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/60 p-2 text-center min-w-[100px]">
                <div className="text-[10px] font-bold text-emerald-300 uppercase">UN SDG 3</div>
                <div className="text-xs font-black text-white">Good Health</div>
              </div>
              <div className="rounded-xl border border-blue-700/60 bg-blue-950/60 p-2 text-center min-w-[100px]">
                <div className="text-[10px] font-bold text-blue-300 uppercase">UN SDG 9</div>
                <div className="text-xs font-black text-white">Innovation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE CLINICAL PROBLEM */}
      <section className="border-b border-slate-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
              The Healthcare Crisis in Developing Nations
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              Why Traditional Smartwatches Fail Where Help Is Needed Most
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-rose-900/60 bg-navy-950/70 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-800 bg-rose-950/50 text-rose-400 mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Maternal Mortality Crisis</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                70% of maternal deaths occur due to delayed medical help during acute preeclampsia
                and postpartum hemorrhage. Over 94% of these tragedies happen in low-resource
                settings like rural and peri-urban Ethiopia.
              </p>
            </div>

            <div className="rounded-xl border border-amber-900/60 bg-navy-950/70 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-800 bg-amber-950/50 text-amber-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">The Stroke Golden Hour</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                5 million stroke patients die each year because medical help is delayed beyond the
                first critical "golden hour". 33% die, while another 33% suffer permanent disability
                without rapid thrombolysis or ICU access.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 text-cyan-400 mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Smartphone & Internet Dependency</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Commercial smartwatches cost $200–$500+ and require high-end smartphones, Bluetooth
                pairing, and stable broadband. EMER-BRACE uses standalone low-bandwidth 2G GSM SMS
                to reach hospitals directly for under the cost of a basic watch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 SHOWCASE DOCUMENTS SECTION (REQUESTED BY USER) */}
      <section
        id="documents"
        className="border-b border-slate-800 bg-navy-950/70 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-cyan-950 border border-cyan-800 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
              OFFICIAL PROJECT PUBLICATIONS
            </span>
            <h2 className="mt-3 text-3xl font-black text-white">
              The 3 EMER-BRACE Project Documents
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Explore the scientific research abstract, the official pitch presentation deck, and
              the two-PCB engineering documentation added to our project.
            </p>
          </div>

          {/* DOCUMENT 1: RESEARCH ABSTRACT & PAPER */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-navy-900 p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-800 bg-cyan-950 text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    DOCUMENT 1 · SCIENTIFIC RESEARCH ABSTRACT
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-black text-white">
                  EMER-BRACE: A Smart Emergency Bracelet For Instant Emergency Alerts
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Published by{' '}
                  <strong className="text-slate-200">KUE Minilik I Science Shared Campus</strong> ·
                  Authors: Emran Abduljelil Reshad &amp; Aishah Abas
                </p>

                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  "Unlike traditional alert systems that only notify nearby contacts or require
                  smartphone connectivity, EMER-BRACE directly links patients to hospitals ensuring
                  faster and more reliable medical response. Features include registered patient
                  profiles, automated SMS + GPS coordinates sent to hospital trauma wards and
                  caregivers, continuous photoplethysmography (SpO₂ &amp; pulse) and contactless
                  infrared thermometry, and a tactile manual SOS button."
                </p>

                {/* Peer-reviewed sources referenced */}
                <div className="mt-4 rounded-xl border border-slate-800/80 bg-navy-950/60 p-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Cited Peer-Reviewed Research Sources:
                  </span>
                  <ul className="mt-1 space-y-1 text-xs text-slate-300">
                    <li>• NIH PubMed Central PMC11786524: Golden Hour Stroke Interventions</li>
                    <li>
                      • MDPI Journal 2077-0383/13/16/4780: Cellular Telemetry in Critical Care
                    </li>
                    <li>
                      • BMC Public Health s12889-021-12169-7: Maternal Mortality in Low-Resource
                      Health Systems
                    </li>
                  </ul>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href="/docs/Emerbrace Abstract.pdf"
                    download="Emerbrace Abstract.pdf"
                    className="flex items-center gap-2 rounded-lg border border-cyan-500/70 bg-cyan-950/60 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Abstract PDF</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setLightboxImage('/showcase/abstract_p1_2.png')}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-850 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View High-Res Poster</span>
                  </button>
                </div>
              </div>

              {/* Poster image thumbnail preview */}
              <div className="w-full lg:w-72 shrink-0 space-y-2">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-white shadow-md hover:border-cyan-400 transition-colors"
                  onClick={() => setLightboxImage('/showcase/abstract_p1_2.png')}
                >
                  <img
                    src="/showcase/abstract_p1_2.png"
                    alt="Scientific Abstract Poster Top Section"
                    className="w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white shadow">
                      <Maximize2 className="w-3 h-3" /> Zoom
                    </span>
                  </div>
                </div>

                <div
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-white shadow-md hover:border-cyan-400 transition-colors"
                  onClick={() => setLightboxImage('/showcase/abstract_p1_1.png')}
                >
                  <img
                    src="/showcase/abstract_p1_1.png"
                    alt="Scientific Abstract Poster Bottom Section"
                    className="w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white shadow">
                      <Maximize2 className="w-3 h-3" /> Zoom
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT 2: OFFICIAL PITCH DECK & PRESENTATION (9 SLIDES) */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-navy-900 p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-800 bg-amber-950 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    DOCUMENT 2 · OFFICIAL PITCH DECK
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-black text-white">
                  EMER-BRACE Pitch Deck &amp; Solution Presentation (9 Slides)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/docs/Emerbrace.pdf"
                  download="Emerbrace.pdf"
                  className="flex items-center gap-1.5 rounded-lg border border-amber-600/70 bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Pitch Deck</span>
                </a>
              </div>
            </div>

            {/* Interactive Slide Viewer */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Slide Display */}
              <div className="lg:col-span-8">
                <div className="relative group overflow-hidden rounded-2xl border border-slate-700 bg-black/80 aspect-[16/10] flex items-center justify-center shadow-2xl">
                  <img
                    src={activeSlide.image}
                    alt={`Slide ${activeSlide.num}: ${activeSlide.title}`}
                    className="max-h-full max-w-full object-contain cursor-pointer"
                    onClick={() => setLightboxImage(activeSlide.image)}
                  />

                  {/* Previous / Next buttons */}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex(i => (i > 0 ? i - 1 : DECK_SLIDES.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-navy-950/80 p-2 text-white hover:bg-cyan-600 transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex(i => (i < DECK_SLIDES.length - 1 ? i + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-navy-950/80 p-2 text-white hover:bg-cyan-600 transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Zoom indicator */}
                  <button
                    type="button"
                    onClick={() => setLightboxImage(activeSlide.image)}
                    className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-navy-950/90 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                  >
                    <Maximize2 className="w-3 h-3" /> Fullscreen
                  </button>
                </div>
              </div>

              {/* Slide Summary & Selector Column */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-navy-950/80 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      SLIDE {activeSlide.num} OF {DECK_SLIDES.length}
                    </span>
                    <span className="font-bold text-amber-400">{activeSlide.subtitle}</span>
                  </div>
                  <h4 className="mt-2 text-lg font-bold text-white">{activeSlide.title}</h4>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {activeSlide.description}
                  </p>
                </div>

                {/* Thumbnails strip */}
                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Quick Slide Jump:
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
          <div className="mt-8 rounded-2xl border border-slate-800 bg-navy-900 p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-800 bg-emerald-950 text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    DOCUMENT 3 · HARDWARE ENGINEERING MANUAL
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-black text-white">
                  Wearable PCB System Documentation &amp; Architecture
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Full Technical Specification: Dual-layer circuit topology, sensor interfaces, and
                  power routing
                </p>

                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  "The system is divided into two printed circuit boards (PCBs). The top PCB (43 ×
                  43 mm) contains the processing and cellular communication components, while the
                  bottom PCB (26 × 26 mm) contains sensors that directly interact with the user's
                  skin. The enclosure and straps are engineered from medical silicone, fabric, and
                  recycled plastic to ensure durability, flexibility, and environmental
                  sustainability."
                </p>

                {/* 5-Step System Flow */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[
                    { s: '1', title: 'Sensors Collect', desc: 'Skin PPG, IR temp, MPU6050' },
                    { s: '2', title: 'Data Sent', desc: 'Internal flex connector' },
                    { s: '3', title: 'MCU Processes', desc: 'Arduino evaluates thresholds' },
                    { s: '4', title: 'Anomaly Trigger', desc: 'Auto-fall, hypoxia, or SOS' },
                    { s: '5', title: 'SIM & GPS Alert', desc: 'Direct hospital SMS link' }
                  ].map(step => (
                    <div
                      key={step.s}
                      className="rounded-xl border border-slate-800 bg-navy-950/70 p-2.5 text-center"
                    >
                      <span className="inline-block h-5 w-5 rounded-full bg-emerald-950 border border-emerald-700 text-[10px] font-mono font-bold text-emerald-400">
                        {step.s}
                      </span>
                      <div className="mt-1 text-[11px] font-bold text-white">{step.title}</div>
                      <div className="text-[10px] text-slate-400">{step.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <a
                    href="/docs/Emerbrace_Documentation.pdf"
                    download="Emerbrace_Documentation.pdf"
                    className="flex items-center gap-2 rounded-lg border border-emerald-600/70 bg-emerald-950/60 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Engineering PDF</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bottom')}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-850 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Inspect PCB Stack Below</span>
                  </button>
                </div>
              </div>

              {/* 3D CAD Preview Card */}
              <div className="w-full lg:w-80 shrink-0">
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-900/60 bg-navy-950 p-2 shadow-xl hover:border-emerald-400 transition-colors"
                  onClick={() => setLightboxImage('/showcase/deck_slide_9.jpg')}
                >
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="3D CAD Render of Dual PCB Hardware"
                    className="w-full rounded-xl object-contain"
                  />
                  <div className="mt-2 px-2 pb-1 text-center">
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      3D PCB CAD Model (Top 43mm + Bottom 26mm)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL-PCB INTERACTIVE HARDWARE BREAKDOWN */}
      <section className="border-b border-slate-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              Physical Hardware Engineering
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              The Two-PCB Stacked Architecture
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Separating high-noise cellular transmission from sensitive biometric skin-contact
              transducers ensures medical-grade accuracy in a compact watch footprint.
            </p>
          </div>

          {/* Interactive Layer Tabs */}
          <div className="mt-8 flex justify-center gap-2">
            {[
              { id: 'top', label: 'Top PCB (Processing & Cellular)', size: '43 × 43 mm' },
              { id: 'bottom', label: 'Bottom PCB (Skin-Contact Sensors)', size: '26 × 26 mm' },
              { id: 'enclosure', label: 'Enclosure & Materials', size: 'Eco-Silicone' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'top' | 'bottom' | 'enclosure')}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
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

          {/* Tab Content Display */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-navy-950/70 p-6 lg:p-8">
            {activeTab === 'top' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                    OUTER CONTROL &amp; TELEMETRY UNIT (43 × 43 MM)
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-white">Top PCB Processing Engine</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Houses the core computational brain and cellular antenna system. Positioned on
                    the outer face like a wristwatch dial so radio transmissions have optimal line
                    of sight to cellular towers.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-200">
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
                <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="Top PCB Layout"
                    className="max-h-48 mx-auto object-contain cursor-pointer"
                    onClick={() => setLightboxImage('/showcase/deck_slide_9.jpg')}
                  />
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
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
                  <h3 className="mt-3 text-xl font-bold text-white">Bottom PCB Biometric Array</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Designed for direct, stable contact with the patient's wrist skin. Isolated from
                    the high-frequency RF noise of the GSM antenna to preserve clinical pulse
                    oximetry and body temperature accuracy.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-200">
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
                        <strong>Inter-PCB Bus:</strong> Shielded flex header for power &amp; I²C
                        communications
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_9.jpg"
                    alt="Bottom PCB Layout"
                    className="max-h-48 mx-auto object-contain cursor-pointer"
                    onClick={() => setLightboxImage('/showcase/deck_slide_9.jpg')}
                  />
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
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
                  <h3 className="mt-3 text-xl font-bold text-white">
                    Wearable Enclosure &amp; Straps
                  </h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Built to be worn 24/7 like a watch by pregnant mothers and elderly patients.
                    Enclosure materials prioritize skin comfort, breathability, and ecological
                    sustainability.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-200">
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
                <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-4 text-center">
                  <img
                    src="/showcase/deck_slide_5.jpg"
                    alt="Materials & Components"
                    className="max-h-48 mx-auto object-contain cursor-pointer"
                    onClick={() => setLightboxImage('/showcase/deck_slide_5.jpg')}
                  />
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    Figure: Wearable hardware components overview
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <footer className="border-t border-slate-800 bg-navy-950 px-4 py-12 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-center mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/50 bg-emerald-950/60 text-emerald-400 shadow-glow-emerald">
              <ShieldAlert className="w-6 h-6" />
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Experience the Emergency Command Center
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            Test the live telemetry map, explore the real-time Lead II ECG waveform, simulate
            incoming GSM SMS distress packets, and coordinate emergency dispatch.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('DASHBOARD')}
              className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/70 hover:bg-emerald-500 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Command Console</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('DASHBOARD');
                onStartTour();
              }}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/80 bg-navy-850 px-5 py-3 text-sm font-bold text-cyan-300 hover:bg-navy-800 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Start Interactive Tour</span>
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
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
