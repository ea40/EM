import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { Patient, TriageCode } from '../types';
import { buildCsv, downloadCsv } from '../utils/csv';
import { safeImageUrl } from '../utils/escapeHtml';
import { triageStyle } from '../utils/triage';
import { Modal } from './ui/Modal';
import {
  Download,
  MapPin,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  X
} from 'lucide-react';

type PatientRegistryProps = {
  patients: Patient[];
  onAddPatient: (newPatient: Patient) => void;
  onSelectPatient: (patientId: string) => void;
};

type RegistryFilter = 'ALL' | TriageCode;

const FILTERS: { id: RegistryFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'RED', label: 'Critical' },
  { id: 'AMBER', label: 'Elevated' },
  { id: 'GREEN', label: 'Stable' },
  { id: 'RESOLVED', label: 'Resolved' }
];

/** `Patient.gender` is a closed union — the form must offer every member of it. */
const GENDERS: Patient['gender'][] = ['Female', 'Male', 'Other'];

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const AGE_MIN = 1;
const AGE_MAX = 120;

const CSV_HEADERS = [
  'ID',
  'Name',
  'Age',
  'Gender',
  'BloodType',
  'Condition',
  'Serial',
  'SubCity',
  'Address',
  'ContactName',
  'ContactPhone',
  'DoctorName',
  'DoctorPhone',
  'TriageStatus',
  'RegisteredAt'
];

export function PatientRegistry({ patients, onAddPatient, onSelectPatient }: PatientRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCode, setFilterCode] = useState<RegistryFilter>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profilePatientId, setProfilePatientId] = useState<string | null>(null);

  const [form, setForm] = useState(createEmptyForm('EB-101'));

  const counts = useMemo(() => {
    const tally: Record<RegistryFilter, number> = {
      ALL: patients.length,
      RED: 0,
      AMBER: 0,
      GREEN: 0,
      RESOLVED: 0
    };
    for (const patient of patients) tally[patient.triageStatus] += 1;
    return tally;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return patients.filter(patient => {
      if (filterCode !== 'ALL' && patient.triageStatus !== filterCode) return false;
      if (query === '') return true;

      return (
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.wearableSerial.toLowerCase().includes(query) ||
        patient.chronicCondition.toLowerCase().includes(query) ||
        patient.location.subCity.toLowerCase().includes(query)
      );
    });
  }, [patients, filterCode, searchQuery]);

  /*
   * Resolved by id rather than held as an object: the registry is live, so a
   * stored `Patient` snapshot would keep showing the vitals and triage tier the
   * patient had when the operator clicked "inspect".
   */
  const profilePatient = useMemo(
    () => patients.find(patient => patient.id === profilePatientId) ?? null,
    [patients, profilePatientId]
  );

  const closeAddModal = () => setIsAddModalOpen(false);
  const closeProfile = () => setProfilePatientId(null);

  const openAddModal = () => {
    // Seeded per-open so the serial default tracks the current registry size
    // instead of freezing at whatever it was on first mount.
    setForm(createEmptyForm(nextPatientId(patients)));
    setIsAddModalOpen(true);
  };

  const ageValue = Number(form.age);
  const isAgeValid =
    form.age.trim() !== '' && Number.isInteger(ageValue) && ageValue >= AGE_MIN && ageValue <= AGE_MAX;
  const isNameValid = form.name.trim() !== '';
  const isSerialValid = form.serial.trim() !== '';
  const canSubmit = isNameValid && isAgeValid && isSerialValid;

  const handleCreatePatient = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const id = nextPatientId(patients);

    const newPatient: Patient = {
      id,
      name: form.name.trim(),
      age: ageValue,
      gender: form.gender,
      bloodType: form.bloodType,
      photoUrl: '',
      chronicCondition: form.condition.trim() || 'Monitored risk profile',
      wearableSerial: form.serial.trim(),
      contact: {
        primaryName: form.contactName.trim() || 'Primary caregiver',
        primaryPhone: form.contactPhone.trim(),
        relation: 'Family'
      },
      location: {
        // Addis Ababa city centre jitter — a new registration has no GPS fix yet.
        lat: 9.02 + (Math.random() - 0.5) * 0.04,
        lng: 38.75 + (Math.random() - 0.5) * 0.04,
        subCity: form.subCity.trim() || 'Unassigned sub-city',
        address: form.address.trim() || 'Address pending verification'
      },
      currentVitals: {
        heartRate: 78,
        spo2: 98,
        temperature: 36.6,
        battery: 98,
        gsmSignal: 5,
        accelX: 0,
        accelY: 0,
        accelZ: 1,
        isFallDetected: false,
        isSosPressed: false,
        lastUpdated: 'Just registered'
      },
      triageStatus: 'GREEN',
      createdAt: new Date().toISOString()
    };

    onAddPatient(newPatient);
    closeAddModal();
  };

  /*
   * Exports exactly what the operator is looking at — exporting the full
   * registry while a "Critical" filter is applied silently ships rows the
   * operator filtered out on purpose.
   */
  const handleExportCsv = () => {
    const rows = filteredPatients.map(patient => [
      patient.id,
      patient.name,
      patient.age,
      patient.gender,
      patient.bloodType,
      patient.chronicCondition,
      patient.wearableSerial,
      patient.location.subCity,
      patient.location.address,
      patient.contact.primaryName,
      patient.contact.primaryPhone,
      patient.contact.doctorName ?? '',
      patient.contact.doctorPhone ?? '',
      patient.triageStatus,
      patient.createdAt
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`EMERBRACE_Patient_Registry_${stamp}.csv`, buildCsv(CSV_HEADERS, rows));
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Controls */}
      <header className="panel flex flex-col gap-3 p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-2.5 text-rose-400">
            <Users className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-slate-100">
              High-risk patient &amp; wearable registry
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {patients.length} enrolled wearables &middot; SIM800 serial mapping &amp; caregiver
              routing
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="registry-search">
              Search patients
            </label>
            <input
              id="registry-search"
              type="search"
              placeholder="Patient, ID, serial, condition…"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-navy-950 py-1.5 pl-8 pr-2.5 text-xs text-slate-200 transition-colors placeholder:text-slate-600 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-elev-1 transition-colors hover:bg-rose-500"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Register patient
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredPatients.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-850 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            Export CSV ({filteredPatients.length})
          </button>
        </div>
      </header>

      {/* Triage filter */}
      <div
        role="group"
        aria-label="Filter patients by triage tier"
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto"
      >
        {FILTERS.map(filter => {
          const isActive = filterCode === filter.id;
          const style = filter.id === 'ALL' ? null : triageStyle(filter.id);

          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilterCode(filter.id)}
              className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'border-slate-600 bg-navy-850 font-semibold text-slate-100'
                  : 'border-slate-800 bg-navy-950/50 text-slate-400 hover:bg-navy-850 hover:text-slate-200'
              }`}
            >
              {style && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: style.hex }}
                  aria-hidden="true"
                />
              )}
              {filter.label}
              <span
                className={`data-num rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-bold ${
                  style ? style.text : 'text-slate-400'
                }`}
              >
                {counts[filter.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Registry table */}
      <div className="panel min-h-0 flex-1 overflow-auto p-0">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Enrolled patients, their wearable serial numbers and triage tier
          </caption>
          <thead className="sticky top-0 z-10 border-b border-slate-800 bg-navy-950/95 text-[10px] uppercase tracking-wider text-slate-400 backdrop-blur">
            <tr>
              <th scope="col" className="p-3 font-semibold">Patient</th>
              <th scope="col" className="p-3 font-semibold">Chronic condition</th>
              <th scope="col" className="p-3 font-semibold">Hardware serial</th>
              <th scope="col" className="p-3 font-semibold">Blood</th>
              <th scope="col" className="p-3 font-semibold">Sub-city</th>
              <th scope="col" className="p-3 font-semibold">Primary contact</th>
              <th scope="col" className="p-3 font-semibold">Triage</th>
              <th scope="col" className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <ShieldAlert
                    className="mx-auto mb-2 w-7 h-7 text-slate-700"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-slate-400">
                    No patients match this filter
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Clear the search box or select a different triage tier.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPatients.map(patient => {
                const style = triageStyle(patient.triageStatus);
                const photo = safeImageUrl(patient.photoUrl);
                const isCritical = patient.triageStatus === 'RED';

                return (
                  <tr
                    key={patient.id}
                    className={`transition-colors hover:bg-navy-850/60 ${
                      isCritical ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            width={36}
                            height={36}
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-full border border-slate-700 object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-slate-950"
                            style={{ backgroundColor: style.hex }}
                            aria-hidden="true"
                          >
                            {patient.id.replace(/^EB-/, '')}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100">{patient.name}</span>
                            <span className="data-num rounded border border-slate-700 bg-navy-950 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">
                              {patient.id}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {patient.age} yrs &middot; {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-rose-300">{patient.chronicCondition}</td>

                    <td className="data-num p-3 font-mono font-semibold text-cyan-400">
                      {patient.wearableSerial}
                    </td>

                    <td className="data-num p-3 font-bold text-slate-300">{patient.bloodType}</td>

                    <td className="p-3 text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0 text-rose-400" aria-hidden="true" />
                        <span className="truncate">{patient.location.subCity}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="block font-medium text-slate-200">
                        {patient.contact.primaryName}
                      </span>
                      <span className="data-num block font-mono text-[10px] text-slate-400">
                        {patient.contact.primaryPhone}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase"
                        style={{
                          color: style.hex,
                          borderColor: `${style.hex}80`,
                          backgroundColor: `${style.hex}1F`
                        }}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isCritical ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: style.hex }}
                          aria-hidden="true"
                        />
                        {style.label}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setProfilePatientId(patient.id)}
                        aria-label={`Inspect profile for ${patient.name}`}
                        className="rounded-lg border border-slate-700 bg-navy-850 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 transition-colors hover:bg-slate-700"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPatient(patient.id)}
                        aria-label={`Open live monitor for ${patient.name}`}
                        className="ml-1.5 rounded-lg border border-slate-800 bg-navy-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-navy-850"
                      >
                        Monitor
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Register patient */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        label="Register wearable patient"
      >
        <div className="space-y-4">
          <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-500" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-slate-100">Register wearable patient</h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Binds a SIM800 serial and caregiver contact to a new record
                </p>
              </div>
            </div>
            <CloseButton onClick={closeAddModal} label="Close registration form" />
          </header>

          <form onSubmit={handleCreatePatient} className="space-y-3">
            <Field id="reg-name" label="Patient full name">
              <input
                id="reg-name"
                type="text"
                required
                autoFocus
                placeholder="e.g. Bethlehem Girma"
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field id="reg-age" label="Age">
                <input
                  id="reg-age"
                  type="number"
                  min={AGE_MIN}
                  max={AGE_MAX}
                  value={form.age}
                  onChange={event => setForm({ ...form, age: event.target.value })}
                  aria-invalid={form.age.trim() !== '' && !isAgeValid}
                  className={INPUT_CLASS}
                />
              </Field>

              <Field id="reg-gender" label="Gender">
                <select
                  id="reg-gender"
                  value={form.gender}
                  onChange={event =>
                    setForm({ ...form, gender: event.target.value as Patient['gender'] })
                  }
                  className={INPUT_CLASS}
                >
                  {GENDERS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="reg-blood" label="Blood type">
                <select
                  id="reg-blood"
                  value={form.bloodType}
                  onChange={event => setForm({ ...form, bloodType: event.target.value })}
                  className={INPUT_CLASS}
                >
                  {BLOOD_TYPES.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="reg-condition" label="Chronic condition / risk profile">
              <input
                id="reg-condition"
                type="text"
                required
                value={form.condition}
                onChange={event => setForm({ ...form, condition: event.target.value })}
                placeholder="e.g. High-risk pregnancy, arrhythmia, epilepsy"
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field id="reg-subcity" label="Sub-city">
                <input
                  id="reg-subcity"
                  type="text"
                  value={form.subCity}
                  onChange={event => setForm({ ...form, subCity: event.target.value })}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field id="reg-serial" label="Wearable serial">
                <input
                  id="reg-serial"
                  type="text"
                  required
                  value={form.serial}
                  onChange={event => setForm({ ...form, serial: event.target.value })}
                  aria-invalid={!isSerialValid}
                  className={`${INPUT_CLASS} font-mono text-cyan-400`}
                />
              </Field>
            </div>

            <Field id="reg-address" label="Residence / landmark">
              <input
                id="reg-address"
                type="text"
                value={form.address}
                onChange={event => setForm({ ...form, address: event.target.value })}
                placeholder="e.g. Near Edna Mall, Bole"
                className={INPUT_CLASS}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field id="reg-contact" label="Emergency contact name">
                <input
                  id="reg-contact"
                  type="text"
                  value={form.contactName}
                  onChange={event => setForm({ ...form, contactName: event.target.value })}
                  placeholder="Caregiver name"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field id="reg-phone" label="Caregiver phone (Ethio-Telecom)">
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={event => setForm({ ...form, contactPhone: event.target.value })}
                  className={`${INPUT_CLASS} font-mono`}
                />
              </Field>
            </div>

            {!canSubmit && (
              <p role="alert" className="text-[11px] text-amber-400">
                {!isNameValid
                  ? 'Enter the patient’s full name.'
                  : !isSerialValid
                    ? 'Enter the wearable serial number.'
                    : `Age must be a whole number between ${AGE_MIN} and ${AGE_MAX}.`}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-xl bg-navy-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-elev-1 transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save &amp; assign device
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Patient profile */}
      <Modal
        isOpen={profilePatient !== null}
        onClose={closeProfile}
        label={profilePatient ? `Patient profile for ${profilePatient.name}` : 'Patient profile'}
      >
        <div className="space-y-4">
          {profilePatient && (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <ProfileAvatar patient={profilePatient} />
                  <div>
                    <h2 className="text-base font-extrabold text-slate-100">
                      {profilePatient.name}
                    </h2>
                    <p className="data-num mt-0.5 font-mono text-[11px] text-slate-400">
                      {profilePatient.id} &middot; {profilePatient.chronicCondition}
                    </p>
                  </div>
                </div>
                <CloseButton onClick={closeProfile} label="Close patient profile" />
              </header>

              <div className="space-y-3 text-xs">
            <dl className="grid grid-cols-2 gap-3">
              <div className="panel-inset p-3">
                <dt className="eyebrow">Wearable hardware serial</dt>
                <dd className="data-num mt-1 font-mono text-sm font-bold text-cyan-400">
                  {profilePatient.wearableSerial}
                </dd>
              </div>
              <div className="panel-inset p-3">
                <dt className="eyebrow">Blood group &amp; age</dt>
                <dd className="data-num mt-1 font-mono text-sm font-bold text-slate-200">
                  {profilePatient.bloodType} &middot; {profilePatient.age} yrs &middot;{' '}
                  {profilePatient.gender}
                </dd>
              </div>
            </dl>

            <section className="panel-inset p-3">
              <h3 className="eyebrow">Caregiver &amp; physician contacts</h3>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-200">
                    {profilePatient.contact.primaryName}
                  </p>
                  <p className="data-num font-mono text-slate-400">
                    {profilePatient.contact.primaryPhone}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {profilePatient.contact.relation}
                  </p>
                </div>
                {profilePatient.contact.doctorName && (
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      {profilePatient.contact.doctorName}
                    </p>
                    <p className="data-num font-mono text-slate-400">
                      {profilePatient.contact.doctorPhone ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                      Attending physician
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="panel-inset p-3">
              <h3 className="eyebrow">Registered residence</h3>
              <p className="mt-1 font-semibold text-slate-200">
                {profilePatient.location.subCity} — {profilePatient.location.address}
              </p>
              <p className="data-num mt-1 font-mono text-[10px] text-slate-500">
                {profilePatient.location.lat.toFixed(4)}, {profilePatient.location.lng.toFixed(4)}
              </p>
            </section>

            {profilePatient.notesHistory && profilePatient.notesHistory.length > 0 && (
              <section className="panel-inset p-3">
                <h3 className="eyebrow">Clinical notes</h3>
                <ul className="mt-2 space-y-1.5">
                  {profilePatient.notesHistory.map((note, index) => (
                    <li key={`${index}-${note}`} className="text-[11px] text-slate-300">
                      {note}
                    </li>
                  ))}
                </ul>
              </section>
            )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPatient(profilePatient.id);
                    closeProfile();
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-elev-1 transition-colors hover:bg-rose-500"
                >
                  Open live monitor
                </button>
                <button
                  type="button"
                  onClick={closeProfile}
                  className="rounded-xl bg-navy-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-navy-700"
                >
                  Close profile
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2 text-xs text-slate-100 transition-colors placeholder:text-slate-600 focus:border-rose-500 focus:outline-none';

type FormState = {
  name: string;
  /** Held as text so an emptied field cannot silently become `0`. */
  age: string;
  gender: Patient['gender'];
  bloodType: string;
  condition: string;
  subCity: string;
  address: string;
  contactName: string;
  contactPhone: string;
  serial: string;
};

function createEmptyForm(serial: string): FormState {
  return {
    name: '',
    age: '30',
    gender: 'Female',
    bloodType: 'O+',
    condition: 'High-risk pregnancy',
    subCity: 'Bole Sub-City',
    address: '',
    contactName: '',
    contactPhone: '+251 91 000 0000',
    serial
  };
}

/** Next free `EB-<n>` id, derived from the highest existing one rather than the count. */
function nextPatientId(patients: readonly Patient[]): string {
  let highest = 100;

  for (const patient of patients) {
    const match = /^EB-(\d+)/.exec(patient.id);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > highest) highest = value;
  }

  return `EB-${highest + 1}`;
}

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-navy-800 hover:text-slate-100"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function ProfileAvatar({ patient }: { patient: Patient }) {
  const photo = safeImageUrl(patient.photoUrl);
  const style = triageStyle(patient.triageStatus);

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full border-2 object-cover"
        style={{ borderColor: style.hex }}
      />
    );
  }

  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-black text-slate-950"
      style={{ backgroundColor: style.hex }}
      aria-hidden="true"
    >
      {patient.id.replace(/^EB-/, '')}
    </span>
  );
}
