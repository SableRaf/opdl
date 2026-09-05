import {
  describe, it, beforeEach, afterEach, vi, expect,
} from 'vitest';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import { handleSketchCommand } from '../../../src/cli/commands/sketch.js';

const BASE_URL = 'https://openprocessing.org';

describe('handleSketchCommand - staged downloads', () => {
  const testDir = path.join(__dirname, '..', '..', 'tmp-sketch-cli-staging');
  let errorSpy;
  let logSpy;

  function cleanupTestArtifacts() {
    const baseDir = path.dirname(testDir);
    const baseName = path.basename(testDir);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(`${testDir}.opdownload`)) {
      fs.rmSync(`${testDir}.opdownload`, { recursive: true, force: true });
    }
    try {
      const entries = fs.readdirSync(baseDir);
      for (const entry of entries) {
        if (entry.startsWith(`${baseName}.opdold-`)) {
          fs.rmSync(path.join(baseDir, entry), { recursive: true, force: true });
        }
      }
    } catch {
      // baseDir may not exist yet
    }
  }

  beforeEach(() => {
    vi.stubEnv('OP_API_KEY', 'test-token');
    nock.cleanAll();
    cleanupTestArtifacts();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    nock.cleanAll();
    cleanupTestArtifacts();
  });

  function mockSuccessfulFetch() {
    nock(BASE_URL)
      .get('/api/sketch/12345')
      .reply(200, {
        title: 'Test Sketch',
        mode: 'p5js',
        userID: 100,
        license: 'by',
      });
    nock(BASE_URL).get('/api/user/100').reply(200, { fullname: 'Test Author' });
    nock(BASE_URL)
      .get('/api/sketch/12345/code')
      .reply(200, [{ title: 'sketch.js', code: 'function setup() {}' }]);
    nock(BASE_URL).get('/api/sketch/12345/files?limit=100&offset=0').reply(200, []);
    nock(BASE_URL).get('/api/sketch/12345/libraries?limit=100&offset=0').reply(200, []);
  }

  it('proceeds with a normal download when an unmarked backup is present', async () => {
    fs.mkdirSync(`${testDir}.opdold-9999-0`, { recursive: true });
    fs.writeFileSync(`${testDir}.opdold-9999-0/leftover.txt`, 'stale backup');

    mockSuccessfulFetch();

    await handleSketchCommand({
      subcommand: 'download',
      id: '12345',
      options: {
        outputDir: testDir, downloadAssets: false, downloadThumbnail: false, quiet: true,
      },
    });

    expect(fs.existsSync(testDir)).toBe(true);
    // The unmarked backup is left untouched, never auto-restored.
    expect(fs.existsSync(`${testDir}.opdold-9999-0`)).toBe(true);
    expect(fs.existsSync(`${testDir}.opdold-9999-0/leftover.txt`)).toBe(true);
  });
});
