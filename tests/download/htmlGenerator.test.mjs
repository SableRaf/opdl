import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateIndexHtml, DEFAULT_STYLESHEET, CENTERED_STYLESHEET } from '../../src/download/htmlGenerator';

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

    it('should write default style.css to outputDir', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };

      generateIndexHtml(metadata, [], testDir);

      const cssPath = path.join(testDir, 'style.css');
      expect(fs.existsSync(cssPath)).toBe(true);

      const css = fs.readFileSync(cssPath, 'utf8');
      expect(css).toBe(DEFAULT_STYLESHEET);
      expect(css).toContain('body {');
      expect(css).toContain('margin: 0;');
      expect(css).toContain('padding: 0;');
    });

    it('should write centering grey style.css in p5js mode', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        mode: 'p5js',
      };

      generateIndexHtml(metadata, [], testDir);

      const css = fs.readFileSync(path.join(testDir, 'style.css'), 'utf8');
      expect(css).toBe(CENTERED_STYLESHEET);
      expect(css).toContain('display: flex;');
      expect(css).toContain('align-items: center;');
      expect(css).toContain('justify-content: center;');
      expect(css).toContain('background: #808080;');
    });

    it('should write centering grey style.css in pjs (Processing.js) mode', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        mode: 'pjs',
      };

      generateIndexHtml(metadata, [], testDir);

      const css = fs.readFileSync(path.join(testDir, 'style.css'), 'utf8');
      expect(css).toBe(CENTERED_STYLESHEET);
      expect(css).toContain('display: flex;');
      expect(css).toContain('align-items: center;');
      expect(css).toContain('justify-content: center;');
      expect(css).toContain('background: #808080;');
    });

    it('should treat legacy "processingjs" mode as pjs and center it', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        mode: 'processingjs',
      };

      generateIndexHtml(metadata, [], testDir);

      const css = fs.readFileSync(path.join(testDir, 'style.css'), 'utf8');
      expect(css).toBe(CENTERED_STYLESHEET);
    });

    it('should write default (non-centering) style.css for other modes', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
        mode: 'html',
      };

      generateIndexHtml(metadata, [], testDir);

      const css = fs.readFileSync(path.join(testDir, 'style.css'), 'utf8');
      expect(css).toBe(DEFAULT_STYLESHEET);
      expect(css).not.toContain('display: flex;');
    });

    it('should link default style.css from generated index.html', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };

      generateIndexHtml(metadata, [], testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<link rel="stylesheet" type="text/css" href="style.css">');
    });

    it('should not inject default stylesheet when any user CSS exists', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'theme.css' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<link rel="stylesheet" type="text/css" href="theme.css">');
      expect(content).not.toContain('href="style.css"');
      expect(fs.existsSync(path.join(testDir, 'style.css'))).toBe(false);
    });

    it('should not inject default stylesheet when a style.css code part exists', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'style.css' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      const matches = content.match(/href="style\.css"/g) || [];
      expect(matches.length).toBe(1);
    });

    it('should not write index.html or default style.css when codeParts contains index.html', () => {
      const metadata = {
        engineURL: 'https://example.com/engine.js',
      };
      const codeParts = [
        { title: 'index.html' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);

      expect(fs.existsSync(path.join(testDir, 'index.html'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, 'style.css'))).toBe(false);
    });

    it('pjs: renders a canvas with data-processing-sources for .pde tabs, no script src for .pde', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'pjs',
      };
      const codeParts = [
        { title: 'MySketch.pde' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('<canvas data-processing-sources="MySketch.pde"></canvas>');
      expect(content).not.toContain('<script src="MySketch.pde">');
    });

    it('pjs: lists multiple .pde tabs on the canvas in tab order', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'pjs',
      };
      const codeParts = [
        { title: 'a.pde' },
        { title: 'b.pde' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('data-processing-sources="a.pde b.pde"');
    });

    it('pjs: treats the processingjs alias identically to pjs', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'processingjs',
      };
      const codeParts = [{ title: 'Main.pde' }];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('data-processing-sources="Main.pde"');
    });

    it('pjs: excludes .js helper tabs from the canvas but keeps them as <script src>', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'pjs',
      };
      const codeParts = [
        { title: 'Main.pde' },
        { title: 'helper.js' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).toContain('data-processing-sources="Main.pde"');
      expect(content).not.toContain('data-processing-sources="Main.pde helper.js"');
      expect(content).toContain('<script src="helper.js"></script>');
    });

    it('pjs: falls back to plain <script src> wiring and warns when there are no .pde tabs', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'pjs',
      };
      const codeParts = [{ title: 'sketch.js' }];
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).not.toContain('data-processing-sources');
      expect(content).toContain('<script src="sketch.js"></script>');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('pjs: an existing index.html code object still short-circuits (early return)', () => {
      const metadata = {
        engineURL: 'https://example.com/processing.js',
        mode: 'pjs',
      };
      const codeParts = [
        { title: 'index.html' },
        { title: 'Main.pde' },
      ];

      generateIndexHtml(metadata, codeParts, testDir);

      expect(fs.existsSync(path.join(testDir, 'index.html'))).toBe(false);
    });

    it('non-pjs modes are unaffected by the pjs canvas branch', () => {
      const metadata = {
        engineURL: 'https://example.com/p5.js',
        mode: 'p5js',
      };
      const codeParts = [{ title: 'sketch.js' }];

      generateIndexHtml(metadata, codeParts, testDir);
      const content = fs.readFileSync(path.join(testDir, 'index.html'), 'utf8');

      expect(content).not.toContain('data-processing-sources');
      expect(content).toContain('<script src="sketch.js"></script>');
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
