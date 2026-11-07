/**
 * CSV serialisation for operator exports.
 *
 * Two concerns beyond "join with commas":
 *
 * 1. RFC 4180 quoting — a field containing a quote, comma or newline must be
 *    wrapped and its embedded quotes doubled. Wrapping alone is not enough, and
 *    a patient note containing `"` breaks the column alignment of every row
 *    after it.
 * 2. Formula injection — spreadsheet apps execute cells beginning with `=`,
 *    `+`, `-` or `@`. Patient names and free-text notes reach this code from a
 *    GSM payload, so an attacker-supplied value could run on the operator's
 *    machine when the export is opened. Neutralise with a leading apostrophe.
 */

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Escapes a single field for CSV output, neutralising formula injection.
 */
export function escapeCsvField(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);

  // Prefix before quoting so the apostrophe lands inside the quoted cell.
  const neutralised = FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;

  if (/[",\r\n]/.test(neutralised)) {
    return `"${neutralised.replace(/"/g, '""')}"`;
  }
  return neutralised;
}

/** Serialises a header row plus data rows into an RFC 4180 CSV document. */
export function buildCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','));
  }
  // CRLF is the RFC 4180 line ending and what Excel expects.
  return lines.join('\r\n');
}

/**
 * Triggers a client-side download of a CSV document.
 *
 * The object URL is revoked on the next tick: revoking synchronously can race
 * the browser's own read of the blob on some engines.
 */
export function downloadCsv(filename: string, csv: string): void {
  /*
   * The BOM is built from its code point rather than written as a literal or an
   * escape. A literal U+FEFF in source is invisible and trips
   * `no-irregular-whitespace`; an escape is one keystroke away from collapsing
   * into a two-character backslash sequence that silently stops being a BOM.
   * Excel needs the real character to read the export as UTF-8 rather than the
   * system codepage, which is what mangles non-Latin patient names.
   */
  const utf8Bom = String.fromCharCode(0xfeff);
  const blob = new Blob([utf8Bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
