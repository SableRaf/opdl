import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeTutorial } from '../../src/download/tutorialWriter.js';

function makeBundle(overrides = {}) {
  return {
    tutorial: {
      visualID: 1,
      tutorialID: 99,
      totalPages: 2,
      tutorialMode: 'normal',
      ...overrides.tutorial,
    },
    pages: overrides.pages || [
      { pageNumber: 1, markdown: '# One', codeObjects: [{ title: 'a.js', code: 'one' }] },
      { pageNumber: 2, markdown: '# Two', codeObjects: [{ title: 'b.js', code: 'two' }] },
    ],
    failedPages: overrides.failedPages || [],
  };
}

describe('writeTutorial', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-tw-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('writes README.md and code per page in normal mode', () => {
    const res = writeTutorial(makeBundle(), dir, { sketchId: 1 }, { saveMetadata: false });
    expect(res.pagesWritten).toBe(2);
    expect(fs.readFileSync(path.join(dir, 'tutorial/page_1/README.md'), 'utf8')).toBe('# One');
    expect(fs.readFileSync(path.join(dir, 'tutorial/page_1/a.js'), 'utf8')).toBe('one');
    expect(fs.readFileSync(path.join(dir, 'tutorial/page_2/b.js'), 'utf8')).toBe('two');
  });

  it('singleCode skips code files, writes README only', () => {
    const bundle = makeBundle({
      tutorial: { tutorialMode: 'singleCode' },
      pages: [{ pageNumber: 1, markdown: 'md', codeObjects: [{ title: 'shouldnot.js', code: 'x' }] }],
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, {});
    expect(fs.existsSync(path.join(dir, 'tutorial/page_1/README.md'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'tutorial/page_1/shouldnot.js'))).toBe(false);
  });

  it('saveMetadata: false skips tutorial.json', () => {
    writeTutorial(makeBundle(), dir, { sketchId: 1 }, { saveMetadata: false });
    expect(fs.existsSync(path.join(dir, 'metadata/tutorial.json'))).toBe(false);
  });

  it('saveMetadata: true writes tutorial.json verbatim with failedPages', () => {
    const bundle = makeBundle({
      failedPages: [{ pageNumber: 3, error: Object.assign(new Error('boom'), { status: 500 }) }],
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, { saveMetadata: true, quiet: true });
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'metadata/tutorial.json'), 'utf8'));
    expect(raw.tutorialMode).toBe('normal');
    expect(raw.totalPages).toBe(2);
    expect(raw.failedPages).toEqual([{ pageNumber: 3, error: 'boom', status: 500 }]);
  });

  it('path-traversal regression: codeObjects title stays inside page_N', () => {
    const bundle = makeBundle({
      pages: [{
        pageNumber: 1,
        markdown: '',
        codeObjects: [{ title: '../../etc/passwd', code: 'x' }],
      }],
      tutorial: { tutorialMode: 'normal', totalPages: 1 },
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, {});
    const pageDir = path.join(dir, 'tutorial/page_1');
    const entries = fs.readdirSync(pageDir);
    expect(entries).toContain('README.md');
    // No directory escape happened.
    expect(fs.existsSync(path.join(dir, '..', '..', 'etc', 'passwd'))).toBe(false);
    // All entries live under pageDir.
    for (const e of entries) {
      expect(path.resolve(pageDir, e).startsWith(path.resolve(pageDir))).toBe(true);
    }
  });

  it('collision: two codeObjects with same sanitized name -> second is _2', () => {
    const bundle = makeBundle({
      pages: [{
        pageNumber: 1,
        markdown: '',
        codeObjects: [
          { title: 'dup.js', code: 'a' },
          { title: 'dup.js', code: 'b' },
        ],
      }],
      tutorial: { tutorialMode: 'normal', totalPages: 1 },
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, {});
    expect(fs.readFileSync(path.join(dir, 'tutorial/page_1/dup.js'), 'utf8')).toBe('a');
    expect(fs.readFileSync(path.join(dir, 'tutorial/page_1/dup_2.js'), 'utf8')).toBe('b');
  });

  it('failedPages > 0: warns and still writes successful pages', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bundle = makeBundle({
      failedPages: [{ pageNumber: 5, error: new Error('nope') }],
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, {});
    expect(fs.existsSync(path.join(dir, 'tutorial/page_1/README.md'))).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(message).toMatch(/5/);
  });

  it('empty markdown still writes an empty README.md', () => {
    const bundle = makeBundle({
      pages: [{ pageNumber: 1, markdown: '', codeObjects: [] }],
      tutorial: { tutorialMode: 'singleCode', totalPages: 1 },
    });
    writeTutorial(bundle, dir, { sketchId: 1 }, {});
    const md = fs.readFileSync(path.join(dir, 'tutorial/page_1/README.md'), 'utf8');
    expect(md).toBe('');
  });
});
