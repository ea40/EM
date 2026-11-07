import { describe, expect, it } from 'vitest';
import { escapeHtml, safeImageUrl } from '../escapeHtml';

describe('escapeHtml', () => {
  it('escapes every character that can break out of an attribute or tag', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('neutralises a payload aimed at an HTML attribute boundary', () => {
    const attack = '" onload="alert(1)';
    const escaped = escapeHtml(attack);
    expect(escaped).not.toContain('"');
    expect(escaped).toBe('&quot; onload=&quot;alert(1)');
  });

  it('leaves ordinary clinical text untouched', () => {
    expect(escapeHtml('Bole Sub-City')).toBe('Bole Sub-City');
    expect(escapeHtml('High-Risk Maternal Telemetry')).toBe('High-Risk Maternal Telemetry');
  });

  it('coerces non-string input and treats nullish as empty', () => {
    expect(escapeHtml(138)).toBe('138');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('safeImageUrl', () => {
  it('permits http and https sources', () => {
    expect(safeImageUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(safeImageUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
  });

  it('permits data: only for images', () => {
    const png = 'data:image/png;base64,AAAA';
    expect(safeImageUrl(png)).toBe(png);
    expect(safeImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
  });

  it('blocks executable and unrecognised schemes', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('vbscript:msgbox(1)')).toBe('');
    expect(safeImageUrl('file:///etc/passwd')).toBe('');
  });

  it('returns the caller fallback for empty or relative input', () => {
    expect(safeImageUrl('')).toBe('');
    expect(safeImageUrl('   ')).toBe('');
    expect(safeImageUrl(undefined)).toBe('');
    expect(safeImageUrl('not a url', 'FALLBACK')).toBe('FALLBACK');
  });
});
