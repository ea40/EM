import type { Patient } from '../types';
import { PatientRegistry } from '../components/PatientRegistry';

type PatientsPageProps = {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onSelectPatient: (patientId: string) => void;
};

export function PatientsPage({ patients, onAddPatient, onSelectPatient }: PatientsPageProps) {
  return (
    <div className="h-full min-h-0">
      <PatientRegistry
        patients={patients}
        onAddPatient={onAddPatient}
        onSelectPatient={onSelectPatient}
      />
    </div>
  );
}
