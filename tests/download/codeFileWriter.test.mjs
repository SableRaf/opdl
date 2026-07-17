import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeCodeFile } from '../../src/download/codeFileWriter.js';

describe('writeCodeFile', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-cfw-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes a file using the codeBlock title, sanitized', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'sketch.js', code: 'console.log(1);' },
      index: 0,
      sketchInfo: { sketchId: 1 },
      addSourceComments: false,
      usedNames: used,
    });
    expect(result.codeFileName).toBe('sketch.js');
    expect(fs.readFileSync(result.codeFilePath, 'utf8')).toBe('console.log(1);');
  });

  it('falls back to fallbackBase_N.js when title is missing', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { code: 'x' },
      index: 2,
      sketchInfo: {},
      addSourceComments: false,
      fallbackBase: 'code',
      usedNames: used,
    });
    expect(result.codeFileName).toBe('code_3.js');
  });

  it('appends .js when extension is missing', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'mySketch', code: '' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      usedNames: used,
    });
    expect(result.codeFileName).toBe('mySketch.js');
  });

  it('prepends attribution block when addSourceComments is true', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'a.js', code: 'noop();' },
      index: 0,
      sketchInfo: { sketchId: 42, title: 'T', author: 'A' },
      addSourceComments: true,
      usedNames: used,
    });
    const content = fs.readFileSync(result.codeFilePath, 'utf8');
    expect(content).toMatch(/Downloaded with opdl/);
    expect(content).toMatch(/noop\(\);/);
  });

  it('does not prepend attribution to shader files', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'frag.glsl', code: '#version 300 es\nvoid main() {}' },
      index: 0,
      sketchInfo: { sketchId: 42, title: 'T', author: 'A' },
      addSourceComments: true,
      usedNames: used,
    });
    const content = fs.readFileSync(result.codeFilePath, 'utf8');
    expect(content).not.toMatch(/Downloaded with opdl/);
    expect(content.startsWith('#version 300 es')).toBe(true);
  });

  it('de-duplicates colliding sanitized names', () => {
    const used = new Set();
    writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'foo.js', code: 'a' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      usedNames: used,
    });
    const second = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'foo.js', code: 'b' },
      index: 1,
      sketchInfo: {},
      addSourceComments: false,
      usedNames: used,
    });
    expect(second.codeFileName).toBe('foo_2.js');
    expect(fs.readFileSync(path.join(dir, 'foo.js'), 'utf8')).toBe('a');
    expect(fs.readFileSync(path.join(dir, 'foo_2.js'), 'utf8')).toBe('b');
  });

  it('sanitizes path-traversal titles into outputDir', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: '../../etc/passwd', code: 'x' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      usedNames: used,
    });
    const resolved = path.resolve(result.codeFilePath);
    expect(resolved.startsWith(path.resolve(dir))).toBe(true);
  });
});
