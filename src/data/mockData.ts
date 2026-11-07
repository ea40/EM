import {
  EmergencyAlert,
  HospitalNode,
  Patient,
  AmbulanceUnit,
  HardwareDeviceDiagnostics,
  SMSBroadcastRecord
} from '../types';

/**
 * Re-exported so existing imports keep working. The values themselves live in
 * `config/thresholds` because the decoder needs them too, and a default that
 * the decoder and the settings UI disagree about is a clinical bug.
 */
export { DEFAULT_THRESHOLDS } from '../config/thresholds';

export const ADDIS_HOSPITALS: HospitalNode[] = [
  {
    id: 'HOSP-01',
    name: "Tikur Anbessa (Black Lion) Specialized Hospital",
    subCity: "Lideta / Kirkos",
    lat: 9.0158,
    lng: 38.7516,
    availableAmbulances: 4,
    phone: "+251 11 551 1211",
    type: "Specialized",
    totalDispatchesToday: 18
  },
  {
    id: 'HOSP-02',
    name: "St. Paul's Hospital Millennium Medical College",
    subCity: "Gullele",
    lat: 9.0583,
    lng: 38.7247,
    availableAmbulances: 3,
    phone: "+251 11 275 0125",
    type: "Emergency Hub",
    totalDispatchesToday: 14
  },
  {
    id: 'HOSP-03',
    name: "Zewditu Memorial Hospital",
    subCity: "Kirkos",
    lat: 9.0175,
    lng: 38.7628,
    availableAmbulances: 2,
    phone: "+251 11 551 8085",
    type: "General",
    totalDispatchesToday: 9
  },
  {
    id: 'HOSP-04',
    name: "Landmark General Hospital",
    subCity: "Bole",
    lat: 9.0012,
    lng: 38.7750,
    availableAmbulances: 3,
    phone: "+251 11 662 2500",
    type: "Specialized",
    totalDispatchesToday: 11
  },
  {
    id: 'HOSP-05',
    name: "Kadisco General Hospital",
    subCity: "Bole / Gerji",
    lat: 8.9880,
    lng: 38.7895,
    availableAmbulances: 2,
    phone: "+251 11 629 8902",
    type: "General",
    totalDispatchesToday: 7
  }
];

export const AMBULANCE_FLEET: AmbulanceUnit[] = [
  {
    id: 'AMB-ETH-01',
    hospitalId: 'HOSP-01',
    hospitalName: 'Tikur Anbessa Hospital',
    status: 'EN_ROUTE',
    driverName: 'Alula Yohannes',
    paramedicName: 'Nurse Firehiwot Tadesse',
    phone: '+251 91 112 3344',
    fuelLevel: 85,
    assignedAlertId: 'ALT-EB-101',
    currentSubCity: 'Bole Sub-City'
  },
  {
    id: 'AMB-ETH-02',
    hospitalId: 'HOSP-01',
    hospitalName: 'Tikur Anbessa Hospital',
    status: 'AVAILABLE',
    driverName: 'Merid Wolde',
    paramedicName: 'Nurse Daniel Getachew',
    phone: '+251 91 223 4455',
    fuelLevel: 92,
    currentSubCity: 'Lideta Sub-City'
  },
  {
    id: 'AMB-ETH-03',
    hospitalId: 'HOSP-02',
    hospitalName: "St. Paul's Hospital",
    status: 'ON_SCENE',
    driverName: 'Ermias Berhanu',
    paramedicName: 'Dr. Selam Kassa',
    phone: '+251 91 334 5566',
    fuelLevel: 68,
    assignedAlertId: 'ALT-EB-103',
    currentSubCity: 'Yeka Sub-City'
  },
  {
    id: 'AMB-ETH-04',
    hospitalId: 'HOSP-04',
    hospitalName: 'Landmark General Hospital',
    status: 'AVAILABLE',
    driverName: 'Kaleb Worku',
    paramedicName: 'Nurse Meskerem Assefa',
    phone: '+251 91 445 6677',
    fuelLevel: 98,
    currentSubCity: 'Bole Sub-City'
  },
  {
    id: 'AMB-ETH-05',
    hospitalId: 'HOSP-03',
    hospitalName: 'Zewditu Memorial Hospital',
    status: 'MAINTENANCE',
    driverName: 'Tariku Desta',
    paramedicName: 'Nurse Bethel Tekle',
    phone: '+251 91 556 7788',
    fuelLevel: 35,
    currentSubCity: 'Kirkos Sub-City'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'EB-101',
    name: "Abeba Tadesse",
    age: 28,
    gender: "Female",
    bloodType: "O+",
    photoUrl: "",
    chronicCondition: "34-Week High-Risk Pregnancy (Preeclampsia)",
    wearableSerial: "EB-101-ET",
    contact: {
      primaryName: "Tewodros Bekele (Husband)",
      primaryPhone: "+251 91 123 4567",
      relation: "Husband",
      doctorName: "Dr. Aster Solomon",
      doctorPhone: "+251 91 555 0192",
      smsAlertsSentCount: 2
    },
    location: {
      lat: 9.0024,
      lng: 38.7842,
      subCity: "Bole Sub-City",
      address: "Near Medhane Alem Church, Block 14"
    },
    currentVitals: {
      heartRate: 88,
      spo2: 97,
      temperature: 37.1,
      battery: 88,
      gsmSignal: 4,
      accelX: 0.1,
      accelY: 0.0,
      accelZ: 0.98,
      isFallDetected: false,
      isSosPressed: true,
      lastUpdated: "Just now"
    },
    triageStatus: 'RED',
    distressReason: 'Manual SOS Triggered · Acute Abdominal Pain & Dizziness',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    notesHistory: [
      "Patient activated manual SOS distress signal via SIM800 wearable.",
      "Vital telemetry stable: Heart Rate 88 BPM, SpO2 97%."
    ]
  },
  {
    id: 'EB-102',
    name: "Mulugeta Assefa",
    age: 64,
    gender: "Male",
    bloodType: "A+",
    photoUrl: "",
    chronicCondition: "Severe COPD & Hypoxia Risk",
    wearableSerial: "EB-102-ET",
    contact: {
      primaryName: "Hiwot Mulugeta (Daughter)",
      primaryPhone: "+251 92 345 6789",
      relation: "Daughter",
      doctorName: "Dr. Berhanu Nega",
      doctorPhone: "+251 91 444 8822",
      smsAlertsSentCount: 3
    },
    location: {
      lat: 9.0188,
      lng: 38.7431,
      subCity: "Lideta Sub-City",
      address: "Woreda 04, House No. 892"
    },
    currentVitals: {
      heartRate: 78,
      spo2: 76,
      temperature: 36.6,
      battery: 91,
      gsmSignal: 5,
      accelX: 0.0,
      accelY: -0.1,
      accelZ: 0.99,
      isFallDetected: false,
      isSosPressed: false,
      lastUpdated: "2 mins ago"
    },
    triageStatus: 'RED',
    distressReason: 'Critical SpO2 Drop Below 80% (Hypoxia Alert)',
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    notesHistory: [
      "Patient has chronic obstructive pulmonary disease.",
      "Optical SpO2 dropped to 76% (Critical Hypoxia threshold triggered)."
    ]
  },
  {
    id: 'EB-103',
    name: "Tigist Haile",
    age: 31,
    gender: "Female",
    bloodType: "B+",
    photoUrl: "",
    chronicCondition: "Epilepsy & Sudden Fall Risk",
    wearableSerial: "EB-103-ET",
    contact: {
      primaryName: "Haile Gebreselassie (Father)",
      primaryPhone: "+251 91 987 6543",
      relation: "Father",
      doctorName: "Dr. Salem Wolde",
      doctorPhone: "+251 91 333 7711",
      smsAlertsSentCount: 1
    },
    location: {
      lat: 9.0355,
      lng: 38.7690,
      subCity: "Yeka Sub-City",
      address: "Megenagna Signal, Near Zefmesh Grand Mall"
    },
    currentVitals: {
      heartRate: 82,
      spo2: 95,
      temperature: 36.9,
      battery: 89,
      gsmSignal: 4,
      accelX: 3.2,
      accelY: 1.8,
      accelZ: 0.15,
      isFallDetected: true,
      isSosPressed: false,
      lastUpdated: "5 mins ago"
    },
    triageStatus: 'AMBER',
    distressReason: 'Sudden Maternal Impact & Fall Detected (3.7g)',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    notesHistory: [
      "Wearable 3-axis accelerometer detected impact magnitude of 3.7g.",
      "Automatic fall event dispatched via SIM800 cellular SMS."
    ]
  }
];

export const INITIAL_ALERTS: EmergencyAlert[] = INITIAL_PATIENTS.filter(p => p.triageStatus !== 'GREEN').map(p => ({
  id: `ALT-${p.id}`,
  patientId: p.id,
  patientName: p.name,
  patientPhoto: p.photoUrl,
  patientAge: p.age,
  chronicCondition: p.chronicCondition,
  contact: p.contact,
  code: p.triageStatus,
  eventType: p.currentVitals.isSosPressed ? 'MANUAL_SOS' 
    : p.currentVitals.isFallDetected ? 'FALL_DETECTED'
    : p.currentVitals.spo2 < 80 ? 'CRITICAL_HYPOXIA'
    : 'TACHYCARDIAC_SPIKE',
  title: p.distressReason || 'Emergency Vital Triggered',
  description: `GSM payload decoded via Ethio-Telecom SIM800 gateway. Patient location: ${p.location.subCity}, ${p.location.address}`,
  location: p.location,
  vitals: p.currentVitals,
  timestamp: p.createdAt,
  rawSmsPayload: `${p.id}#${p.currentVitals.isSosPressed ? 'MANUAL_SOS' : p.currentVitals.isFallDetected ? 'FALL_DETECTED' : 'CRITICAL_VITAL'}#${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}#HR:${p.currentVitals.heartRate}#SPO2:${p.currentVitals.spo2}#TMP:${p.currentVitals.temperature}#BAT:${p.currentVitals.battery}%#ACC:${p.currentVitals.accelX},${p.currentVitals.accelY},${p.currentVitals.accelZ}`,
  dispatchStatus: 'UNASSIGNED'
}));

export const HARDWARE_DEVICES: HardwareDeviceDiagnostics[] = [
  {
    serial: 'EB-101-ET',
    patientId: 'EB-101',
    patientName: 'Abeba Tadesse',
    pcbBoardVersion: 'EMER-BRACE v2.1 (2-PCB Dual System)',
    batteryLevel: 88,
    gsmSignalDbm: -72,
    simCardNumber: '+251 91 801 1001',
    firmwareVersion: 'fw-v2.4.1-eth',
    status: 'ONLINE',
    lastPingTimestamp: '1 min ago',
    satellitesLocked: 9
  },
  {
    serial: 'EB-102-ET',
    patientId: 'EB-102',
    patientName: 'Mulugeta Assefa',
    pcbBoardVersion: 'EMER-BRACE v2.1 (2-PCB Dual System)',
    batteryLevel: 91,
    gsmSignalDbm: -68,
    simCardNumber: '+251 91 801 1002',
    firmwareVersion: 'fw-v2.4.1-eth',
    status: 'ONLINE',
    lastPingTimestamp: '2 mins ago',
    satellitesLocked: 11
  },
  {
    serial: 'EB-103-ET',
    patientId: 'EB-103',
    patientName: 'Tigist Haile',
    pcbBoardVersion: 'EMER-BRACE v2.1 (2-PCB Dual System)',
    batteryLevel: 89,
    gsmSignalDbm: -78,
    simCardNumber: '+251 91 801 1003',
    firmwareVersion: 'fw-v2.4.1-eth',
    status: 'ONLINE',
    lastPingTimestamp: '5 mins ago',
    satellitesLocked: 8
  }
];

export const INITIAL_SMS_BROADCASTS: SMSBroadcastRecord[] = [
  {
    id: 'SMS-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    recipientPhone: '+251 91 123 4567',
    recipientName: 'Tewodros Bekele (Husband)',
    patientName: 'Abeba Tadesse',
    messageContent: '[EMER-BRACE URGENT ALERT] Emergency SOS pressed by Abeba Tadesse in Bole Sub-City! Ambulance dispatch initiated.',
    deliveryStatus: 'DELIVERED'
  },
  {
    id: 'SMS-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    recipientPhone: '+251 92 345 6789',
    recipientName: 'Hiwot Mulugeta (Daughter)',
    patientName: 'Mulugeta Assefa',
    messageContent: '[EMER-BRACE CRITICAL HYPOXIA] Mulugeta Assefa SpO2 level dropped below 80% (76%). Medical triage code RED.',
    deliveryStatus: 'DELIVERED'
  },
  {
    id: 'SMS-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    recipientPhone: '+251 91 987 6543',
    recipientName: 'Haile Gebreselassie (Father)',
    patientName: 'Tigist Haile',
    messageContent: '[EMER-BRACE FALL DETECTED] Impact alert recorded for Tigist Haile in Yeka Sub-City. Paramedics alerted.',
    deliveryStatus: 'DELIVERED'
  }
];
