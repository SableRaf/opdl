import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import nock from 'nock';
import { handleUserCommand } from '../../../src/cli/commands/user.js';

const BASE_URL = 'https://openprocessing.org';

describe('handleUserCommand - deprecation warning', () => {
  let warnSpy;

  beforeEach(() => {
    if (console._orig && console._orig.warn) {
      console.warn = console._orig.warn;
    }
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.stubEnv('OP_API_KEY', 'test-token');
    nock.cleanAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    nock.cleanAll();
  });

  it('warns when numeric id is used', async () => {
    nock(BASE_URL).get('/api/user/1').reply(200, { userID: 1, fullname: 'Test' });
    await handleUserCommand({ id: '1', subcommand: null, options: {} });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/deprecated/);
    expect(warnSpy.mock.calls[0][0]).toMatch(/@username|@Sableraph/);
  });

  it('does not warn when --quiet is set with numeric id', async () => {
    nock(BASE_URL).get('/api/user/1').reply(200, { userID: 1, fullname: 'Test' });
    await handleUserCommand({ id: '1', subcommand: null, options: { quiet: true } });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn for @username', async () => {
    nock(BASE_URL).get('/api/user/@Sableraph').reply(200, { userID: 1, fullname: 'Test' });
    await handleUserCommand({ id: '@Sableraph', subcommand: null, options: {} });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns on numeric id for subcommand sketches', async () => {
    nock(BASE_URL).get('/api/user/1/sketches').query(true).reply(200, []);
    await handleUserCommand({ id: '1', subcommand: 'sketches', options: {} });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/deprecated/);
  });

  it('warns on numeric id for subcommand followers', async () => {
    nock(BASE_URL).get('/api/user/1/followers').query(true).reply(200, []);
    await handleUserCommand({ id: '1', subcommand: 'followers', options: {} });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('warns on numeric id for subcommand following', async () => {
    nock(BASE_URL).get('/api/user/1/following').query(true).reply(200, []);
    await handleUserCommand({ id: '1', subcommand: 'following', options: {} });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
