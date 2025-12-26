import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import opdl from '../src/index.js';

describe('opdl (integration)', () => {
  const testDir = path.join(__dirname, 'tmp');

  beforeEach(() => {
    nock.cleanAll();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    nock.cleanAll();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return error for invalid sketch ID', async () => {
    const result = await opdl(null);

    expect(result.success).toBe(false);
    expect(result.sketchInfo.error).toBe('Invalid sketch ID');
  });

  it('should handle sketch with API errors', async () => {
    const sketchId = 99999;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, { success: false, message: 'Not found' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, { success: false, message: 'Not found' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, { success: false, message: 'Not found' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, { success: false, message: 'Not found' });

    const result = await opdl(sketchId, { outputDir: testDir, quiet: true });

    expect(result.sketchInfo.error).toBeTruthy();
    expect(result.sketchInfo.error).toContain('Not found');
  });

  it('should handle hidden code sketches', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Hidden Sketch',
        mode: 'p5js',
        userID: 100,
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Test Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, {
        success: false,
        message: 'Sketch source code is hidden.',
      });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, { quiet: true });

    expect(result.success).toBe(false);
    expect(result.sketchInfo.title).toBe('Hidden Sketch');
    expect(result.sketchInfo.author).toBe('Test Author');
    expect(result.outputPath).toBeNull();
  });

  it('should successfully download a p5js sketch', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Test P5 Sketch',
        mode: 'p5js',
        userID: 100,
        license: 'by',
        engineURL: 'https://cdn.com/p5.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Test Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'sketch.js', code: 'function setup() {}' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadAssets: false,
      downloadThumbnail: false,
      quiet: true,
    });

    expect(result.success).toBe(true);
    expect(result.sketchInfo.title).toBe('Test P5 Sketch');
    expect(result.sketchInfo.author).toBe('Test Author');
    expect(result.sketchInfo.mode).toBe('p5js');
    expect(result.sketchInfo.isFork).toBe(false);
    expect(result.outputPath).toBe(testDir);

    expect(fs.existsSync(path.join(testDir, 'sketch.js'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'LICENSE'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'OPENPROCESSING.md'))).toBe(true);
  });

  it('should successfully download a processingjs sketch', async () => {
    const sketchId = 67890;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Processing Sketch',
        mode: 'processingjs',
        userID: 200,
        license: 'by-sa',
        engineURL: '/static/js/processing.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/user/200`)
      .reply(200, { fullname: 'Processing Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'mysketch', code: 'void setup() {}' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadAssets: false,
      downloadThumbnail: false,
      quiet: true,
    });

    expect(result.success).toBe(true);
    expect(result.sketchInfo.mode).toBe('processingjs');
    expect(fs.existsSync(path.join(testDir, 'mysketch.js'))).toBe(true);
  });

  it('should handle fork sketches', async () => {
    const sketchId = 12345;
    const parentId = 67890;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Forked Sketch',
        mode: 'p5js',
        userID: 100,
        parentID: parentId,
        engineURL: 'https://cdn.com/p5.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${parentId}`)
      .reply(200, {
        title: 'Original Sketch',
        userID: 200,
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Forker' });

    nock('https://openprocessing.org')
      .get(`/api/user/200`)
      .reply(200, { fullname: 'Original Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'sketch.js', code: 'function setup() {}' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadAssets: false,
      downloadThumbnail: false,
      quiet: true,
    });

    expect(result.success).toBe(true);
    expect(result.sketchInfo.isFork).toBe(true);

    const codeContent = fs.readFileSync(path.join(testDir, 'sketch.js'), 'utf8');
    expect(codeContent).toContain('Forked from: Original Sketch by Original Author');

    const opMd = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');
    expect(opMd).toContain('Fork Information');
  });

  it('should download sketches with assets', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Sketch with Assets',
        mode: 'p5js',
        userID: 100,
        fileBase: 'https://assets.example.com/sketch',
        engineURL: 'https://cdn.com/p5.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'sketch.js', code: 'loadImage("image.png");' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, [
        { name: 'image.png' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    nock('https://assets.example.com')
      .get('/sketch/image.png')
      .reply(200, Buffer.from('fake-image-data'));

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadAssets: true,
      downloadThumbnail: false,
      quiet: true,
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'image.png'))).toBe(true);
  });

  it('should use default options when none provided', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Default Options Sketch',
        mode: 'p5js',
        userID: 100,
        visualID: 999,
        engineURL: 'https://cdn.com/p5.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'sketch.js', code: 'test' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing-usercontent.s3.amazonaws.com')
      .get('/thumbnails/visualThumbnail999@2x.jpg')
      .reply(200, Buffer.from('thumbnail'));

    const result = await opdl(sketchId);

    expect(result.success).toBe(true);

    const outputPath = result.outputPath;
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'sketch.js'))).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'LICENSE'))).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'OPENPROCESSING.md'))).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'metadata', 'metadata.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputPath, 'metadata', 'thumbnail.jpg'))).toBe(true);

    const codeContent = fs.readFileSync(path.join(outputPath, 'sketch.js'), 'utf8');
    expect(codeContent).toContain('Downloaded with opdl');

    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
  });

  it('should handle different license types correctly', async () => {
    const licenses = ['by', 'by-sa', 'by-nc', 'by-nc-sa', 'by-nd', 'by-nc-nd'];

    for (const license of licenses) {
      nock.cleanAll();
      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(200, {
          title: 'Test',
          mode: 'p5js',
          userID: 100,
          license: license,
          engineURL: 'https://cdn.com/p5.js',
        });

      nock('https://openprocessing.org')
        .get(`/api/user/100`)
        .reply(200, { fullname: 'Author' });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(200, [
          { title: 'sketch.js', code: 'test' },
        ]);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(200, []);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(200, []);

      const result = await opdl(sketchId, {
        outputDir: testDir,
        downloadThumbnail: false,
        quiet: true,
      });

      expect(result.success).toBe(true);

      const licenseContent = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');
      expect(licenseContent).toContain('Creative Commons');

      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }
  });

  it('should handle html mode sketches correctly', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'HTML Sketch',
        mode: 'html',
        userID: 100,
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'index.html', code: '<html><body>Test</body></html>' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadThumbnail: false,
      quiet: true,
    });

    expect(result.success).toBe(true);

    const htmlFiles = fs.readdirSync(testDir).filter(f => f === 'index.html');
    expect(htmlFiles.length).toBe(1);
  });

  it('should respect all option flags', async () => {
    const sketchId = 12345;

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}`)
      .reply(200, {
        title: 'Test',
        mode: 'p5js',
        userID: 100,
        engineURL: 'https://cdn.com/p5.js',
      });

    nock('https://openprocessing.org')
      .get(`/api/user/100`)
      .reply(200, { fullname: 'Author' });

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/code`)
      .reply(200, [
        { title: 'sketch.js', code: 'test' },
      ]);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
      .reply(200, []);

    nock('https://openprocessing.org')
      .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
      .reply(200, []);

    const result = await opdl(sketchId, {
      outputDir: testDir,
      downloadAssets: false,
      downloadThumbnail: false,
      saveMetadata: false,
      addSourceComments: false,
      createLicenseFile: false,
      createOpMetadata: false,
      quiet: true,
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'sketch.js'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'LICENSE'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'OPENPROCESSING.md'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'metadata', 'metadata.json'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'metadata', 'thumbnail.jpg'))).toBe(false);

    const codeContent = fs.readFileSync(path.join(testDir, 'sketch.js'), 'utf8');
    expect(codeContent).not.toContain('Downloaded with opdl');
  });
});
