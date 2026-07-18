import { describe, it, expect } from 'vitest';
import { canonicalizeMode, MODE_ALIASES } from '../../src/download/sketchMode.js';

describe('canonicalizeMode', () => {
  it('maps the processingjs alias to pjs', () => {
    expect(canonicalizeMode('processingjs')).toBe('pjs');
    expect(canonicalizeMode('ProcessingJS')).toBe('pjs');
    expect(canonicalizeMode(' processingjs ')).toBe('pjs');
  });

  it('leaves pjs as pjs', () => {
    expect(canonicalizeMode('pjs')).toBe('pjs');
    expect(canonicalizeMode('PJS')).toBe('pjs');
  });

  it('passes through other modes lowercased', () => {
    expect(canonicalizeMode('p5js')).toBe('p5js');
    expect(canonicalizeMode('HTML')).toBe('html');
    expect(canonicalizeMode('applet')).toBe('applet');
  });

  it('handles empty/nullish input', () => {
    expect(canonicalizeMode('')).toBe('');
    expect(canonicalizeMode(null)).toBe('');
    expect(canonicalizeMode(undefined)).toBe('');
  });

  it('exposes both spellings as aliases of pjs', () => {
    expect(MODE_ALIASES.processingjs).toBe('pjs');
    expect(MODE_ALIASES.pjs).toBe('pjs');
  });
});
