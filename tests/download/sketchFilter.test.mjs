import { describe, it, expect } from 'vitest';
import { filterSketches, normalizeModes } from '../../src/download/sketchFilter.js';

describe('normalizeModes', () => {
  it('returns [] for nullish input', () => {
    expect(normalizeModes(undefined)).toEqual([]);
    expect(normalizeModes(null)).toEqual([]);
  });

  it('splits a comma-separated string and lowercases/trims', () => {
    expect(normalizeModes('p5js, PJS ')).toEqual(['p5js', 'pjs']);
  });

  it('accepts an array', () => {
    expect(normalizeModes(['P5js', 'html'])).toEqual(['p5js', 'html']);
  });

  it('drops empty entries', () => {
    expect(normalizeModes('p5js,,')).toEqual(['p5js']);
  });
});

describe('filterSketches', () => {
  const sketches = [
    { visualID: 1, mode: 'p5js' },
    { visualID: 2, mode: 'pjs' },
    { visualID: 3, mode: 'html' },
    { visualID: 4, mode: 'P5JS' },
    { visualID: 5 }, // no mode
  ];

  it('returns all sketches when no mode criterion is given', () => {
    expect(filterSketches(sketches, {})).toHaveLength(5);
    expect(filterSketches(sketches)).toHaveLength(5);
  });

  it('keeps only matching modes, case-insensitively', () => {
    const result = filterSketches(sketches, { mode: 'p5js' });
    expect(result.map((s) => s.visualID)).toEqual([1, 4]);
  });

  it('supports multiple modes via csv', () => {
    const result = filterSketches(sketches, { mode: 'pjs,html' });
    expect(result.map((s) => s.visualID)).toEqual([2, 3]);
  });

  it('excludes sketches with no mode when a filter is active', () => {
    const result = filterSketches(sketches, { mode: 'p5js' });
    expect(result.some((s) => s.visualID === 5)).toBe(false);
  });

  it('returns [] when nothing matches', () => {
    expect(filterSketches(sketches, { mode: 'applet' })).toEqual([]);
  });

  it('treats processingjs as an alias for pjs (and vice versa)', () => {
    // user types the documented spelling, sketch carries the API spelling
    expect(filterSketches(sketches, { mode: 'processingjs' }).map((s) => s.visualID)).toEqual([2]);
    // and the reverse: sketch carries the documented spelling
    const legacy = [{ visualID: 9, mode: 'processingjs' }];
    expect(filterSketches(legacy, { mode: 'pjs' }).map((s) => s.visualID)).toEqual([9]);
  });

  it('tolerates non-array input', () => {
    expect(filterSketches(null, { mode: 'p5js' })).toEqual([]);
  });
});
