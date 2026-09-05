import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { scaffoldGalleryProject } from '../../src/download/galleryScaffolder.js';

describe('scaffoldGalleryProject', () => {
  it('writes a root-level Vite gallery with resilient slideshow behavior', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-'));
    try {
      await scaffoldGalleryProject(root, { curationId: 5, curationTitle: 'Gallery', quiet: true });
      for (const file of ['index.html', 'main.js', 'style.css', 'vite.config.js', 'package.json', 'README.md']) expect(fs.existsSync(path.join(root, file))).toBe(true);
      const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
      const js = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
      expect(() => execFileSync(process.execPath, ['--check', path.join(root, 'main.js')])).not.toThrow();
      const config = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
      const options = new Function('defineConfig', config.replace(/^import .*$/m, '').replace('export default', 'return'))(value => value);
      expect(options.build.target).toBe('es2022');
      expect(html).toContain('slideshow-view'); expect(html).toContain('sidebar'); expect(html).toContain('slide-pill');
      expect(js).toContain('/metadata/metadata.json');
      expect(js).toContain('metadata.titleOverride');
      expect(js).not.toContain('config.projects');
      expect(js).toContain('metadata/thumbnail.jpg'); expect(js).toContain('whenSketchReady'); expect(js).toContain('setTimeout(finish, 8000)'); expect(js).toContain('Could not load sketch metadata');
      expect(js).toContain('/p5(?:\\.min)?(?:\\.js)?(?:@|\\/)(\\d+)/i');
      expect(JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).dependencies).toHaveProperty('js-yaml');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('sketchUrl() targets the nested sketch/<name>/ path when sketchName is present, else the legacy path', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-'));
    try {
      await scaffoldGalleryProject(root, { curationId: 5, curationTitle: 'Gallery', quiet: true });
      const js = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
      const match = js.match(/function sketchUrl\(project\) \{[\s\S]*?\n\}/);
      expect(match).toBeTruthy();
      const sketchUrl = new Function(
        'encodeURIComponent',
        `${match[0]}\nreturn sketchUrl;`
      )(encodeURIComponent);

      expect(sketchUrl({ dir: '1_A B', sketchName: 'My Sketch' }))
        .toBe('./sketches/1_A%20B/sketch/My%20Sketch/index.html');
      expect(sketchUrl({ dir: '1_A B' }))
        .toBe('./sketches/1_A%20B/index.html');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('accepts an authored HTML, CSS, and JavaScript template directory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-'));
    const templates = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-template-'));
    try {
      fs.writeFileSync(path.join(templates, 'index.html'), '<title>{{CURATION_TITLE}}</title>');
      fs.writeFileSync(path.join(templates, 'style.css'), 'body { color: hotpink; }\n');
      fs.writeFileSync(path.join(templates, 'main.js'), 'console.log("authored template");\n');
      fs.writeFileSync(path.join(templates, 'README.md'), '# {{CURATION_TITLE_RAW}}\n');

      await scaffoldGalleryProject(root, {
        curationId: 5,
        curationTitle: 'A <Gallery>',
        templateDir: templates,
        quiet: true,
      });

      expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toBe('<title>A &lt;Gallery&gt;</title>');
      expect(fs.readFileSync(path.join(root, 'style.css'), 'utf8')).toBe('body { color: hotpink; }\n');
      expect(fs.readFileSync(path.join(root, 'main.js'), 'utf8')).toBe('console.log("authored template");\n');
      expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8')).toBe('# A <Gallery>\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(templates, { recursive: true, force: true });
    }
  });
});

// Exercise the generated readiness path, not just the presence of CSS text.
describe('generated gallery presentation', () => {
  it.each(['https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.js', 'https://cdn.jsdelivr.net/npm/p5@2.0.0/lib/p5.js'])(
    'installs presentation before revealing %s and only once per document', async (engineURL) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-'));
      vi.useFakeTimers();
      try {
        await scaffoldGalleryProject(root, { quiet: true });
        const js = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
        const functions = ['applySketchPresentation', 'isP5V2', 'whenSketchReady'].map(name => {
          const match = js.match(new RegExp(`function ${name}\\([^]*?\\n}`));
          expect(match, `${name} must be emitted in the gallery`).toBeTruthy();
          return match[0];
        }).join('\n');
        const ready = new Function(`${functions}\nreturn whenSketchReady;`)();
        const styles = [];
        const document = {
          head: { append: style => styles.push(style) },
          createElement: () => ({}),
          getElementById: id => styles.find(style => style.id === id),
        };
        let onLoad;
        const iframe = {
          contentDocument: document,
          contentWindow: { __p5SetupComplete: true },
          addEventListener: (event, handler) => { onLoad = handler; },
        };
        const revealed = vi.fn();
        const pending = ready(iframe, engineURL).then(revealed);
        if (engineURL.includes('@1.')) onLoad();
        else await vi.advanceTimersByTimeAsync(100);
        expect(revealed).not.toHaveBeenCalled();
        expect(styles).toHaveLength(1);
        expect(styles[0].textContent).toContain('canvas.p5Canvas');
        expect(styles[0].textContent).toContain('translate: -50% -50%');
        await vi.advanceTimersByTimeAsync(150);
        await pending;
        expect(revealed).toHaveBeenCalledOnce();
        onLoad(); // p5 v2 may become ready before the document's load event.
        expect(styles).toHaveLength(1);
      } finally {
        vi.useRealTimers();
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  );
});
