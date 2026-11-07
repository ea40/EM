import { useMemo, useRef, useState, useEffect } from 'react';
import type { AmbulanceUnit, EmergencyAlert, Patient, ThresholdSettings } from '../types';
import { TriageQueue } from '../components/TriageQueue';
import { MapView } from '../components/MapView';
import { ECGVisualizer } from '../components/ECGVisualizer';
import { Activity, Ambulance } from 'lucide-react';

type DashboardPageProps = {
  alerts: EmergencyAlert[];
  patients: Patient[];
  fleet: AmbulanceUnit[];
  thresholds: ThresholdSettings;
  selectedAlertId: string | null;
  onSelectAlert: (id: string) => void;
  onDispatchClick: (alert: EmergencyAlert) => void;
  onContactClick: (alert: EmergencyAlert) => void;
  onResolveClick: (alert: EmergencyAlert) => void;
};

export function DashboardPage({
  alerts,
  patients,
  fleet,
  thresholds,
  selectedAlertId,
  onSelectAlert,
  onDispatchClick,
  onContactClick,
  onResolveClick
}: DashboardPageProps) {
  /*
   * No `|| alerts[0]` fallback. An empty result means nothing is selected, and
   * silently showing an unrelated patient's vitals under a "critical" banner is
   * worse than showing an empty monitor — this is a clinical console.
   */
  const selectedAlert = useMemo(
    () => alerts.find(alert => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId]
  );

  const selectedPatient = useMemo(
    () => (selectedAlert ? (patients.find(p => p.id === selectedAlert.patientId) ?? null) : null),
    [patients, selectedAlert]
  );

  const [isLgScreen, setIsLgScreen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [leftWidth, setLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('emer_triage_width');
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 260 && val <= 600) return val;
      }
    } catch {
      // ignore
    }
    return 360;
  });

  const [mapHeightPercent, setMapHeightPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('emer_map_height_pct');
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 25 && val <= 75) return val;
      }
    } catch {
      // ignore
    }
    return 50;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const isDraggingLeftRef = useRef(false);
  const isDraggingMapRef = useRef(false);

  const handleLeftPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingLeftRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = moveEvent.clientX - containerRect.left;
      const clamped = Math.max(260, Math.min(newWidth, Math.min(600, containerRect.width - 320)));
      setLeftWidth(clamped);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      isDraggingLeftRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        handle.releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setLeftWidth(w => {
        try {
          localStorage.setItem('emer_triage_width', String(Math.round(w)));
        } catch {
          // ignore
        }
        return w;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    isDraggingMapRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingMapRef.current || !rightColumnRef.current) return;
      const columnRect = rightColumnRef.current.getBoundingClientRect();
      const offsetY = moveEvent.clientY - columnRect.top;
      const pct = (offsetY / columnRect.height) * 100;
      const clamped = Math.max(25, Math.min(pct, 75));
      setMapHeightPercent(clamped);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      isDraggingMapRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        handle.releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setMapHeightPercent(pct => {
        try {
          localStorage.setItem('emer_map_height_pct', String(Math.round(pct)));
        } catch {
          // ignore
        }
        return pct;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleResetLeft = () => {
    setLeftWidth(360);
    try {
      localStorage.setItem('emer_triage_width', '360');
    } catch {
      // ignore
    }
  };

  const handleResetMap = () => {
    setMapHeightPercent(50);
    try {
      localStorage.setItem('emer_map_height_pct', '50');
    } catch {
      // ignore
    }
  };

  const handleLeftKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftWidth(w => Math.max(260, w - 20));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftWidth(w => Math.min(600, w + 20));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      handleResetLeft();
    }
  };

  const handleMapKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMapHeightPercent(p => Math.max(25, p - 5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMapHeightPercent(p => Math.min(75, p + 5));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      handleResetMap();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col lg:flex-row gap-0 overflow-hidden"
    >
      {/* Triage queue feed (Left column - resizable horizontally) */}
      <div
        className="min-h-0 overflow-hidden shrink-0"
        style={{
          width: isLgScreen ? `${leftWidth}px` : '100%',
          height: isLgScreen ? '100%' : 'auto'
        }}
      >
        <TriageQueue
          alerts={alerts}
          thresholds={thresholds}
          selectedAlertId={selectedAlertId}
          onSelectAlert={onSelectAlert}
          onDispatchClick={onDispatchClick}
          onContactClick={onContactClick}
          onResolveClick={onResolveClick}
        />
      </div>

      {/* Horizontal divider / splitter handle (Left vs Right) */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize distress queue panel"
        aria-valuenow={Math.round(leftWidth)}
        aria-valuemin={260}
        aria-valuemax={600}
        tabIndex={0}
        onKeyDown={handleLeftKeyDown}
        onPointerDown={handleLeftPointerDown}
        onDoubleClick={handleResetLeft}
        className="group relative hidden lg:flex w-2 shrink-0 cursor-col-resize items-center justify-center transition-colors hover:bg-cyan-500/20 active:bg-cyan-500/40 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none select-none z-10"
        title="Drag or use Left/Right arrow keys to resize panel · Double-click to reset"
      >
        <div className="h-8 w-1 rounded-full bg-slate-700/80 transition-colors group-hover:bg-cyan-400 group-active:bg-cyan-300" />
      </div>

      {/* Right column: Map (Top) and Live ECG Rhythm Trace (Bottom) */}
      <div
        ref={rightColumnRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden h-full gap-0"
      >
        {/* TOP: Geospatial dispatch map (resizable vertically) */}
        <div
          className="min-h-0 overflow-hidden rounded-xl"
          style={{ height: `${mapHeightPercent}%` }}
        >
          <MapView
            alerts={alerts}
            fleet={fleet}
            selectedAlertId={selectedAlertId}
            onSelectAlert={onSelectAlert}
          />
        </div>

        {/* Vertical divider / splitter handle (Map vs Live ECG) */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize Map and ECG panels"
          aria-valuenow={Math.round(mapHeightPercent)}
          aria-valuemin={25}
          aria-valuemax={75}
          tabIndex={0}
          onKeyDown={handleMapKeyDown}
          onPointerDown={handleMapPointerDown}
          onDoubleClick={handleResetMap}
          className="group relative flex h-2 shrink-0 cursor-row-resize items-center justify-center transition-colors hover:bg-cyan-500/20 active:bg-cyan-500/40 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none select-none z-10"
          title="Drag or use Up/Down arrow keys to resize Map vs ECG · Double-click to reset"
        >
          <div className="h-1 w-8 rounded-full bg-slate-700/80 transition-colors group-hover:bg-cyan-400 group-active:bg-cyan-300" />
        </div>

        {/* BOTTOM: Live ECG + telemetry (side-by-side monitor layout) */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
          {selectedAlert ? (
            <ECGVisualizer patient={selectedPatient} thresholds={thresholds} />
          ) : (
            <EmptyMonitor />
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown when nothing is selected — an explicit idle state, not a blank panel. */
function EmptyMonitor() {
  return (
    <div className="panel flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="rounded-2xl border border-slate-700 bg-navy-850 p-3 text-slate-500">
        <Activity className="w-6 h-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-bold text-slate-300">No patient selected</p>
        <p className="mt-1 max-w-[16rem] text-[11px] leading-relaxed text-slate-500">
          Choose an incident from the triage queue or a marker on the map to open the live ECG
          monitor.
        </p>
      </div>
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
        <Ambulance className="w-3.5 h-3.5" aria-hidden="true" />
        Telemetry engine ready
      </span>
    </div>
  );
}
