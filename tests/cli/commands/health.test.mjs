import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import nock from 'nock';
import {
  handleHealthCommand,
  checkHealth,
  formatHealth,
  reportHealthAfterFailure,
} from '../../../src/cli/commands/health.js';

const BASE_URL = 'https://openprocessing.org';

const HEALTHY = {
  success: true,
  message: 'OK',
  object: { status: 'ok', timestamp: '2026-05-17 09:49:11', version: '23.0.10' },
  code: 200,
};

describe('checkHealth', () => {
  beforeEach(() => {
    vi.stubEnv('NO_COLOR', '1');
    nock.cleanAll();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    nock.cleanAll();
  });

  it('returns ok:true with version for a healthy API', async () => {
    nock(BASE_URL).get('/api/health').reply(200, HEALTHY);
    const health = await checkHealth();
    expect(health.ok).toBe(true);
    expect(health.status).toBe('ok');
    expect(health.version).toBe('23.0.10');
    expect(health.reachable).toBe(true);
  });

  it('returns ok:false for a degraded status', async () => {
    nock(BASE_URL)
      .get('/api/health')
      .reply(200, { success: true, object: { status: 'degraded', version: '23.0.10' } });
    const health = await checkHealth();
    expect(health.ok).toBe(false);
    expect(health.status).toBe('degraded');
    expect(health.reachable).toBe(true);
  });

  it('returns ok:false for a non-200 status', async () => {
    nock(BASE_URL).get('/api/health').reply(503, { success: false });
    const health = await checkHealth();
    expect(health.ok).toBe(false);
    expect(health.httpStatus).toBe(503);
    expect(health.reachable).toBe(true);
  });

  it('marks the API unreachable on a network error', async () => {
    nock(BASE_URL).get('/api/health').replyWithError('connection refused');
    const health = await checkHealth();
    expect(health.ok).toBe(false);
    expect(health.reachable).toBe(false);
    expect(health.error).toMatch(/connection refused/);
  });
});

describe('formatHealth', () => {
  beforeEach(() => vi.stubEnv('NO_COLOR', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('renders OK and version for a healthy API', () => {
    const out = formatHealth({ ok: true, status: 'ok', version: '23.0.10', reachable: true });
    expect(out).toMatch(/OpenProcessing API: OK/);
    expect(out).toMatch(/API version: 23\.0\.10/);
  });

  it('renders unreachable with the error text', () => {
    const out = formatHealth({ reachable: false, error: 'timeout' });
    expect(out).toMatch(/unreachable/);
    expect(out).toMatch(/timeout/);
  });
});

describe('handleHealthCommand', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    vi.stubEnv('NO_COLOR', '1');
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    nock.cleanAll();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    nock.cleanAll();
  });

  it('prints human-readable status for a healthy API', async () => {
    nock(BASE_URL).get('/api/health').reply(200, HEALTHY);
    await handleHealthCommand({ options: {} });
    expect(logSpy.mock.calls[0][0]).toMatch(/OpenProcessing API: OK/);
  });

  it('prints JSON when --json is set', async () => {
    nock(BASE_URL).get('/api/health').reply(200, HEALTHY);
    await handleHealthCommand({ options: { json: true } });
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.ok).toBe(true);
    expect(parsed.version).toBe('23.0.10');
  });

  it('throws with exitCode 1 for an unhealthy API', async () => {
    nock(BASE_URL).get('/api/health').reply(503, { success: false });
    await expect(handleHealthCommand({ options: {} })).rejects.toMatchObject({
      exitCode: 1,
    });
  });

  it('suppresses output when --quiet is set', async () => {
    nock(BASE_URL).get('/api/health').reply(200, HEALTHY);
    await handleHealthCommand({ options: { quiet: true } });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('marks the error as reported under --quiet so the global handler stays silent', async () => {
    nock(BASE_URL).get('/api/health').reply(503, { success: false });
    await expect(handleHealthCommand({ options: { quiet: true } })).rejects.toMatchObject({
      exitCode: 1,
      reported: true,
    });
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
  });
});

describe('reportHealthAfterFailure', () => {
  let errSpy;

  beforeEach(() => {
    vi.stubEnv('NO_COLOR', '1');
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    nock.cleanAll();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    nock.cleanAll();
  });

  it('points at a likely opdl/sketch bug when the API is healthy', async () => {
    nock(BASE_URL).get('/api/health').reply(200, HEALTHY);
    await reportHealthAfterFailure({});
    expect(errSpy.mock.calls[0][0]).toMatch(/healthy/);
    expect(errSpy.mock.calls[0][0]).toMatch(/github\.com\/SableRaf\/opdl\/issues/);
  });

  it('points at an API issue when the API is unhealthy', async () => {
    nock(BASE_URL).get('/api/health').reply(503, { success: false });
    await reportHealthAfterFailure({});
    expect(errSpy.mock.calls[0][0]).toMatch(/OpenProcessing API/);
    expect(errSpy.mock.calls[0][0]).toMatch(/API issue/);
  });

  it('reports connectivity/outage when the API is unreachable', async () => {
    nock(BASE_URL).get('/api/health').replyWithError('ENOTFOUND');
    await reportHealthAfterFailure({});
    expect(errSpy.mock.calls[0][0]).toMatch(/Could not reach/);
  });

  it('stays silent when --quiet is set', async () => {
    await reportHealthAfterFailure({ quiet: true });
    expect(errSpy).not.toHaveBeenCalled();
  });
});
