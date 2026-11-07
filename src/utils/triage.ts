import type { TriageCode } from '../types';

export interface TriageStyle {
  /** Operator-facing label — never rely on colour alone. */
  label: string;
  /** Raw hex, for Leaflet markers and canvas drawing where CSS classes can't reach. */
  hex: string;
  /** Tailwind text colour. */
  text: string;
  /** Solid fill — marker bodies, primary chips. */
  solid: string;
  /** Tinted fill — row backgrounds, secondary chips. */
  soft: string;
  /** Hairline border matching `text`. */
  border: string;
}

/**
 * Single source of truth for triage colour and labelling.
 *
 * Every triage surface reads from here so RED means the same thing on the map,
 * in the queue, and in the export. Each entry carries a text label because
 * colour alone is not an accessible way to convey clinical urgency.
 */
export const TRIAGE_STYLES: Record<TriageCode, TriageStyle> = {
  RED: {
    label: 'Critical',
    hex: '#EF4444',
    text: 'text-rose-400',
    solid: 'bg-rose-500',
    soft: 'bg-rose-950/60',
    border: 'border-rose-800'
  },
  AMBER: {
    label: 'Elevated',
    hex: '#F59E0B',
    text: 'text-amber-400',
    solid: 'bg-amber-500',
    soft: 'bg-amber-950/60',
    border: 'border-amber-800'
  },
  GREEN: {
    label: 'Stable',
    hex: '#10B981',
    text: 'text-emerald-400',
    solid: 'bg-emerald-500',
    soft: 'bg-emerald-950/60',
    border: 'border-emerald-800'
  },
  RESOLVED: {
    label: 'Resolved',
    hex: '#64748B',
    text: 'text-slate-400',
    solid: 'bg-slate-500',
    soft: 'bg-slate-900/60',
    border: 'border-slate-700'
  }
};

export function triageStyle(code: TriageCode): TriageStyle {
  return TRIAGE_STYLES[code] ?? TRIAGE_STYLES.GREEN;
}
