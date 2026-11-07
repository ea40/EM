import { useMemo, type ReactNode } from 'react';
import type { EmergencyAlert, Patient, SMSBroadcastRecord } from '../types';
import { INITIAL_SMS_BROADCASTS } from '../data/mockData';
import { safeImageUrl } from '../utils/escapeHtml';
import { formatShortTime } from '../utils/format';
import { triageStyle } from '../utils/triage';
import {
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  MessageSquare,
  PhoneCall,
  Stethoscope,
  Users
} from 'lucide-react';

/**
 * Delivery state is not decoration: a caregiver who was never told must not be
 * shown the same green badge as one who was. Every status the record can hold
 * gets its own tone, so an unmapped one is a type error rather than a silent
 * success.
 */
const DELIVERY_BADGE: Record<SMSBroadcastRecord['deliveryStatus'], string> = {
  DELIVERED: 'border-emerald-800 bg-emerald-950/60 text-emerald-400',
  SENDING: 'border-cyan-800 bg-cyan-950/60 text-cyan-400',
  FAILED: 'border-rose-800 bg-rose-950/60 text-rose-400'
};

type CaregiverNetworkPageProps = {
  patients: Patient[];
  alerts: EmergencyAlert[];
  onContactClick: (alert: EmergencyAlert) => void;
};

export function CaregiverNetworkPage({
  patients,
  alerts,
  onContactClick
}: CaregiverNetworkPageProps) {
  /*
   * Index the alerts by patient once. The dialer must reach *this* patient's
   * incident — falling back to `alerts[0]` would open another patient's
   * caregiver, which in an emergency network is a wrong-number call.
   */
  const alertByPatientId = useMemo(() => {
    const index = new Map<string, EmergencyAlert>();
    for (const alert of alerts) {
      if (!index.has(alert.patientId)) index.set(alert.patientId, alert);
    }
    return index;
  }, [alerts]);

  /*
   * Derived from the log rather than asserted. A hardcoded "delivery 100%"
   * banner stays green while a broadcast quietly fails, which is the one thing
   * this panel exists to surface.
   */
  const delivery = useMemo(() => {
    let delivered = 0;
    let failed = 0;
    for (const sms of INITIAL_SMS_BROADCASTS) {
      if (sms.deliveryStatus === 'DELIVERED') delivered += 1;
      else if (sms.deliveryStatus === 'FAILED') failed += 1;
    }
    const total = INITIAL_SMS_BROADCASTS.length;
    return { failed, deliveredPercent: total === 0 ? 0 : Math.round((delivered / total) * 100) };
  }, []);

  const isGatewayDegraded = delivery.failed > 0;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      <header className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-2.5 text-rose-400">
            <HeartHandshake className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-100">
              Caregiver &amp; family notification network
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Automated SMS broadcast to next of kin via the SIM800 GSM gateway
            </p>
          </div>
        </div>

        <span
          className={`flex items-center gap-1.5 self-start rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
            isGatewayDegraded
              ? 'border-amber-800/70 bg-amber-950/50 text-amber-400'
              : 'border-emerald-800/70 bg-emerald-950/50 text-emerald-400'
          }`}
        >
          {isGatewayDegraded ? (
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {isGatewayDegraded
            ? `Gateway degraded · ${delivery.failed} undelivered`
            : `Gateway online · delivery ${delivery.deliveredPercent}%`}
        </span>
      </header>

      {/* Caregiver roster */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {patients.map(patient => {
          const alert = alertByPatientId.get(patient.id) ?? null;
          const style = alert ? triageStyle(alert.code) : null;
          const photo = safeImageUrl(patient.photoUrl);

          return (
            <article key={patient.id} className="panel flex flex-col p-4">
              <header className="flex items-center gap-3 border-b border-slate-800 pb-3">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full border object-cover"
                    style={{ borderColor: style?.hex ?? '#334155' }}
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-slate-950"
                    style={{ backgroundColor: style?.hex ?? '#475569' }}
                    aria-hidden="true"
                  >
                    {patient.id.replace(/^EB-/, '')}
                  </span>
                )}

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-100">
                    {patient.contact.primaryName}
                  </h2>
                  <p className="truncate text-[11px] text-slate-400">
                    {patient.contact.relation} of {patient.name}
                    <span className="data-num ml-1 font-mono text-slate-500">{patient.id}</span>
                  </p>
                </div>
              </header>

              <dl className="mt-3 space-y-1.5 text-[11px]">
                <Row label="Ethio-Telecom mobile">
                  <span className="data-num font-mono font-bold text-emerald-400">
                    {patient.contact.primaryPhone}
                  </span>
                </Row>
                {patient.contact.doctorName && (
                  <Row label="Assigned clinician">
                    <span className="flex items-center gap-1 font-semibold text-cyan-300">
                      <Stethoscope className="w-3 h-3" aria-hidden="true" />
                      {patient.contact.doctorName}
                    </span>
                  </Row>
                )}
                <Row label="Latest incident">
                  {alert && style ? (
                    <span
                      className="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ color: style.hex, borderColor: `${style.hex}66` }}
                    >
                      {style.label}
                    </span>
                  ) : (
                    <span className="text-slate-500">No incident on record</span>
                  )}
                </Row>
              </dl>

              <button
                type="button"
                disabled={!alert}
                onClick={() => alert && onContactClick(alert)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 p-2 text-xs font-extrabold text-white shadow-elev-2 transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
              >
                <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                {alert ? 'Simulate voice call to caregiver' : 'No incident to call about'}
              </button>
            </article>
          );
        })}
      </section>

      {/* Broadcast log */}
      <section className="panel p-4">
        <header className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <MessageSquare className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Emergency SMS dispatch log
          </h2>
          <span className="data-num ml-auto font-mono text-[10px] text-slate-500">
            {INITIAL_SMS_BROADCASTS.length} logged
          </span>
        </header>

        <ul className="mt-3 space-y-2">
          {INITIAL_SMS_BROADCASTS.map(sms => (
            <li
              key={sms.id}
              className="panel-inset flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="data-num font-mono text-[11px] font-bold text-cyan-300">
                    {sms.recipientName} ({sms.recipientPhone})
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                      DELIVERY_BADGE[sms.deliveryStatus]
                    }`}
                  >
                    {sms.deliveryStatus}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">{sms.messageContent}</p>
              </div>

              <time
                dateTime={sms.timestamp}
                className="data-num shrink-0 font-mono text-[10px] text-slate-500"
              >
                {formatShortTime(sms.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-center gap-1.5 px-1 pb-1 text-[10px] text-slate-600">
        <Users className="w-3 h-3" aria-hidden="true" />
        {patients.length} patients enrolled in the caregiver notification network
      </p>
    </div>
  );
}

type RowProps = { label: string; children: ReactNode };

function Row({ label, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate text-right">{children}</dd>
    </div>
  );
}
