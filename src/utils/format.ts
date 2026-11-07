/**
 * Time formatting pinned to a single dispatch timezone.
 *
 * The command centre is single-city (Addis Ababa), so every operator-facing
 * timestamp must read in the same zone. Mixing bare `toLocaleTimeString()`
 * (host/browser zone) with an explicit zone made logs and vitals disagree.
 */

export const DISPATCH_TIME_ZONE = 'Africa/Addis_Ababa';

/** `HH:MM:SS` in the dispatch timezone. */
export function formatClockTime(date: Date | string | number = new Date()): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    timeZone: DISPATCH_TIME_ZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/** `HH:MM` in the dispatch timezone. */
export function formatShortTime(date: Date | string | number = new Date()): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    timeZone: DISPATCH_TIME_ZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Elapsed-time label (`42s ago`, `3m 10s ago`) relative to now. */
export function formatElapsed(timestamp: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  return mins === 0 ? `${secs}s ago` : `${mins}m ${secs}s ago`;
}
