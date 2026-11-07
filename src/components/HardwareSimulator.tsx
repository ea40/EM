import React, { useState } from 'react';
import { EventType, TerminalLog } from '../types';
import { decodeGSMSMS } from '../utils/gsmDecoder';
import { Terminal, Send, Cpu, AlertTriangle, Activity, X, Zap, Code } from 'lucide-react';

interface HardwareSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateAlert: (rawPayload: string) => void;
  logs: TerminalLog[];
}

export const HardwareSimulator: React.FC<HardwareSimulatorProps> = ({
  isOpen,
  onClose,
  onSimulateAlert,
  logs
}) => {
  const [deviceSerial, setDeviceSerial] = useState<string>('EB-104');
  const [eventType, setEventType] = useState<EventType>('FALL_DETECTED');
  const [lat, setLat] = useState<string>('9.0124');
  const [lng, setLng] = useState<string>('38.7612');
  const [hr, setHr] = useState<number>(138);
  const [spo2, setSpo2] = useState<number>(91);
  const [temp, setTemp] = useState<number>(37.4);
  const [battery, setBattery] = useState<number>(89);
  const [accelX] = useState<number>(3.2);
  const [accelY] = useState<number>(1.8);

  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM' | 'TERMINAL'>('PRESETS');

  if (!isOpen) return null;

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = `${deviceSerial}#${eventType}#${lat},${lng}#HR:${hr}#SPO2:${spo2}#TMP:${temp}#BAT:${battery}%#ACC:${accelX},${accelY},0.15`;
    onSimulateAlert(payload);
  };

  const runPreset = (presetType: string) => {
    let payload = '';
    switch (presetType) {
      case 'SOS':
        payload = `EB-101#MANUAL_SOS#9.0024,38.7842#HR:88#SPO2:97#TMP:37.1#BAT:88%#ACC:0.1,0.0,0.98`;
        break;
      case 'FALL':
        payload = `EB-103#FALL_DETECTED#9.0355,38.7690#HR:82#SPO2:95#TMP:36.9#BAT:89%#ACC:3.2,1.8,0.15`;
        break;
      case 'SPO2':
        payload = `EB-102#CRITICAL_HYPOXIA#9.0188,38.7431#HR:78#SPO2:76#TMP:36.6#BAT:91%#ACC:0.0,-0.1,0.99`;
        break;
      case 'TACHY':
        payload = `EB-101#TACHYCARDIAC_SPIKE#9.0024,38.7842#HR:158#SPO2:92#TMP:37.2#BAT:85%#ACC:0.2,0.1,0.97`;
        break;
    }
    if (payload) {
      onSimulateAlert(payload);
    }
  };

  const latestRaw =
    logs.length > 0
      ? logs[logs.length - 1].rawPayload
      : `EB-101#MANUAL_SOS#9.0024,38.7842#HR:88#SPO2:97#TMP:37.1#BAT:88%`;
  const decodedObj = latestRaw ? decodeGSMSMS(latestRaw) : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t-2 border-amber-500/80 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Drawer Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-xs text-amber-400 tracking-wider uppercase font-mono">
              ⚡ EMER-BRACE Hardware Testing Console (SIM800 Gateway Simulator)
            </span>
          </div>

          {/* Console Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('PRESETS')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'PRESETS'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1-Click Triggers
            </button>
            <button
              onClick={() => setActiveTab('CUSTOM')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'CUSTOM'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom SMS Payload Injector
            </button>
            <button
              onClick={() => setActiveTab('TERMINAL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'TERMINAL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              Raw GSM Stream ({logs.length})
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawer Body Content */}
      <div className="p-4 max-h-[360px] overflow-y-auto">
        {/* TAB 1: 1-Click Presets */}
        {activeTab === 'PRESETS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Evaluator Demo Console: Click any preset button to inject a real-time GSM SMS
                payload into the triage engine:
              </span>
              <span className="text-amber-400 font-mono font-semibold">
                Simulating Ethio-Telecom GSM Cell Tower
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Button 1: SOS Press */}
              <button
                onClick={() => runPreset('SOS')}
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-rose-950/80 to-slate-900 border border-rose-600/50 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-950/40 transition-all text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-rose-400 group-hover:text-rose-300 flex items-center gap-1">
                    <Zap className="w-4 h-4 animate-bounce" />
                    Simulate SOS Button Press
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500 text-slate-950 font-black">
                    CODE RED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Abeba Tadesse (34-wk Pregnant Mother in Bole)
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800">
                  EB-101#MANUAL_SOS#9.0024,38.7842...
                </div>
              </button>

              {/* Button 2: SpO2 Drop */}
              <button
                onClick={() => runPreset('SPO2')}
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-rose-950/80 to-slate-900 border border-rose-600/50 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-950/40 transition-all text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-rose-400 group-hover:text-rose-300 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Simulate SpO2 Drop (&lt;80%)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500 text-slate-950 font-black">
                    CODE RED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Mulugeta Assefa (COPD & Hypoxia Alert in Lideta)
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800">
                  EB-102#CRITICAL_HYPOXIA#SPO2:76...
                </div>
              </button>

              {/* Button 3: Fall Impact */}
              <button
                onClick={() => runPreset('FALL')}
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-600/50 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-950/40 transition-all text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Simulate Fall & Impact
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                    CODE RED
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Tigist Haile (Epilepsy Impact Alert in Yeka)
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800">
                  EB-103#FALL_DETECTED#ACC:3.8,2.4...
                </div>
              </button>

              {/* Button 4: Arrhythmia Tachycardia */}
              <button
                onClick={() => runPreset('TACHY')}
                className="group flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-rose-950/80 to-slate-900 border border-rose-600/50 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-950/40 transition-all text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-rose-400 group-hover:text-rose-300 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Simulate Tachycardia (&gt;150 BPM)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                    CODE AMBER
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Kassahun Worku (Cardiac Spike in Kirkos)
                </p>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800">
                  EB-104#TACHYCARDIAC_SPIKE#HR:164...
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Custom Payload Form */}
        {activeTab === 'CUSTOM' && (
          <form onSubmit={handleInjectCustom} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Wearable ID
                </label>
                <input
                  type="text"
                  value={deviceSerial}
                  onChange={e => setDeviceSerial(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Trigger Event
                </label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as EventType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="MANUAL_SOS">MANUAL_SOS</option>
                  <option value="FALL_DETECTED">FALL_DETECTED</option>
                  <option value="CRITICAL_HYPOXIA">CRITICAL_HYPOXIA</option>
                  <option value="TACHYCARDIAC_SPIKE">TACHYCARDIAC_SPIKE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  GPS Lat / Lng
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  HR (BPM) / SpO2 (%)
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={hr}
                    onChange={e => setHr(Number(e.target.value))}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Temp (°C) / Battery
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={e => setTemp(Number(e.target.value))}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                  <input
                    type="number"
                    value={battery}
                    onChange={e => setBattery(Number(e.target.value))}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow transition-all text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit SMS</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: Raw Terminal Log Stream */}
        {activeTab === 'TERMINAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Console Log Stream */}
            <div className="lg:col-span-2 bg-[#060911] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 h-48 overflow-y-auto space-y-1.5 shadow-inner">
              <div className="text-slate-500 pb-1 border-b border-slate-800 text-[10px] flex items-center justify-between">
                <span>[GSM SIM800 / SIM7000 HARDWARE TELEMETRY STREAM]</span>
                <span>BAUD: 115200</span>
              </div>
              {logs.map(log => (
                <div key={log.id} className="leading-relaxed flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`font-semibold ${
                      log.type === 'TRIAGE'
                        ? 'text-rose-400'
                        : log.type === 'SMS_INCOMING'
                          ? 'text-amber-300'
                          : log.type === 'AUDIO'
                            ? 'text-cyan-300'
                            : 'text-emerald-400'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Decoded Object JSON Inspector */}
            <div className="bg-[#060911] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 h-48 overflow-y-auto shadow-inner">
              <div className="text-amber-400 pb-1 border-b border-slate-800 text-[10px] font-bold uppercase flex items-center justify-between">
                <span>Decoded JSON Inspector</span>
                <Code className="w-3 h-3" />
              </div>
              {decodedObj ? (
                <pre className="text-[10px] text-cyan-300 mt-2 whitespace-pre-wrap">
                  {JSON.stringify(decodedObj, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 mt-4 text-center">No raw SMS payload received yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
