/**
 * HTML escaping for the few places where we must hand Leaflet a raw HTML string
 * (`L.divIcon({ html })` and `bindPopup()` both write straight into the DOM).
 *
 * Anything that reaches these strings — device serials, patient names, chronic
 * conditions, addresses — is attacker-influenced: the Hardware Simulator lets an
 * operator type a free-text device serial, and that flows into patient name/id.
 * Escape at every interpolation site.
 */

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Escapes a value for safe interpolation into an HTML string. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
}

/**
 * Returns the URL only when it is a safe image source, otherwise `fallback`.
 * Blocks `javascript:` and other executable schemes from reaching `src=`.
 */
export function safeImageUrl(value: unknown, fallback = ''): string {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  if (raw.startsWith('data:')) {
    return raw.startsWith('data:image/') ? raw : fallback;
  }
  try {
    const { protocol } = new URL(raw);
    return protocol === 'http:' || protocol === 'https:' ? raw : fallback;
  } catch {
    return fallback;
  }
}
