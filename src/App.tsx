import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AmbulanceUnit,
  EmergencyAlert,
  PageRoute,
  Patient,
  TerminalLog,
  ThresholdSettings
} from './types';
import { AMBULANCE_FLEET, INITIAL_ALERTS, INITIAL_PATIENTS } from './data/mockData';
import { DEFAULT_THRESHOLDS } from './config/thresholds';
import { decodeGSMSMS } from './utils/gsmDecoder';
import { dispatchableAmbulanceCount } from './utils/dispatch';
import { formatClockTime } from './utils/format';
import { audioSynth } from './utils/audioSynth';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HardwareDiagnosticsPage } from './pages/HardwareDiagnosticsPage';
import { FleetNetworkPage } from './pages/FleetNetworkPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CaregiverNetworkPage } from './pages/CaregiverNetworkPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardTutorial } from './components/DashboardTutorial';

import { DispatchModal } from './components/DispatchModal';
import { ContactModal } from './components/ContactModal';
import { ResolutionModal } from './components/ResolutionModal';
import { Analytics } from '@vercel/analytics/react';

const TELEMETRY_PULSE_MS = 4000;
const MAX_LOG_ENTRIES = 200;

const initialLogs = (): TerminalLog[] => [
  {
    id: 'LOG-001',
    timestamp: formatClockTime(),
    type: 'INFO',
    message: 'EMER-BRACE Telemetry & Triage Engine Online.'
  },
  {
    id: 'LOG-002',
    timestamp: formatClockTime(),
    type: 'INFO',
    message: `Ethio-Telecom GSM SIM800 Gateway Connected (Baud Rate ${DEFAULT_THRESHOLDS.gsmBaudRate}).`
  },
  {
    id: 'LOG-003',
    timestamp: formatClockTime(),
    type: 'DECODE',
    message: 'Active patients mapped to Addis Ababa emergency dispatch nodes.',
    rawPayload: 'EB-101#MANUAL_SOS#9.0024,38.7842#HR:88#SPO2:97#TMP:37.1#BAT:88%'
  }
];

export function App() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [fleet, setFleet] = useState<AmbulanceUnit[]>(AMBULANCE_FLEET);
  const [thresholds, setThresholds] = useState<ThresholdSettings>(DEFAULT_THRESHOLDS);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    INITIAL_ALERTS[0]?.id ?? null
  );

  const [currentRoute, setCurrentRoute] = useState<PageRoute>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('dashboard')) {
      return 'DASHBOARD';
    }
    return 'LANDING';
  });
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Action modals
  const [dispatchAlert, setDispatchAlert] = useState<EmergencyAlert | null>(null);
  const [contactAlert, setContactAlert] = useState<EmergencyAlert | null>(null);
  const [resolveAlert, setResolveAlert] = useState<EmergencyAlert | null>(null);

  const [logs, setLogs] = useState<TerminalLog[]>(initialLogs);

  /**
   * Mirrors of the two collections that event handlers need to read.
   *
   * A handler defined during render captures the state of that render; a
   * simulated SMS arriving between renders would otherwise look up a patient
   * list that no longer exists. Reading the ref gets the current value without
   * making the handler a dependency of anything.
   */
  const patientsRef = useRef(patients);
  const alertsRef = useRef(alerts);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  const appendLog = (entry: Omit<TerminalLog, 'id' | 'timestamp'>) => {
    setLogs(prev => {
      const next = [
        ...prev,
        { ...entry, id: `LOG-${Date.now()}-${prev.length}`, timestamp: formatClockTime() }
      ];
      // The console can run for a full shift; unbounded growth is a leak.
      return next.length > MAX_LOG_ENTRIES ? next.slice(next.length - MAX_LOG_ENTRIES) : next;
    });
  };

  const navigateTo = (route: PageRoute) => {
    setCurrentRoute(route);
    setIsSidebarOpen(false);
    if (route === 'DASHBOARD') {
      try {
        if (!localStorage.getItem('emer_tutorial_seen')) {
          setIsTourOpen(true);
        }
      } catch {
        // ignore
      }
    }
  };

  // Sidebar drawer: Escape or Alt+M toggles it.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      if (event.altKey && (event.key === 'm' || event.key === 'M')) {
        event.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Telemetry pulse — keeps the console visibly live between real payloads.
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev =>
        prev.map(p => {
          const hrDelta = (Math.random() - 0.5) * 2;
          const nextHeartRate = Math.max(
            50,
            Math.min(180, Math.round(p.currentVitals.heartRate + hrDelta))
          );
          return {
            ...p,
            currentVitals: {
              ...p.currentVitals,
              heartRate: nextHeartRate,
              lastUpdated: formatClockTime()
            }
          };
        })
      );
    }, TELEMETRY_PULSE_MS);

    return () => clearInterval(interval);
  }, []);

  /** GSM telemetry inbound: decode, classify, upsert patient, raise alert. */
  const handleSimulateAlert = (rawPayload: string, deviceLabel?: string) => {
    const decoded = decodeGSMSMS(rawPayload, thresholds);

    appendLog({
      type: 'SMS_INCOMING',
      message: `SMS received on SIM800 gateway${deviceLabel ? ` (${deviceLabel})` : ''} → device ${decoded.deviceSerial} | ${decoded.eventType} | triage ${decoded.triageCode}`,
      rawPayload
    });

    for (const warning of decoded.warnings) {
      appendLog({ type: 'DECODE', message: `Payload warning: ${warning}`, rawPayload });
    }

    if (decoded.triageCode === 'RED') {
      audioSynth.playRedAlert();
    } else if (decoded.triageCode === 'AMBER') {
      audioSynth.playAmberAlert();
    }

    // Resolve the patient against the *current* list, not the render's snapshot.
    const currentPatients = patientsRef.current;
    const matched =
      currentPatients.find(p => p.wearableSerial.includes(decoded.deviceSerial)) ??
      currentPatients.find(p => p.id === decoded.deviceSerial) ??
      null;

    const patient: Patient = matched
      ? {
          ...matched,
          currentVitals: decoded.vitals,
          triageStatus: decoded.triageCode,
          distressReason: decoded.distressSummary
        }
      : {
          id: decoded.deviceSerial,
          name: `Wearable User (${decoded.deviceSerial})`,
          age: 35,
          gender: 'Other',
          bloodType: 'O+',
          photoUrl: '',
          chronicCondition: 'High-Risk Maternal Telemetry',
          wearableSerial: `${decoded.deviceSerial}-ET`,
          contact: {
            primaryName: 'Emergency Caregiver',
            primaryPhone: '+251 91 100 2233',
            relation: 'Family'
          },
          location: {
            lat: decoded.lat,
            lng: decoded.lng,
            subCity: 'Bole Sub-City',
            address: 'Cell Tower Sector 4'
          },
          currentVitals: decoded.vitals,
          triageStatus: decoded.triageCode,
          distressReason: decoded.distressSummary,
          createdAt: new Date().toISOString()
        };

    setPatients(prev =>
      prev.some(p => p.id === patient.id)
        ? prev.map(p => (p.id === patient.id ? patient : p))
        : [patient, ...prev]
    );

    const alertId = `ALT-${patient.id}`;
    const alert: EmergencyAlert = {
      id: alertId,
      patientId: patient.id,
      patientName: patient.name,
      patientPhoto: patient.photoUrl,
      patientAge: patient.age,
      chronicCondition: patient.chronicCondition,
      contact: patient.contact,
      code: decoded.triageCode,
      eventType: decoded.eventType,
      title: decoded.distressSummary,
      description: `Decoded GSM payload from ${decoded.deviceSerial} at ${patient.location.subCity}.`,
      location: { ...patient.location, lat: decoded.lat, lng: decoded.lng },
      vitals: decoded.vitals,
      timestamp: new Date().toISOString(),
      rawSmsPayload: rawPayload,
      dispatchStatus: 'UNASSIGNED'
    };

    setAlerts(prev => [alert, ...prev.filter(a => a.id !== alertId)]);
    setSelectedAlertId(alertId);
  };

  const handleConfirmDispatch = (
    alertId: string,
    hospitalName: string,
    ambulanceId: string,
    etaMinutes: number
  ) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              dispatchStatus: 'DISPATCHED',
              dispatchedHospital: hospitalName,
              assignedAmbulanceId: ambulanceId,
              etaMinutes
            }
          : a
      )
    );

    // The fleet is real state, not decoration: the assigned unit must leave the
    // available pool or the next dispatch will offer a vehicle already en route.
    setFleet(prev =>
      prev.map(unit =>
        unit.id === ambulanceId ? { ...unit, status: 'EN_ROUTE', assignedAlertId: alertId } : unit
      )
    );

    appendLog({
      type: 'DISPATCH',
      message: `Ambulance ${ambulanceId} dispatched from ${hospitalName} to alert ${alertId}. ETA ${etaMinutes} min.`
    });
  };

  const handleConfirmResolve = (alertId: string, notes: string) => {
    const patientId = alertsRef.current.find(a => a.id === alertId)?.patientId ?? null;

    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, code: 'RESOLVED', dispatchStatus: 'RESOLVED', resolutionNotes: notes }
          : a
      )
    );

    if (patientId) {
      setPatients(prev =>
        prev.map(p =>
          p.id === patientId ? { ...p, triageStatus: 'GREEN', distressReason: undefined } : p
        )
      );
    }

    appendLog({
      type: 'TRIAGE',
      message: `Alert ${alertId} resolved by clinical operator. Notes: "${notes}"`
    });
  };

  const handleSaveThresholds = (next: ThresholdSettings) => {
    setThresholds(next);
    appendLog({
      type: 'INFO',
      message: `Triage thresholds updated — SpO₂ critical <${next.spo2Critical}%, HR critical >${next.hrCriticalHigh}, fall >${next.fallAccelG}g.`
    });
  };

  const redCount = useMemo(() => alerts.filter(a => a.code === 'RED').length, [alerts]);
  const amberCount = useMemo(() => alerts.filter(a => a.code === 'AMBER').length, [alerts]);
  const availableAmbulances = useMemo(() => dispatchableAmbulanceCount(fleet), [fleet]);

  const activeAlert = dispatchAlert ?? contactAlert ?? resolveAlert;

  return (
    <div className="flex h-full w-full bg-navy-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar drawer backdrop */}
      {isSidebarOpen && (
        <div
          className="mobile-nav-overlay z-40"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out-expo ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          redAlertCount={redCount}
          totalPatientsCount={patients.length}
          availableAmbulancesCount={availableAmbulances}
        />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          redCount={redCount}
          amberCount={amberCount}
          totalWearables={patients.length}
          activeDispatches={alerts.filter(a => a.dispatchStatus === 'DISPATCHED').length}
          onMenuToggle={() => setIsSidebarOpen(prev => !prev)}
          isSidebarOpen={isSidebarOpen}
          onStartTour={() => {
            if (currentRoute !== 'DASHBOARD') setCurrentRoute('DASHBOARD');
            setIsTourOpen(true);
          }}
        />

        <main
          className={`flex-1 overflow-hidden min-h-0 ${currentRoute === 'LANDING' ? 'p-0' : 'p-2'}`}
        >
          {currentRoute === 'LANDING' && (
            <LandingPage
              onNavigate={navigateTo}
              onStartTour={() => {
                navigateTo('DASHBOARD');
                setIsTourOpen(true);
              }}
            />
          )}

          {currentRoute === 'DASHBOARD' && (
            <DashboardPage
              alerts={alerts}
              patients={patients}
              fleet={fleet}
              thresholds={thresholds}
              selectedAlertId={selectedAlertId}
              onSelectAlert={setSelectedAlertId}
              onDispatchClick={setDispatchAlert}
              onContactClick={setContactAlert}
              onResolveClick={setResolveAlert}
            />
          )}

          {currentRoute === 'PATIENTS' && (
            <PatientsPage
              patients={patients}
              onAddPatient={newPatient => setPatients(prev => [newPatient, ...prev])}
              onSelectPatient={patientId => {
                const alert = alertsRef.current.find(a => a.patientId === patientId);
                if (alert) setSelectedAlertId(alert.id);
                setCurrentRoute('DASHBOARD');
              }}
            />
          )}

          {currentRoute === 'SIMULATOR' && (
            <SimulatorPage
              onSimulateAlert={handleSimulateAlert}
              logs={logs}
              thresholds={thresholds}
            />
          )}

          {currentRoute === 'HARDWARE' && (
            <HardwareDiagnosticsPage
              logs={logs}
              thresholds={thresholds}
              onSimulateAlert={handleSimulateAlert}
            />
          )}

          {currentRoute === 'FLEET' && <FleetNetworkPage fleet={fleet} alerts={alerts} />}

          {currentRoute === 'ANALYTICS' && <AnalyticsPage alerts={alerts} patients={patients} />}

          {currentRoute === 'CAREGIVERS' && (
            <CaregiverNetworkPage
              patients={patients}
              alerts={alerts}
              onContactClick={setContactAlert}
            />
          )}

          {currentRoute === 'SETTINGS' && (
            <SettingsPage thresholds={thresholds} onSaveThresholds={handleSaveThresholds} />
          )}
        </main>
      </div>

      {/*
        Modals are keyed by alert id. Without the key React reuses the previous
        alert's component instance, so ResolutionModal's note text and
        DispatchModal's hospital pick survive into the next alert.
      */}
      <DispatchModal
        key={`dispatch-${dispatchAlert?.id ?? 'none'}`}
        alert={dispatchAlert}
        fleet={fleet}
        onClose={() => setDispatchAlert(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <ContactModal
        key={`contact-${contactAlert?.id ?? 'none'}`}
        alert={contactAlert}
        onClose={() => setContactAlert(null)}
      />

      <ResolutionModal
        key={`resolve-${resolveAlert?.id ?? 'none'}`}
        alert={resolveAlert}
        onClose={() => setResolveAlert(null)}
        onConfirmResolve={handleConfirmResolve}
      />

      {/* Only one action modal is meaningful at a time. */}
      <span className="sr-only" aria-live="polite">
        {activeAlert ? `${activeAlert.patientName} action dialog open.` : ''}
      </span>

      {/* Guided Walkthrough Tutorial */}
      <DashboardTutorial
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
