import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import { downloadSketch } from '../../src/download/downloader';

describe('downloader', () => {
  const testDir = path.join(__dirname, 'test-download-output');

  function cleanupTestArtifacts() {
    const baseDir = path.dirname(testDir);
    const baseName = path.basename(testDir);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(`${testDir}.opdownload`)) {
      fs.rmSync(`${testDir}.opdownload`, { recursive: true, force: true });
    }
    // Clean up any backup dirs
    try {
      const entries = fs.readdirSync(baseDir);
      for (const entry of entries) {
        if (entry.startsWith(`${baseName}.opdold-`) || entry.startsWith(`${baseName}.opdownload-`) || entry === `${baseName}.opdlock`) {
          fs.rmSync(path.join(baseDir, entry), { recursive: true, force: true });
        }
      }
    } catch (e) {
      // ignore if baseDir doesn't exist
    }
  }

  beforeEach(() => {
    nock.cleanAll();
    cleanupTestArtifacts();
  });

  afterEach(() => {
    nock.cleanAll();
    cleanupTestArtifacts();
  });

  describe('downloadSketch', () => {
    it('should download sketch with code files under sketch/<name>/', async () => {
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
      expect(result.sketchName).toBe('sketch');
      expect(result.sketchDir).toBe(path.join(testDir, 'sketch', 'sketch'));
      expect(fs.existsSync(path.join(result.sketchDir, 'sketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(result.sketchDir, 'helpers.js'))).toBe(true);

      const sketchContent = fs.readFileSync(path.join(result.sketchDir, 'sketch.js'), 'utf8');
      expect(sketchContent).toBe('console.log("test");');
    });

    it('keeps metadata/, LICENSE, OPENPROCESSING.md at the top-level outputDir', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [{ title: 'sketch.js', code: 'x' }],
        files: [],
        metadata: { mode: 'p5js', license: 'by' },
      };

      await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: true,
        downloadThumbnail: false,
        createLicenseFile: true,
        createOpMetadata: true,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(testDir, 'metadata', 'metadata.json'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'LICENSE'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'OPENPROCESSING.md'))).toBe(true);
      // Not duplicated inside sketch/
      expect(fs.existsSync(path.join(testDir, 'sketch', 'sketch', 'LICENSE'))).toBe(false);
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        addSourceComments: true,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
      });

      const content = fs.readFileSync(path.join(result.sketchDir, 'sketch.js'), 'utf8');
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        addSourceComments: true,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
      });

      const content = fs.readFileSync(path.join(result.sketchDir, 'sketch.js'), 'utf8');
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'mysketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(result.sketchDir, 'filename.js'))).toBe(true);
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'mysketch.js'))).toBe(true);
      expect(result.sketchName).toBe('mysketch');
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'image.png'))).toBe(true);
    });

    describe('uploaded file vs code object name collision', () => {
      const codeHtml = '<script src="mySketch.js"></script>';
      const uploadHtml = '<script src="sketch.js"></script>';

      const makeSketchInfo = () => ({
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'index.html', code: codeHtml },
          { title: 'mySketch.js', code: 'console.log("test");' },
        ],
        files: [{ name: 'index.html' }],
        metadata: { mode: 'html', fileBase: 'https://example.com/assets' },
      });

      const baseOptions = {
        outputDir: testDir,
        downloadAssets: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      };

      it('keeps both by renaming the uploaded file (default)', async () => {
        nock('https://example.com').get('/assets/index.html').reply(200, uploadHtml);

        const result = await downloadSketch(makeSketchInfo(), {
          ...baseOptions,
          onFilenameConflict: async () => 'keep-both',
        });

        // Code object keeps the canonical name; upload lands under index_2.html.
        expect(fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8')).toBe(codeHtml);
        expect(fs.readFileSync(path.join(result.sketchDir, 'index_2.html'), 'utf8')).toBe(uploadHtml);
      });

      it('skips the uploaded file when asked', async () => {
        const upload = nock('https://example.com')
          .get('/assets/index.html')
          .reply(200, uploadHtml);

        const result = await downloadSketch(makeSketchInfo(), {
          ...baseOptions,
          onFilenameConflict: async () => 'skip-upload',
        });

        expect(fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8')).toBe(codeHtml);
        expect(fs.existsSync(path.join(result.sketchDir, 'index_2.html'))).toBe(false);
        // Skipped before fetching.
        expect(upload.isDone()).toBe(false);
        nock.cleanAll();
      });

      it('overwrites the code object when asked', async () => {
        nock('https://example.com').get('/assets/index.html').reply(200, uploadHtml);

        const result = await downloadSketch(makeSketchInfo(), {
          ...baseOptions,
          onFilenameConflict: async () => 'overwrite-code',
        });

        expect(fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8')).toBe(uploadHtml);
        expect(fs.existsSync(path.join(result.sketchDir, 'index_2.html'))).toBe(false);
      });

      it('is not triggered when names do not collide', async () => {
        let called = false;
        nock('https://example.com').get('/assets/data.json').reply(200, '{}');

        const info = makeSketchInfo();
        info.files = [{ name: 'data.json' }];

        const result = await downloadSketch(info, {
          ...baseOptions,
          onFilenameConflict: async () => {
            called = true;
            return 'keep-both';
          },
        });

        expect(called).toBe(false);
        expect(fs.existsSync(path.join(result.sketchDir, 'data.json'))).toBe(true);
      });

      it('rewrites code references to the collision-renamed asset (keep-both)', async () => {
        // A code object named data.json and an uploaded asset data.json that
        // the sketch code references: keep-both renames the asset to
        // data_2.json, and the code reference must follow it — not keep
        // pointing at data.json (which is now the code object, not the asset).
        nock('https://example.com').get('/assets/data.json').reply(200, 'ASSET_BYTES');

        const sketchInfo = {
          sketchId: 12345,
          title: 'Test',
          author: 'Author',
          codeParts: [
            { title: 'sketch.js', code: 'loadJSON("data.json");' },
            { title: 'data.json', code: '{"fromCodeObject":true}' },
          ],
          files: [{ name: 'data.json' }],
          metadata: { mode: 'p5js', fileBase: 'https://example.com/assets' },
        };

        const result = await downloadSketch(sketchInfo, {
          ...baseOptions,
          onFilenameConflict: async () => 'keep-both',
        });

        // Asset landed under the deduped name; code object kept data.json.
        expect(fs.readFileSync(path.join(result.sketchDir, 'data_2.json'), 'utf8')).toBe('ASSET_BYTES');
        expect(fs.readFileSync(path.join(result.sketchDir, 'data.json'), 'utf8')).toBe('{"fromCodeObject":true}');
        // The code reference points at the renamed asset, not the pre-collision name.
        const js = fs.readFileSync(path.join(result.sketchDir, 'sketch.js'), 'utf8');
        expect(js).toContain('loadJSON("data_2.json");');
        expect(js).not.toContain('loadJSON("data.json");');
      });
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'image.png'))).toBe(false);
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
      expect(metadata.author).toBe('Author');
    });

    it('should download thumbnail when enabled', async () => {
      nock('https://kyoko.openprocessing.org')
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'index.html'))).toBe(true);
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      const indexFiles = fs.readdirSync(result.sketchDir).filter(f => f === 'index.html');
      expect(indexFiles.length).toBe(1);
      expect(fs.existsSync(path.join(result.sketchDir, 'style.css'))).toBe(false);
    });

    it('should not overwrite an existing index.html code part for non-html mode', async () => {
      const originalHtml = '<html><body>user index</body></html>';
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'index.html', code: originalHtml },
        ],
        files: [],
        metadata: {
          mode: 'p5js',
          engineURL: 'https://example.com/p5.js',
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

      const content = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(content).toBe(originalHtml);
      expect(fs.existsSync(path.join(result.sketchDir, 'style.css'))).toBe(false);
    });

    it('should not write default style.css when a user CSS code part exists', async () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        codeParts: [
          { title: 'sketch.js', code: 'test' },
          { title: 'theme.css', code: 'body { color: red; }' },
        ],
        files: [],
        metadata: {
          mode: 'p5js',
          engineURL: 'https://example.com/p5.js',
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

      expect(fs.existsSync(path.join(result.sketchDir, 'index.html'))).toBe(true);
      const themeContent = fs.readFileSync(path.join(result.sketchDir, 'theme.css'), 'utf8');
      expect(themeContent).toBe('body { color: red; }');
      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('href="theme.css"');
      expect(html).not.toContain('href="style.css"');
    });

    it('should write default style.css for non-html mode sketches', async () => {
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

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });

      expect(fs.existsSync(path.join(result.sketchDir, 'style.css'))).toBe(true);
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

      const resultPromise = downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        quiet: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });
      await expect(resultPromise).resolves.toBeDefined();
      const result = await resultPromise;

      expect(fs.existsSync(path.join(result.sketchDir, 'image.png'))).toBe(false);
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

      const resultPromise = downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: true,
        quiet: true,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: false,
      });
      await expect(resultPromise).resolves.toBeDefined();
      const result = await resultPromise;

      expect(fs.existsSync(path.join(result.sketchDir, 'valid.png'))).toBe(true);
    });
  });

  describe('root-level code-file collisions', () => {
    it('writes the second colliding part as name_2.js instead of overwriting', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [
          { title: 'sketch.js', code: 'one' },
          { title: 'sketch.js', code: 'two' },
        ],
        files: [],
        metadata: { mode: 'p5js' },
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

      expect(fs.readFileSync(path.join(result.sketchDir, 'sketch.js'), 'utf8')).toBe('one');
      expect(fs.readFileSync(path.join(result.sketchDir, 'sketch_2.js'), 'utf8')).toBe('two');
    });
  });

  describe('pjs sketches', () => {
    it('writes .pde tabs, names the folder after the main .pde, no sketch.properties', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [
          { title: 'MySketch', code: 'void setup() {}' },
        ],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      expect(result.sketchName).toBe('MySketch');
      expect(result.sketchDir).toBe(path.join(testDir, 'sketch', 'MySketch'));
      expect(fs.existsSync(path.join(result.sketchDir, 'MySketch.pde'))).toBe(true);
      expect(fs.existsSync(path.join(result.sketchDir, 'sketch.properties'))).toBe(false);

      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('data-processing-sources="MySketch.pde"');
      expect(html).not.toContain('<script src="MySketch.pde">');
    });

    it('accepts the processingjs alias identically to pjs', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: 'Main', code: 'void setup() {}' }],
        files: [],
        metadata: { mode: 'processingjs', engineURL: 'https://example.com/processing.js' },
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

      expect(fs.existsSync(path.join(result.sketchDir, 'Main.pde'))).toBe(true);
    });

    it('falls back to sketch.pde when the title sanitizes to nothing', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: '***', code: 'void setup() {}' }],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      expect(result.sketchName).toBe('sketch');
      expect(fs.existsSync(path.join(result.sketchDir, 'sketch.pde'))).toBe(true);
    });

    it('does not let a dot-segment title ("..") escape the nested sketch directory', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: '..', code: 'void setup() {}' }],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      // The sketch dir must stay nested — never collapse up to outputDir.
      expect(result.sketchName).toBe('sketch');
      expect(result.sketchDir).toBe(path.join(testDir, 'sketch', 'sketch'));
      expect(path.resolve(result.sketchDir).startsWith(path.resolve(testDir, 'sketch') + path.sep)).toBe(true);
      expect(fs.existsSync(path.join(result.sketchDir, 'sketch.pde'))).toBe(true);
      // Bookkeeping must not be clobbered by code landing at outputDir.
      expect(fs.existsSync(path.join(testDir, 'sketch.pde'))).toBe(false);
    });

    it('picks the main .pde when tab 0 is an explicit .js/index.html/.css', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [
          { title: 'helper.js', code: 'x' },
          { title: 'Main', code: 'void setup() {}' },
        ],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      expect(result.sketchName).toBe('Main');
      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('<script src="helper.js"></script>');
      expect(html).toContain('data-processing-sources="Main.pde"');
    });

    it('lists all .pde files in tab order on the canvas', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [
          { title: 'a', code: 'void setup() {}' },
          { title: 'b', code: 'void draw() {}' },
        ],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('data-processing-sources="a.pde b.pde"');
    });

    it('falls back to plain <script src> wiring with a warning when there are no .pde tabs', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: 'sketch.js', code: 'x' }],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      expect(result.sketchName).toBe('sketch');
      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('<script src="sketch.js"></script>');
      expect(html).not.toContain('data-processing-sources');
    });

    it('adds .pde attribution comments (C-style)', async () => {
      const sketchInfo = {
        sketchId: 42,
        title: 'Test Sketch',
        author: 'Author',
        codeParts: [{ title: 'Main', code: 'void setup() {}' }],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
      };

      const result = await downloadSketch(sketchInfo, {
        outputDir: testDir,
        downloadAssets: false,
        saveMetadata: false,
        downloadThumbnail: false,
        createLicenseFile: false,
        createOpMetadata: false,
        addSourceComments: true,
      });

      const content = fs.readFileSync(path.join(result.sketchDir, 'Main.pde'), 'utf8');
      expect(content).toContain('/*');
      expect(content).toContain('Downloaded with opdl');
    });
  });

  describe('prepass collision handling', () => {
    it('two tabs resolving to the same pde name dedupe consistently between the predicted list and disk', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [
          { title: 'Main', code: 'void setup() {}' },
          { title: 'Main', code: 'void draw() {}' },
        ],
        files: [],
        metadata: { mode: 'pjs', engineURL: 'https://example.com/processing.js' },
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

      expect(result.sketchName).toBe('Main');
      expect(fs.readFileSync(path.join(result.sketchDir, 'Main.pde'), 'utf8')).toContain('setup');
      expect(fs.readFileSync(path.join(result.sketchDir, 'Main_2.pde'), 'utf8')).toContain('draw');
      const html = fs.readFileSync(path.join(result.sketchDir, 'index.html'), 'utf8');
      expect(html).toContain('data-processing-sources="Main.pde Main_2.pde"');
    });
  });

  describe('tutorial bundle wiring', () => {
    it('produces tutorial/ tree when sketchInfo.tutorial is present', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: 'sketch.js', code: 'main' }],
        files: [],
        metadata: { mode: 'p5js' },
        tutorial: {
          tutorial: { tutorialMode: 'normal', totalPages: 1, totalPagesRaw: 1 },
          pages: [{
            pageNumber: 1,
            markdown: '# Page',
            codeObjects: [{ title: 'mySketch.js', code: 'page code' }],
          }],
          failedPages: [],
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

      // Tutorial bundle keeps its current layout at outputDir, out of scope for nesting.
      expect(fs.existsSync(path.join(testDir, 'tutorial/page_1/README.md'))).toBe(true);
      expect(fs.readFileSync(path.join(testDir, 'tutorial/page_1/mySketch.js'), 'utf8')).toBe('page code');
    });

    it('produces no tutorial/ tree when sketchInfo.tutorial is absent', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: 'sketch.js', code: 'main' }],
        files: [],
        metadata: { mode: 'p5js' },
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

      expect(fs.existsSync(path.join(testDir, 'tutorial'))).toBe(false);
    });
  });

  describe('return contract', () => {
    it('returns { outputDir, metadataDir, sketchDir, sketchName, codeFiles }', async () => {
      const sketchInfo = {
        sketchId: 1,
        title: 'T',
        author: 'A',
        codeParts: [{ title: 'sketch.js', code: 'x' }],
        files: [],
        metadata: { mode: 'p5js' },
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

      expect(result).toMatchObject({
        outputDir: testDir,
        metadataDir: path.join(testDir, 'metadata'),
        sketchDir: path.join(testDir, 'sketch', 'sketch'),
        sketchName: 'sketch',
      });
      expect(Array.isArray(result.codeFiles)).toBe(true);
    });
  });

  describe('staging and promotion', () => {
    const info = { sketchId: 1, metadata: { mode: 'html' }, files: [],
      codeParts: [{ title: 'main.js', code: 'complete' }] };
    const options = { outputDir: testDir, quiet: true };
    const artifacts = () => fs.readdirSync(path.dirname(testDir))
      .filter(name => name.startsWith(path.basename(testDir) + '.opdownload-'));

    it('leaves unrelated unfinished downloads untouched', async () => {
      const leftover = `${testDir}.opdownload-old`;
      fs.mkdirSync(leftover);
      fs.writeFileSync(path.join(leftover, 'partial'), 'unfinished');
      await downloadSketch(info, options);
      expect(fs.readFileSync(path.join(leftover, 'partial'), 'utf8')).toBe('unfinished');
      expect(artifacts()).toEqual([path.basename(leftover)]);
    });

    it('keeps failed downloads visibly temporary and leaves the destination absent', async () => {
      await expect(downloadSketch({ ...info, codeParts: [info.codeParts[0],
        { title: 'bad.js', code: 42 }] }, options)).rejects.toThrow();
      expect(fs.existsSync(testDir)).toBe(false);
      expect(artifacts()).toHaveLength(1);
    });

    it('skips existing destinations by default without touching local files', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'keep');
      expect((await downloadSketch(info, options)).skipped).toBe(true);
      expect(fs.readFileSync(path.join(testDir, 'local'), 'utf8')).toBe('keep');
      expect(artifacts()).toEqual([]);
    });

    it('rejects merge instead of following existing symlinks', async () => {
      fs.mkdirSync(testDir);
      await expect(downloadSketch(info, { ...options, conflictPolicy: 'merge' })).rejects.toThrow(/policy/i);
      expect(artifacts()).toEqual([]);
    });

    it('preserves the old destination when replacement fails before promotion', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'keep');
      await expect(downloadSketch({ ...info, codeParts: [{ title: 'bad.js', code: 42 }] },
        { ...options, overwrite: true })).rejects.toThrow();
      expect(fs.readFileSync(path.join(testDir, 'local'), 'utf8')).toBe('keep');
    });

    it('restores the backup when promotion fails', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'keep');
      const rename = fs.renameSync;
      const spy = vi.spyOn(fs, 'renameSync').mockImplementation((src, dest) => {
        if (src.includes('.opdownload-')) throw new Error('promotion failed');
        return rename(src, dest);
      });
      try {
        await expect(downloadSketch(info, { ...options, overwrite: true })).rejects.toThrow(/promotion failed/);
        expect(fs.readFileSync(path.join(testDir, 'local'), 'utf8')).toBe('keep');
      } finally { spy.mockRestore(); }
    });

    it('replaces only after completion and cleans its own artifacts', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'old');
      const result = await downloadSketch(info, { ...options, overwrite: true });
      expect(fs.existsSync(path.join(testDir, 'local'))).toBe(false);
      expect(fs.readFileSync(result.codeFiles[0], 'utf8')).toBe('complete');
      expect(artifacts()).toEqual([]);
      expect(fs.existsSync(`${testDir}.opdlock`)).toBe(false);
      expect(fs.readdirSync(path.dirname(testDir))
        .filter(name => name.startsWith(path.basename(testDir) + '.opdold-'))).toEqual([]);
    });

    it('reports and preserves the backup when restoration also fails', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'keep');
      const rename = fs.renameSync;
      const spy = vi.spyOn(fs, 'renameSync').mockImplementation((src, dest) => {
        if (dest === testDir) throw new Error('rename blocked');
        return rename(src, dest);
      });
      try {
        await expect(downloadSketch(info, { ...options, overwrite: true }))
          .rejects.toThrow(/Previous download preserved at .*original; restore it manually/);
        const backup = fs.readdirSync(path.dirname(testDir))
          .find(name => name.startsWith(path.basename(testDir) + '.opdold-'));
        expect(fs.readFileSync(path.join(path.dirname(testDir), backup, 'original', 'local'), 'utf8')).toBe('keep');
        expect(artifacts()).toHaveLength(1);
      } finally { spy.mockRestore(); }
    });

    it('preserves an existing promotion lock and destination', async () => {
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, 'local'), 'keep');
      fs.mkdirSync(`${testDir}.opdlock`);
      await expect(downloadSketch(info, { ...options, overwrite: true }))
        .rejects.toThrow(/Promotion blocked/);
      expect(fs.existsSync(`${testDir}.opdlock`)).toBe(true);
      expect(fs.readFileSync(path.join(testDir, 'local'), 'utf8')).toBe('keep');
    });

    it('allows cancelling without creating temporary files', async () => {
      fs.mkdirSync(testDir);
      const result = await downloadSketch(info, { ...options, onConflict: async () => 'cancel' });
      expect(result.cancelled).toBe(true);
      expect(artifacts()).toEqual([]);
    });

    it('does not mix overlapping downloads to a fresh destination', async () => {
      const withAsset = code => ({ ...info, metadata: { mode: 'html', fileBase: 'https://assets.test/' },
        codeParts: [{ title: 'main.js', code }], files: [{ name: 'asset.txt' }] });
      nock('https://assets.test').get('/asset.txt').delay(50).reply(200, 'A');
      nock('https://assets.test').get('/asset.txt').reply(200, 'B');
      const results = await Promise.allSettled([
        downloadSketch(withAsset('A'), options), downloadSketch(withAsset('B'), options),
      ]);
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      const dir = path.join(testDir, 'sketch', 'main');
      expect(fs.readFileSync(path.join(dir, 'main.js'), 'utf8'))
        .toBe(fs.readFileSync(path.join(dir, 'asset.txt'), 'utf8'));
    });
  });
});
