export type TriageCode = 'RED' | 'AMBER' | 'GREEN' | 'RESOLVED';

export type EventType = 
  | 'MANUAL_SOS' 
  | 'FALL_DETECTED' 
  | 'CRITICAL_HYPOXIA' 
  | 'TACHYCARDIAC_SPIKE' 
  | 'ARRHYTHMIA_DETECTED' 
  | 'ROUTINE_TELEMETRY';

export type PageRoute = 
  | 'DASHBOARD' 
  | 'PATIENTS' 
  | 'HARDWARE' 
  | 'SIMULATOR'
  | 'FLEET' 
  | 'ANALYTICS' 
  | 'CAREGIVERS' 
  | 'SETTINGS';

export interface Location {
  lat: number;
  lng: number;
  subCity: string;
  address: string;
}

export interface VitalMetrics {
  heartRate: number; // BPM
  spo2: number; // Percentage
  temperature: number; // Celsius (GY906 Sensor)
  battery: number; // Percentage
  gsmSignal: number; // dBm / bars (1-5)
  accelX: number; // g
  accelY: number; // g
  accelZ: number; // g
  isFallDetected: boolean;
  isSosPressed: boolean;
  lastUpdated: string; // ISO or relative
}

export interface EmergencyContact {
  primaryName: string;
  primaryPhone: string;
  relation: string;
  doctorName?: string;
  doctorPhone?: string;
  smsAlertsSentCount?: number;
}

export interface Patient {
  id: string; // e.g. EB-101
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodType: string;
  photoUrl: string;
  chronicCondition: string;
  wearableSerial: string;
  contact: EmergencyContact;
  location: Location;
  currentVitals: VitalMetrics;
  triageStatus: TriageCode;
  distressReason?: string;
  createdAt: string;
  notesHistory?: string[];
}

export interface EmergencyAlert {
  id: string; // Alert ID
  patientId: string;
  patientName: string;
  patientPhoto: string;
  patientAge: number;
  chronicCondition: string;
  /**
   * Denormalised from the patient record so an alert is self-describing for
   * dispatch and caregiver notification without a second lookup.
   */
  contact: EmergencyContact;
  code: TriageCode;
  eventType: EventType;
  title: string;
  description: string;
  location: Location;
  vitals: VitalMetrics;
  timestamp: string; // ISO string
  rawSmsPayload: string;
  dispatchStatus: 'UNASSIGNED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED';
  dispatchedHospital?: string;
  assignedAmbulanceId?: string;
  etaMinutes?: number;
  resolutionNotes?: string;
}

export interface HospitalNode {
  id: string;
  name: string;
  subCity: string;
  lat: number;
  lng: number;
  availableAmbulances: number;
  phone: string;
  type: 'Specialized' | 'General' | 'Emergency Hub';
  totalDispatchesToday: number;
}

export interface AmbulanceUnit {
  id: string;
  hospitalId: string;
  hospitalName: string;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'MAINTENANCE';
  driverName: string;
  paramedicName: string;
  phone: string;
  fuelLevel: number;
  assignedAlertId?: string;
  currentSubCity: string;
}

export interface HardwareDeviceDiagnostics {
  serial: string;
  patientId: string;
  patientName: string;
  pcbBoardVersion: string;
  batteryLevel: number;
  gsmSignalDbm: number;
  simCardNumber: string;
  firmwareVersion: string;
  status: 'ONLINE' | 'LOW_BATTERY' | 'OFFLINE' | 'CRITICAL';
  lastPingTimestamp: string;
  satellitesLocked: number;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SMS_INCOMING' | 'DECODE' | 'TRIAGE' | 'AUDIO' | 'DISPATCH';
  message: string;
  rawPayload?: string;
}

export interface SMSBroadcastRecord {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName: string;
  patientName: string;
  messageContent: string;
  deliveryStatus: 'DELIVERED' | 'SENDING' | 'FAILED';
}

export interface ThresholdSettings {
  spo2Critical: number;
  spo2Warning: number;
  hrCriticalHigh: number;
  /** Lower bound of the AMBER tachycardia band; RED above `hrCriticalHigh`. */
  hrWarningHigh: number;
  hrCriticalLow: number;
  tempFeverHigh: number;
  fallAccelG: number;
  gsmBaudRate: number;
  gsmPort: string;
}
