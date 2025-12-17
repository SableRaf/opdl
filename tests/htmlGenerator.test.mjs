import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateIndexHtml } from '../src/htmlGenerator';

describe('htmlGenerator', () => {
  const testDir = path.join(__dirname, 'test-html-output');

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

  describe('generateIndexHtml', () => {
    it('should generate index.html with engine URL', () => {
      const metadata = {
        engineURL: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js',
      };

      generateIndexHtml(metadata, [], testDir);

      const htmlPath = path.join(testDir, 'index.html');
      expect(fs.existsSync(htmlPath)).toBe(true);

      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html lang="en">');
      expect(content).toContain('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js');
      expect(content).toContain('https://openprocessing.org/openprocessing_sketch.js');
    });

    it('should handle engine URL with leading slash', () => {
      const metadata = {
        engineURL: '/static/js/processingjs/processing.min.js',
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('https://openprocessing.org/static/js/processingjs/processing.min.js');
    });

    it('should include library script tags', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        libraries: [
          { url: 'https://lib1.com/lib1.js' },
          { url: 'https://lib2.com/lib2.js' },
        ],
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<script src="https://lib1.com/lib1.js"></script>');
      expect(content).toContain('<script src="https://lib2.com/lib2.js"></script>');
    });

    it('should include JavaScript files with .js extension', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'sketch.js' },
        { title: 'helpers.js' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<script src="sketch.js"></script>');
      expect(content).toContain('<script src="helpers.js"></script>');
    });

    it('should include JavaScript files without extension and add .js', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'mysketch' },
        { title: 'mycode' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<script src="mysketch.js"></script>');
      expect(content).toContain('<script src="mycode.js"></script>');
    });

    it('should include CSS files', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'style.css' },
        { title: 'theme.css' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<link rel="stylesheet" type="text/css" href="style.css">');
      expect(content).toContain('<link rel="stylesheet" type="text/css" href="theme.css">');
    });

    it('should handle mixed code parts (JS, CSS, no extension)', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        libraries: [
          { url: 'https://lib.com/lib.js' },
        ],
      };
      const codeParts = [
        { title: 'sketch.js' },
        { title: 'style.css' },
        { title: 'mycode' },
        { title: 'another.js' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<script src="https://lib.com/lib.js"></script>');
      expect(content).toContain('<script src="sketch.js"></script>');
      expect(content).toContain('<script src="another.js"></script>');
      expect(content).toContain('<script src="mycode.js"></script>');
      expect(content).toContain('<link rel="stylesheet" type="text/css" href="style.css">');
    });

    it('should handle empty code parts', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('https://example.com/engine.js');
    });

    it('should handle missing libraries', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).not.toContain('<script src="https://lib');
    });

    it('should handle engine URL with escaped backslashes', () => {
      const metadata = {
        engineURL: '\\/static\\/js\\/processing.min.js',
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('https://openprocessing.org/static/js/processing.min.js');
      expect(content).not.toContain('\\');
    });

    it('should create directory if it does not exist', () => {
      const newDir = path.join(testDir, 'nested', 'path');
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };

      expect(fs.existsSync(newDir)).toBe(false);
      generateIndexHtml(metadata, [], newDir);
      expect(fs.existsSync(path.join(newDir, 'index.html'))).toBe(true);
    });

    it('should generate valid HTML structure', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        libraries: [{ url: 'https://lib.com/lib.js' }],
      };
      const codeParts = [
        { title: 'sketch.js' },
        { title: 'style.css' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toMatch(/<!DOCTYPE html>/);
      expect(content).toMatch(/<html[^>]*>/);
      expect(content).toMatch(/<head>/);
      expect(content).toMatch(/<\/head>/);
      expect(content).toMatch(/<body>/);
      expect(content).toMatch(/<\/body>/);
      expect(content).toMatch(/<\/html>/);
      expect(content).toContain('<meta charset="utf-8"');
    });

    it('should filter out code parts without titles', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'sketch.js' },
        { title: null },
        { title: '' },
        { title: 'valid.js' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('sketch.js');
      expect(content).toContain('valid.js');
      const scriptMatches = content.match(/<script src=/g);
      expect(scriptMatches.length).toBe(4); // engine + openprocessing_sketch + sketch.js + valid.js
    });
  });
});
