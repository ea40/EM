import { useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { PageRoute } from '../types';
import {
  Activity,
  Ambulance,
  BarChart3,
  Cpu,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  LayoutDashboard,
  Radio,
  Settings,
  Users,
  X,
  Zap
} from 'lucide-react';

type SidebarProps = {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onClose?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  redAlertCount: number;
  totalPatientsCount: number;
  availableAmbulancesCount: number;
};

type NavItem = {
  route: PageRoute;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export function Sidebar({
  currentRoute,
  onNavigate,
  onClose,
  isCollapsed,
  setIsCollapsed,
  redAlertCount,
  totalPatientsCount,
  availableAmbulancesCount
}: SidebarProps) {
  const navSections: NavSection[] = [
    {
      id: 'operations',
      label: 'Live operations',
      items: [
        {
          route: 'DASHBOARD',
          label: 'Command center',
          icon: <LayoutDashboard className="w-5 h-5" />,
          badge:
            redAlertCount > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white animate-pulse">
                {redAlertCount}
              </span>
            ) : null
        },
        {
          route: 'PATIENTS',
          label: 'Patient registry',
          icon: <Users className="w-5 h-5" />,
          badge: (
            <span className="data-num rounded-full border border-slate-700 bg-navy-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
              {totalPatientsCount}
            </span>
          )
        }
      ]
    },
    {
      id: 'network',
      label: 'Field network',
      items: [
        {
          route: 'FLEET',
          label: 'Fleet & hospitals',
          icon: <Ambulance className="w-5 h-5" />,
          badge: (
            <span className="data-num rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              {availableAmbulancesCount}
            </span>
          )
        },
        {
          route: 'CAREGIVERS',
          label: 'Caregiver network',
          icon: <HeartHandshake className="w-5 h-5" />
        }
      ]
    },
    {
      id: 'device',
      label: 'Device & gateway',
      items: [
        {
          route: 'SIMULATOR',
          label: 'Hardware console',
          icon: <Zap className="w-5 h-5" />,
          badge: (
            <span className="rounded border border-amber-800 bg-amber-950 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400">
              SIM800
            </span>
          )
        },
        {
          route: 'HARDWARE',
          label: 'Diagnostics',
          icon: <Cpu className="w-5 h-5" />
        },
        {
          route: 'SETTINGS',
          label: 'Threshold rules',
          icon: <Settings className="w-5 h-5" />
        }
      ]
    },
    {
      id: 'insight',
      label: 'Insight',
      items: [
        {
          route: 'ANALYTICS',
          label: 'Triage intelligence',
          icon: <BarChart3 className="w-5 h-5" />
        }
      ]
    }
  ];

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('emer_sidebar_width');
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= 220 && val <= 460) return val;
      }
    } catch {
      // ignore
    }
    return 260;
  });

  const isDraggingSidebarRef = useRef(false);

  const handleSidebarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    isDraggingSidebarRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingSidebarRef.current) return;
      const newWidth = moveEvent.clientX;
      const clamped = Math.max(220, Math.min(newWidth, 460));
      setSidebarWidth(clamped);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      isDraggingSidebarRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        handle.releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setSidebarWidth(w => {
        try {
          localStorage.setItem('emer_sidebar_width', String(Math.round(w)));
        } catch {
          // ignore
        }
        return w;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <aside
      className={`relative z-40 flex h-screen flex-col justify-between border-r border-slate-800 bg-navy-950 shadow-elev-3 ${
        isCollapsed ? 'w-[4.75rem]' : ''
      }`}
      style={{ width: isCollapsed ? undefined : `${sidebarWidth}px` }}
    >
      {!isCollapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation sidebar"
          onPointerDown={handleSidebarPointerDown}
          onDoubleClick={() => {
            setSidebarWidth(260);
            try {
              localStorage.setItem('emer_sidebar_width', '260');
            } catch {
              // ignore
            }
          }}
          className="group absolute right-0 top-0 bottom-0 w-2.5 translate-x-1/2 cursor-col-resize flex items-center justify-center transition-colors hover:bg-cyan-500/20 active:bg-cyan-500/40 select-none z-50"
          title="Drag to resize sidebar · Double-click to reset"
        >
          <div className="h-10 w-1 rounded-full bg-slate-700/80 transition-colors group-hover:bg-cyan-400 group-active:bg-cyan-300" />
        </div>
      )}
      {/* Branding */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-700 ring-1 ring-rose-400/40 shadow-glow-red">
            <Activity className="w-5 h-5 text-white animate-pulse" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border border-navy-950 bg-rose-500" />
            </span>
          </span>

          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-white">
                EMER-BRACE<span className="font-black text-rose-500">™</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-400">
                Triage command
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(previous => !previous)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className="shrink-0 rounded-lg border border-slate-800 bg-navy-900 p-1.5 text-slate-400 transition-colors hover:bg-navy-800 hover:text-white"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide navigation sidebar"
              title="Hide sidebar"
              className="shrink-0 rounded-lg border border-slate-800 bg-navy-900 p-1.5 text-slate-400 transition-colors hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map(section => (
          <section key={section.id}>
            {!isCollapsed && (
              <h2 className="eyebrow mb-1.5 px-2.5">{section.label}</h2>
            )}

            <ul className="space-y-1">
              {section.items.map(item => {
                const isActive = currentRoute === item.route;

                return (
                  <li key={item.route}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.route)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={isCollapsed ? item.label : undefined}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-2.5 text-xs font-semibold transition-colors ${
                        isCollapsed ? 'justify-center' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-navy-800 text-white shadow-elev-1'
                          : 'text-slate-400 hover:bg-navy-900 hover:text-slate-100'
                      }`}
                    >
                      {/* Active rail — a shape cue, so selection does not rely on fill alone. */}
                      {isActive && (
                        <span
                          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-rose-500"
                          aria-hidden="true"
                        />
                      )}

                      <span
                        className={`flex items-center gap-3 ${
                          isActive
                            ? 'text-rose-400'
                            : 'text-slate-500 group-hover:text-cyan-400'
                        }`}
                      >
                        {item.icon}
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </span>

                      {!isCollapsed && item.badge}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      {/* Credit */}
      {!isCollapsed && (
        <div className="m-3 space-y-1 rounded-xl border border-slate-800/80 bg-navy-900/90 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Radio className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
            EMER-BRACE™ Telemetry
          </p>
          <p className="text-[11px] font-medium leading-tight text-slate-300">
            Designed by <strong className="text-white">Emran Abduljelil Reshad</strong>
          </p>
          <p className="border-t border-slate-800 pt-1 font-mono text-[10px] text-slate-500">
            Ethio-Telecom GSM SIM800 Gateway
          </p>
        </div>
      )}
    </aside>
  );
}
