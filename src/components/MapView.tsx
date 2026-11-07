import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import type { AmbulanceUnit, EmergencyAlert } from '../types';
import { ADDIS_HOSPITALS } from '../data/mockData';
import { Building2, Crosshair, MapPin, Navigation, ShieldAlert } from 'lucide-react';
import { escapeHtml } from '../utils/escapeHtml';
import { estimateNearestHospital, selectDispatchableAmbulances } from '../utils/dispatch';
import { triageStyle } from '../utils/triage';

type MapViewProps = {
  alerts: EmergencyAlert[];
  fleet: AmbulanceUnit[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
};

export function MapView({ alerts, fleet, selectedAlertId, onSelectAlert }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  /**
   * An empty alert list is a real state (all patients stable), not a reason to
   * reach for alerts[0] and render whichever patient happens to be first.
   */
  const selectedAlert = useMemo(
    () => alerts.find(alert => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId]
  );

  const route = useMemo(
    () => (selectedAlert ? estimateNearestHospital(selectedAlert.location, ADDIS_HOSPITALS) : null),
    [selectedAlert]
  );

  const selectedStyle = selectedAlert ? triageStyle(selectedAlert.code) : null;

  // --- Map lifecycle -------------------------------------------------------
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [9.03, 38.74],
      zoom: 13,
      zoomControl: false
    });

    // OpenStreetMap tiles (no API key) darkened by the `.map-tiles` CSS filter.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: 'map-tiles'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
      routePolylineRef.current = null;
    };
  }, []);

  // --- Markers + route -----------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // 1. Hospital nodes
    for (const hospital of ADDIS_HOSPITALS) {
      /*
       * Live count, not `hospital.availableAmbulances`. That seed value never
       * decrements on dispatch, so the popup kept advertising a vehicle that
       * was already en route while the hub card on the fleet page correctly
       * dropped to zero.
       */
      const readyUnits = selectDispatchableAmbulances(fleet, hospital.id).length;

      const hospitalIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border-2 border-cyan-400 text-cyan-300 shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
        `,
        className: 'custom-hospital-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Every interpolated value is escaped: Leaflet's bindPopup assigns this
      // string through innerHTML, which is an execution sink.
      L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
        .bindPopup(
          `
          <div class="p-2 font-sans text-xs">
            <div class="font-bold text-cyan-400">${escapeHtml(hospital.name)}</div>
            <p class="text-slate-300 mt-1">${escapeHtml(hospital.subCity)} &middot; ${escapeHtml(hospital.type)}</p>
            <div class="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center gap-3 text-[11px]">
              <span class="${readyUnits === 0 ? 'text-rose-400' : 'text-emerald-400'} font-semibold data-num">${readyUnits} ${readyUnits === 1 ? 'ambulance' : 'ambulances'} ready</span>
              <span class="text-slate-400 data-num">${escapeHtml(hospital.phone)}</span>
            </div>
          </div>
        `
        )
        .addTo(markersGroup);
    }

    // 2. Patient distress beacons
    for (const alert of alerts) {
      const style = triageStyle(alert.code);
      const isSelected = alert.id === selectedAlertId;
      const isCritical = alert.code === 'RED' || alert.code === 'AMBER';
      const shortId = alert.patientId.replace(/^EB-/, '');
      const avatarMarkup = `<span class="flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-xs text-slate-950 shadow-sm shrink-0" style="background-color:${style.hex}">${escapeHtml(shortId)}</span>`;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          ${
            isCritical
              ? `<div class="absolute w-12 h-12 rounded-full border-2 animate-ping opacity-75" style="border-color:${style.hex}99"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full text-slate-950 font-black shadow-xl ring-4 ring-slate-900 border-2 border-white transition-transform ${
            isSelected ? 'scale-125 outline outline-2 outline-offset-2' : 'hover:scale-110'
          }" style="background-color:${style.hex}${isSelected ? `;outline-color:${style.hex}` : ''}">
            <span class="text-[11px] font-mono tracking-tighter data-num">${escapeHtml(shortId)}</span>
          </div>
        </div>
      `;

      const patientIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-patient-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([alert.location.lat, alert.location.lng], { icon: patientIcon })
        .on('click', () => onSelectAlert(alert.id))
        .bindPopup(
          `
          <div class="p-2 font-sans text-xs">
            <div class="flex items-center gap-2">
              ${avatarMarkup}
              <div class="min-w-0">
                <div class="font-bold text-slate-100 truncate">${escapeHtml(alert.patientName)}</div>
                <div class="text-[10px] text-slate-400 font-mono data-num">${escapeHtml(alert.patientId)}</div>
              </div>
            </div>
            <div class="mt-1.5 text-[10px] font-semibold" style="color:${style.hex}">
              ${escapeHtml(style.label)} &middot; ${escapeHtml(alert.chronicCondition)}
            </div>
            <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono data-num">
              <span>HR <strong class="text-rose-400">${escapeHtml(alert.vitals.heartRate)}</strong></span>
              <span>SpO&#8322; <strong class="text-cyan-400">${escapeHtml(alert.vitals.spo2)}%</strong></span>
              <span>BAT <strong class="text-slate-300">${escapeHtml(alert.vitals.battery)}%</strong></span>
            </div>
          </div>
        `
        )
        .addTo(markersGroup);
    }

    // 3. Dispatch route to the receiving hospital
    if (selectedAlert && route) {
      routePolylineRef.current = L.polyline(
        [
          [selectedAlert.location.lat, selectedAlert.location.lng],
          [route.hospital.lat, route.hospital.lng]
        ],
        { color: '#EF4444', weight: 3, opacity: 0.85, dashArray: '8, 8' }
      ).addTo(map);

      map.panTo([selectedAlert.location.lat, selectedAlert.location.lng], {
        animate: true,
        duration: 0.8
      });
    }
  }, [alerts, fleet, selectedAlertId, selectedAlert, route, onSelectAlert]);

  const recenterMap = () => {
    if (mapInstanceRef.current && selectedAlert) {
      mapInstanceRef.current.setView([selectedAlert.location.lat, selectedAlert.location.lng], 14, {
        animate: true
      });
    }
  };

  const nearestHospitalName = route ? route.hospital.name.split('(')[0].trim() : null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-elev-3 bg-navy-950">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/*
        Leaflet renders a canvas of tiles with no text alternative. This mirrors
        the HUD below as live text so the selected patient's state is reachable
        by screen reader and by tests querying by role.
      */}
      <p className="sr-only" role="status" aria-live="polite">
        {selectedAlert
          ? `Selected patient ${selectedAlert.patientName}, ${selectedAlert.patientId}, triage ${triageStyle(selectedAlert.code).label}. ${
              route
                ? `Nearest hospital ${nearestHospitalName}, ${route.distanceKm.toFixed(1)} kilometres, approximately ${route.etaMinutes} minutes.`
                : 'No receiving hospital available.'
            }`
          : 'No active distress alerts on the map.'}
      </p>

      {/* Map chrome — header */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-2 panel px-2.5 py-1 shadow-elev-3">
        <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" aria-hidden="true" />
        <span className="font-bold text-[10px] text-slate-200 tracking-[0.12em] uppercase">
          Telemetry Map
        </span>
        <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-1.5 py-0.2 rounded-full">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
            aria-hidden="true"
          />
          LIVE
        </span>
      </div>

      {/* Map chrome — recenter */}
      <div className="absolute top-2 right-2 z-20">
        <button
          type="button"
          onClick={recenterMap}
          disabled={!selectedAlert}
          className="flex items-center gap-1.5 panel px-2.5 py-1 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Crosshair className="w-3 h-3 text-cyan-400" aria-hidden="true" />
          Recenter
        </button>
      </div>

      {/* Distress dispatch HUD */}
      {selectedAlert && selectedStyle && (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto z-20 sm:max-w-xs panel p-2.5 shadow-elev-3 space-y-1.5 animate-rise-in">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert
                className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0"
                aria-hidden="true"
              />
              <span className="font-bold text-[11px] text-slate-100 truncate">Dispatch HUD</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border"
                style={{
                  color: selectedStyle.hex,
                  borderColor: `${selectedStyle.hex}66`,
                  backgroundColor: `${selectedStyle.hex}1a`
                }}
              >
                {selectedStyle.label}
              </span>
              <span className="text-[9px] font-mono text-slate-400 data-num">
                {escapeHtml(selectedAlert.patientId)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="panel-inset p-1.5">
              <span className="eyebrow flex items-center gap-1 text-[9px]">
                <Building2 className="w-2.5 h-2.5 text-cyan-400" aria-hidden="true" />
                Receiving
              </span>
              <p className="font-bold text-slate-200 truncate text-[10px] mt-0.5">
                {nearestHospitalName ?? '—'}
              </p>
            </div>

            <div className="panel-inset p-1.5">
              <span className="eyebrow flex items-center gap-1 text-[9px]">
                <Navigation className="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
                Distance / ETA
              </span>
              <p className="font-bold text-emerald-400 text-[10px] mt-0.5 data-num">
                {route ? `${route.distanceKm.toFixed(1)} km · ${route.etaMinutes} min` : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 data-num">
            <span>
              {selectedAlert.location.lat.toFixed(4)}, {selectedAlert.location.lng.toFixed(4)}
            </span>
            <span className="text-slate-400">{selectedAlert.location.subCity}</span>
          </div>
        </div>
      )}
    </div>
  );
}
