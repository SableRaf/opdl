import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createOpMetadata } from '../src/metadataWriter';

describe('metadataWriter', () => {
  const testDir = path.join(__dirname, 'test-metadata-output');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createOpMetadata', () => {
    it('should create OPENPROCESSING.md with complete sketch information', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Amazing Sketch',
        author: 'Test Author',
        isFork: false,
        files: [
          { name: 'image1.png' },
          { name: 'image2.jpg' },
        ],
        libraries: [],
        metadata: {
          title: 'Amazing Sketch',
          fullname: 'Test Author',
          license: 'by',
          description: 'This is a test sketch description.',
          createdOn: '2024-01-15T10:00:00Z',
          updatedOn: '2024-01-20T15:30:00Z',
          mode: 'p5js',
          engineURL: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js',
          tags: ['art', 'generative', 'animation'],
          libraries: [
            { url: 'https://example.com/lib1.js' },
            { url: 'https://example.com/lib2.js' },
          ],
        },
      };

      createOpMetadata(sketchInfo, testDir);

      const mdPath = path.join(testDir, 'OPENPROCESSING.md');
      expect(fs.existsSync(mdPath)).toBe(true);

      const content = fs.readFileSync(mdPath, 'utf8');

      expect(content).toContain('# Amazing Sketch');
      expect(content).toContain('**Author:** Test Author');
      expect(content).toContain('**OpenProcessing URL:** https://openprocessing.org/sketch/12345');
      expect(content).toContain('**License:** by');
      expect(content).toContain('This is a test sketch description.');
      expect(content).toContain('**Created:** 2024-01-15T10:00:00Z');
      expect(content).toContain('**Last Updated:** 2024-01-20T15:30:00Z');
      expect(content).toContain('**Mode:** p5js');
      expect(content).toContain('**Engine:** https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js');
      expect(content).toContain('## Assets');
      expect(content).toContain('- image1.png');
      expect(content).toContain('- image2.jpg');
      expect(content).toContain('## Libraries');
      expect(content).toContain('- https://example.com/lib1.js');
      expect(content).toContain('- https://example.com/lib2.js');
      expect(content).toContain('## Tags');
      expect(content).toContain('art, generative, animation');
      expect(content).toContain('Downloaded with [opdl]');
    });

    it('should handle fork information correctly', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Forked Sketch',
        author: 'Forker',
        isFork: true,
        parent: {
          sketchID: 67890,
          title: 'Original Sketch',
          author: 'Original Author',
        },
        files: [],
        metadata: {
          license: 'by-sa',
          description: 'A fork of an amazing sketch.',
          mode: 'processingjs',
        },
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('## Fork Information');
      expect(content).toContain('This sketch is a fork of [Original Sketch](https://openprocessing.org/sketch/67890) by Original Author');
    });

    it('should handle sketches with no assets', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'No Assets',
        author: 'Author',
        files: [],
        metadata: {},
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('## Assets');
      expect(content).toContain('None');
    });

    it('should handle sketches with no libraries', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'No Libraries',
        author: 'Author',
        files: [],
        metadata: {
          libraries: [],
        },
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('## Libraries');
      expect(content).toContain('None');
    });

    it('should handle sketches with no tags', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'No Tags',
        author: 'Author',
        files: [],
        metadata: {
          tags: [],
        },
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('## Tags');
      expect(content).toContain('None');
    });

    it('should use fallback values for missing metadata', () => {
      const sketchInfo = {
        sketchId: 12345,
        files: [],
        metadata: {},
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('# Untitled');
      expect(content).toContain('**Author:** Unknown');
      expect(content).toContain('**License:** Not specified');
      expect(content).toContain('No description provided.');
      expect(content).toContain('**Created:** N/A');
      expect(content).toContain('**Last Updated:** N/A');
      expect(content).toContain('**Mode:** Unknown');
      expect(content).toContain('**Engine:** N/A');
    });

    it('should handle libraries from metadata.libraries', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        files: [],
        metadata: {
          libraries: [
            { url: 'https://lib1.com/lib.js' },
            { url: 'https://lib2.com/lib.js' },
          ],
        },
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('- https://lib1.com/lib.js');
      expect(content).toContain('- https://lib2.com/lib.js');
    });

    it('should handle libraries from sketchInfo.libraries fallback', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        files: [],
        libraries: [
          { url: 'https://lib3.com/lib.js' },
        ],
        metadata: {},
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('- https://lib3.com/lib.js');
    });

    it('should handle assets without names', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        files: [
          { name: 'file1.png' },
          {},
          { name: 'file2.jpg' },
        ],
        metadata: {},
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      expect(content).toContain('- file1.png');
      expect(content).toContain('- Unnamed asset');
      expect(content).toContain('- file2.jpg');
    });

    it('should include download date', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        files: [],
        metadata: {},
      };

      createOpMetadata(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'OPENPROCESSING.md'), 'utf8');

      const today = new Date().toISOString().split('T')[0];
      expect(content).toContain(`Downloaded with [opdl](https://github.com/nestofbirbs/openprocessing-downloader) on ${today}`);
    });

    it('should respect quiet option and not throw on errors', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        files: [],
        metadata: {},
      };

      const invalidDir = '/invalid/path/that/does/not/exist';
      expect(() => createOpMetadata(sketchInfo, invalidDir, { quiet: true })).not.toThrow();
    });
  });
});
