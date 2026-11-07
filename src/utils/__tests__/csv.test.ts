import { describe, expect, it } from 'vitest';
import { buildCsv, escapeCsvField } from '../csv';

describe('escapeCsvField', () => {
  it('leaves a plain field unquoted', () => {
    expect(escapeCsvField('Emran')).toBe('Emran');
    expect(escapeCsvField(42)).toBe('42');
  });

  it('quotes fields containing a comma, quote or newline', () => {
    expect(escapeCsvField('Bole, Addis Ababa')).toBe('"Bole, Addis Ababa"');
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('doubles embedded quotes per RFC 4180 and keeps them inside the quotes', () => {
    expect(escapeCsvField('a "quoted" word')).toBe('"a ""quoted"" word"');
  });

  it('renders null and undefined as an empty field', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('neutralises formula injection with a leading apostrophe', () => {
    expect(escapeCsvField('=1+1')).toBe("'=1+1");
    expect(escapeCsvField('+44 91 100')).toBe("'+44 91 100");
    expect(escapeCsvField('-1')).toBe("'-1");
    expect(escapeCsvField('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('keeps the apostrophe inside the quotes when the formula also needs quoting', () => {
    expect(escapeCsvField('=HYPERLINK("http://x","y")')).toBe('"\'=HYPERLINK(""http://x"",""y"")"');
  });

  it('does not touch a formula trigger that appears mid-field', () => {
    expect(escapeCsvField('HR:142')).toBe('HR:142');
  });
});

describe('buildCsv', () => {
  it('joins headers and rows with CRLF and no trailing newline', () => {
    const csv = buildCsv(['id', 'name'], [['EB-101', 'Emran']]);
    expect(csv).toBe('id,name\r\nEB-101,Emran');
  });

  it('emits only the header row when there is no data', () => {
    expect(buildCsv(['id', 'name'], [])).toBe('id,name');
  });

  it('keeps column alignment when a field contains a comma or quote', () => {
    const csv = buildCsv(['name', 'subCity'], [['Bole, Addis', 'Bole "Hub"']]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('name,subCity');
    expect(row).toBe('"Bole, Addis","Bole ""Hub"""');
  });

  it('escapes a header that needs it', () => {
    expect(buildCsv(['SpO2, %', 'HR'], [])).toBe('"SpO2, %",HR');
  });
});
