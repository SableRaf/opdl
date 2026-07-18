import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeCodeFile, resolveCodeFileName } from '../../src/download/codeFileWriter.js';

describe('resolveCodeFileName', () => {
  it('sanitizes the title and preserves its extension', () => {
    expect(resolveCodeFileName({ title: 'sketch.js', index: 0 })).toBe('sketch.js');
  });

  it('falls back to fallbackBase_N.js when title is missing (indexed default)', () => {
    expect(resolveCodeFileName({ title: undefined, index: 2 })).toBe('part_3.js');
  });

  it('falls back to fallbackBase_N.js for a punctuation-only extensionless title', () => {
    expect(resolveCodeFileName({ title: '***', index: 0 })).toBe('part_1.js');
  });

  it('resolves a punctuation-only title to sketch.pde with the pjs non-indexed fallback', () => {
    expect(resolveCodeFileName({
      title: '***', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('sketch.pde');
  });

  it('resolves a literal ".pde" title to sketch.pde instead of ".pde.pde" or a hidden dotfile', () => {
    expect(resolveCodeFileName({
      title: '.pde', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('sketch.pde');
  });

  it('resolves an uppercase ".PDE" title the same way, case-insensitively', () => {
    expect(resolveCodeFileName({
      title: '.PDE', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('sketch.pde');
  });

  it('preserves an explicit extension even when defaultExtension differs', () => {
    expect(resolveCodeFileName({
      title: 'helper.js', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('helper.js');
    expect(resolveCodeFileName({
      title: 'index.html', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('index.html');
  });

  it('applies defaultExtension to an extensionless title', () => {
    expect(resolveCodeFileName({
      title: 'MySketch', index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
    })).toBe('MySketch.pde');
  });

  it('indexed default fallback still yields part_1.js for non-pjs callers', () => {
    expect(resolveCodeFileName({ title: '', index: 0 })).toBe('part_1.js');
  });

  it('is pure and does not dedupe against sibling names', () => {
    const a = resolveCodeFileName({ title: 'foo.js', index: 0 });
    const b = resolveCodeFileName({ title: 'foo.js', index: 1 });
    expect(a).toBe('foo.js');
    expect(b).toBe('foo.js');
  });

  it('treats dot-segment titles (".." / ".") as unusable so the stem can never be a path segment', () => {
    // A title of ".." would otherwise resolve to "...pde" with stem "..",
    // which collapses out of the sketch directory when joined into a path.
    for (const title of ['..', '.', '../..', './..']) {
      const r = resolveCodeFileName({
        title, index: 0, fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false,
      });
      expect(r).toBe('sketch.pde');
    }
  });

  it('is callable with no arguments and with a missing index (genuine defaults)', () => {
    expect(resolveCodeFileName()).toBe('part_1.js');
    expect(resolveCodeFileName({})).toBe('part_1.js');
    expect(resolveCodeFileName({ title: '' })).toBe('part_1.js');
  });
});

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

  it('applies defaultExtension when the title has none', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'MySketch', code: 'void setup() {}' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      fallbackBase: 'sketch',
      defaultExtension: '.pde',
      usedNames: used,
    });
    expect(result.codeFileName).toBe('MySketch.pde');
  });

  it('honors a valid resolvedFileName instead of recomputing one', () => {
    const used = new Set();
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'ignored-title.js', code: 'x' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      resolvedFileName: 'precomputed.pde',
      usedNames: used,
    });
    expect(result.codeFileName).toBe('precomputed.pde');
    expect(fs.existsSync(path.join(dir, 'precomputed.pde'))).toBe(true);
  });

  it('still dedupes a resolvedFileName against usedNames', () => {
    const used = new Set(['taken.pde']);
    const result = writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'x', code: 'x' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      resolvedFileName: 'taken.pde',
      usedNames: used,
    });
    expect(result.codeFileName).toBe('taken_2.pde');
  });

  describe('rejects invalid resolvedFileName', () => {
    const used = () => new Set();
    const attempt = (resolvedFileName) => writeCodeFile({
      outputDir: dir,
      codeBlock: { title: 'x', code: 'x' },
      index: 0,
      sketchInfo: {},
      addSourceComments: false,
      resolvedFileName,
      usedNames: used(),
    });

    it('rejects traversal via ../', () => {
      expect(() => attempt('../../evil.js')).toThrow();
    });

    it('rejects traversal via a nested path with dots', () => {
      expect(() => attempt('foo/../../evil.js')).toThrow();
    });

    it('rejects an absolute path', () => {
      expect(() => attempt('/etc/passwd')).toThrow();
    });

    it('rejects a name embedding a path separator', () => {
      expect(() => attempt('sub/dir.js')).toThrow();
    });

    it('rejects a name that differs from its sanitized form', () => {
      expect(() => attempt('my<sketch>.js')).toThrow();
    });

    it('rejects an empty-stem name', () => {
      expect(() => attempt('.js')).toThrow();
    });

    it('rejects an empty string', () => {
      expect(() => attempt('')).toThrow();
    });
  });
});
