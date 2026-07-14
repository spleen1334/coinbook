import { describe, it, expect } from 'vitest';
import { csvEscape, parseCsv } from './csv.js';

describe('csvEscape', () => {
  it('leaves plain values untouched', () => {
    expect(csvEscape('hello')).toBe('hello');
    expect(csvEscape(42)).toBe('42');
  });

  it('quotes values containing commas, quotes, or newlines', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('a"b')).toBe('"a""b"');
    expect(csvEscape('a\nb')).toBe('"a\nb"');
  });

  it('neutralizes leading formula characters to prevent CSV injection', () => {
    expect(csvEscape('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(csvEscape('+1+1')).toBe("'+1+1");
    expect(csvEscape('-1-1')).toBe("'-1-1");
    expect(csvEscape('@cmd')).toBe("'@cmd");
  });

  it('quotes after neutralizing when the value also needs comma-escaping', () => {
    expect(csvEscape('=A1,B1')).toBe('"\'=A1,B1"');
  });

  it('treats null and undefined as empty strings', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

describe('parseCsv', () => {
  it('parses simple comma-separated rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3']
    ]);
  });

  it('handles quoted fields containing commas and escaped quotes', () => {
    expect(parseCsv('a,"b,c","d""e"')).toEqual([['a', 'b,c', 'd"e']]);
  });

  it('skips blank lines', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2']
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2']
    ]);
  });
});
