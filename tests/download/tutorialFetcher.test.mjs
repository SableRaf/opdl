import { describe, it, expect, vi } from 'vitest';
import {
  fetchTutorialBundle,
  isTutorialMode,
} from '../../src/download/tutorialFetcher.js';

const noopSleep = vi.fn(() => Promise.resolve());

function makeHttpGet(routes) {
  // routes: Map<path, () => Promise|value | array of responses for sequential calls>
  const callCounts = new Map();
  return async (path) => {
    const handler = routes[path];
    if (handler === undefined) {
      throw Object.assign(new Error(`No route for ${path}`), { status: 404 });
    }
    if (Array.isArray(handler)) {
      const count = callCounts.get(path) || 0;
      callCounts.set(path, count + 1);
      const next = handler[Math.min(count, handler.length - 1)];
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next();
      return next;
    }
    if (handler instanceof Error) throw handler;
    if (typeof handler === 'function') return handler();
    return handler;
  };
}

describe('isTutorialMode', () => {
  it.each([
    [1, true],
    ['1', true],
    ['normal', true],
    ['singleCode', true],
    [0, false],
    ['0', false],
    [null, false],
    [undefined, false],
    [false, false],
    ['', false],
    ['nope', false],
  ])('%s -> %s', (input, expected) => {
    expect(isTutorialMode(input)).toBe(expected);
  });
});

describe('fetchTutorialBundle', () => {
  it('normal multi-page happy path (locks fixture for visualID 2798401)', async () => {
    const tutorial = {
      visualID: 2798401,
      totalPages: 2,
      tutorialMode: 'normal',
      tutorialID: 999,
    };
    const page1 = { pageID: 1, markdown: '# Page 1', codeObjects: [] };
    const page2 = {
      pageID: 2,
      markdown: '# Page 2',
      codeObjects: [{ title: 'mySketch', code: 'function setup(){}' }],
    };
    const httpGet = makeHttpGet({
      '/api/tutorial/2798401': tutorial,
      '/api/tutorial/2798401/page/1/': page1,
      '/api/tutorial/2798401/page/2/': page2,
    });
    const sleep = vi.fn();
    const bundle = await fetchTutorialBundle({
      httpGet,
      sketchId: 2798401,
      sleep,
    });
    expect(bundle.tutorial.totalPages).toBe(2);
    expect(bundle.pages).toHaveLength(2);
    expect(bundle.pages[1].codeObjects[0].title).toBe('mySketch');
    expect(bundle.failedPages).toEqual([]);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('singleCode mode returns pages with markdown only', async () => {
    const httpGet = makeHttpGet({
      '/api/tutorial/5': { totalPages: 1, tutorialMode: 'singleCode' },
      '/api/tutorial/5/page/1/': { markdown: 'hi', codeObjects: [{ title: 'x', code: '' }] },
    });
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 5, sleep: noopSleep });
    expect(bundle.tutorial.tutorialMode).toBe('singleCode');
    expect(bundle.pages[0].markdown).toBe('hi');
  });

  it('retries on 429 then succeeds', async () => {
    const rateLimit = Object.assign(new Error('Rate limit'), { status: 429 });
    const httpGet = makeHttpGet({
      '/api/tutorial/1': { totalPages: 1, tutorialMode: 'normal' },
      '/api/tutorial/1/page/1/': [rateLimit, { markdown: 'ok', codeObjects: [] }],
    });
    const sleep = vi.fn(() => Promise.resolve());
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 1, sleep });
    expect(bundle.pages).toHaveLength(1);
    expect(bundle.failedPages).toEqual([]);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it('429 on all attempts -> failedPages with status 429, 2 sleeps', async () => {
    const rateLimit = () => Object.assign(new Error('Rate limit'), { status: 429 });
    const httpGet = makeHttpGet({
      '/api/tutorial/1': { totalPages: 1, tutorialMode: 'normal' },
      '/api/tutorial/1/page/1/': [rateLimit(), rateLimit(), rateLimit()],
    });
    const sleep = vi.fn(() => Promise.resolve());
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 1, sleep });
    expect(bundle.pages).toHaveLength(0);
    expect(bundle.failedPages).toHaveLength(1);
    expect(bundle.failedPages[0].pageNumber).toBe(1);
    expect(bundle.failedPages[0].error.status).toBe(429);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
  });

  it('non-429 error -> no retry, lands in failedPages immediately', async () => {
    const serverError = Object.assign(new Error('boom'), { status: 500 });
    const httpGet = makeHttpGet({
      '/api/tutorial/1': { totalPages: 1, tutorialMode: 'normal' },
      '/api/tutorial/1/page/1/': serverError,
    });
    const sleep = vi.fn(() => Promise.resolve());
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 1, sleep });
    expect(bundle.failedPages).toHaveLength(1);
    expect(bundle.failedPages[0].error.status).toBe(500);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('one failing page does not abort subsequent pages', async () => {
    const httpGet = makeHttpGet({
      '/api/tutorial/1': { totalPages: 3, tutorialMode: 'normal' },
      '/api/tutorial/1/page/1/': { markdown: 'a', codeObjects: [] },
      '/api/tutorial/1/page/2/': Object.assign(new Error('500'), { status: 500 }),
      '/api/tutorial/1/page/3/': { markdown: 'c', codeObjects: [] },
    });
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 1, sleep: noopSleep });
    expect(bundle.pages.map((p) => p.pageNumber)).toEqual([1, 3]);
    expect(bundle.failedPages.map((f) => f.pageNumber)).toEqual([2]);
  });

  it('tutorial-index failure throws (bundle-level)', async () => {
    const httpGet = makeHttpGet({
      '/api/tutorial/9': Object.assign(new Error('404'), { status: 404 }),
    });
    await expect(
      fetchTutorialBundle({ httpGet, sketchId: 9, sleep: noopSleep })
    ).rejects.toThrow('404');
  });

  it('undefined markdown is normalized to empty string', async () => {
    const httpGet = makeHttpGet({
      '/api/tutorial/1': { totalPages: 1, tutorialMode: 'normal' },
      '/api/tutorial/1/page/1/': { codeObjects: [] },
    });
    const bundle = await fetchTutorialBundle({ httpGet, sketchId: 1, sleep: noopSleep });
    expect(bundle.pages[0].markdown).toBe('');
  });
});
