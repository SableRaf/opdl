import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import { downloadSketch } from '../../src/download/downloader';

describe('downloader', () => {
  const testDir = path.join(__dirname, 'test-download-output');

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

  describe('downloadSketch', () => {
    it('should download sketch with code files', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test Sketch',
        author: 'Test Author',
        codeParts: [
          { title: 'sketch.js', code: 'console.log("test");' },
          { title: 'helpers.js', code: 'function helper() {}' },
        ],
        files: [],
        metadata: {
          mode: 'p5js',
          license: 'by',
        },
      };

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(result.outputDir).toBe(testDir);
      expect(fs.existsSync(path.join(testDir, 'sketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'helpers.js'))).toBe(true);

      const sketchContent = fs.readFileSync(path.join(testDir, 'sketch.js'), 'utf8');
      expect(sketchContent).toBe('console.log("test");');
    });

    it('should add source comments when enabled', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test Sketch',
        author: 'Test Author',
        codeParts: [
          { title: 'sketch.js', code: 'console.log("test");' },
        ],
        files: [],
        metadata: {
          license: 'by',
        },
        isFork: false,
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        addSourceComments: true,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
      });

      const content = fs.readFileSync(path.join(testDir, 'sketch.js'), 'utf8');
      expect(content).toContain('Downloaded with opdl');
      expect(content).toContain('Title: Test Sketch');
      expect(content).toContain('Author: Test Author');
      expect(content).toContain('console.log("test");');
    });

    it('should not add duplicate source comments', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'sketch.js', code: '/* Downloaded with opdl */\nconsole.log("test");' },
        ],
        files: [],
        metadata: {},
        isFork: false,
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        addSourceComments: true,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
      });

      const content = fs.readFileSync(path.join(testDir, 'sketch.js'), 'utf8');
      const matches = content.match(/Downloaded with opdl/g);
      expect(matches).toHaveLength(1);
    });

    it('should sanitize code filenames', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'my<sketch>.js', code: 'test' },
          { title: 'file:name.js', code: 'test' },
        ],
        files: [],
        metadata: {},
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'mysketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'filename.js'))).toBe(true);
    });

    it('should add .js extension to files without extension', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'mysketch', code: 'test' },
        ],
        files: [],
        metadata: {},
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'mysketch.js'))).toBe(true);
    });

    it('should download assets when enabled', async () => {
      nock('https://example.com')
        .get('/assets/image.png')
        .reply(200, Buffer.from('fake-image-data'));

      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [
          { name: 'image.png' },
        ],
        metadata: {
          fileBase: 'https://example.com/assets',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'image.png'))).toBe(true);
    });

    it('should skip assets when downloadAssets is false', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [
          { name: 'image.png' },
        ],
        metadata: {
          fileBase: 'https://example.com/assets',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'image.png'))).toBe(false);
    });

    it('should save metadata when enabled', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [],
        metadata: {
          title: 'Test',
          mode: 'p5js',
          license: 'by',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: true,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      const metadataPath = path.join(testDir, 'metadata', 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      expect(metadata.title).toBe('Test');
      expect(metadata.mode).toBe('p5js');
    });

    it('should download thumbnail when enabled', async () => {
      nock('https://openprocessing-usercontent.s3.amazonaws.com')
        .get('/thumbnails/visualThumbnail999@2x.jpg')
        .reply(200, Buffer.from('fake-thumbnail'));

      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [],
        metadata: {
          visualID: 999,
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: true,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      const thumbnailPath = path.join(testDir, 'metadata', 'thumbnail.jpg');
      expect(fs.existsSync(thumbnailPath)).toBe(true);
    });

    it('should generate index.html for non-html mode sketches', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'sketch.js', code: 'test' },
        ],
        files: [],
        metadata: {
          mode: 'p5js',
          engineURL: 'https://example.com/p5.js',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'index.html'))).toBe(true);
    });

    it('should not generate index.html for html mode sketches', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'index.html', code: '<html></html>' },
        ],
        files: [],
        metadata: {
          mode: 'html',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      const indexFiles = fs.readdirSync(testDir).filter(f => f === 'index.html');
      expect(indexFiles.length).toBe(1);
    });

    it('should create LICENSE file when enabled', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [],
        metadata: {
          license: 'by',
        },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: true,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'LICENSE'))).toBe(true);
    });

    it('should create OPENPROCESSING.md when enabled', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [],
        metadata: {},
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: true,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'OPENPROCESSING.md'))).toBe(true);
    });

    it('should use default output directory when not specified', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'sketch.js', code: 'test' },
        ],
        files: [],
        metadata: {},
      };

      const result = await downloadSketch(sketchInfo, {
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(result.outputDir).toContain('sketch_12345');
      expect(fs.existsSync(result.outputDir)).toBe(true);

      if (fs.existsSync(result.outputDir)) {
        fs.rmSync(result.outputDir, { recursive: true, force: true });
      }
    });

    it('should handle asset download failures gracefully', async () => {
      nock('https://example.com')
        .get('/assets/image.png')
        .reply(404);

      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [
          { name: 'image.png' },
        ],
        metadata: {
          fileBase: 'https://example.com/assets',
        },
      };

      await expect(downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        quiet: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      })).resolves.toBeDefined();

      expect(fs.existsSync(path.join(testDir, 'image.png'))).toBe(false);
    });

    it('should handle missing fileBase gracefully', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [
          { name: 'image.png' },
        ],
        metadata: {},
      };

      await expect(downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        quiet: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      })).resolves.toBeDefined();
    });

    it('should handle assets without names', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [],
        files: [
          {},
          { name: 'valid.png' },
        ],
        metadata: {
          fileBase: 'https://example.com',
        },
      };

      nock('https://example.com')
        .get('/valid.png')
        .reply(200, Buffer.from('data'));

      await expect(downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        quiet: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      })).resolves.toBeDefined();

      expect(fs.existsSync(path.join(testDir, 'valid.png'))).toBe(true);
    });
  });
});
