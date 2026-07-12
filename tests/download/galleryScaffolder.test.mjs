import { describe, it, expect } from 'vitest';
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
      expect(html).toContain('slideshow-view'); expect(html).toContain('sidebar'); expect(html).toContain('slide-pill');
      expect(js).toContain('/metadata/metadata.json');
      expect(js).toContain('metadata.titleOverride');
      expect(js).not.toContain('config.projects');
      expect(js).toContain('metadata/thumbnail.jpg'); expect(js).toContain('whenSketchReady'); expect(js).toContain('setTimeout(finish, 8000)'); expect(js).toContain('Could not load sketch metadata');
      expect(js).toContain('/p5(?:\\.min)?(?:\\.js)?(?:@|\\/)(\\d+)/i');
      expect(JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).dependencies).toHaveProperty('js-yaml');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('accepts an authored HTML, CSS, and JavaScript template directory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-'));
    const templates = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-gallery-template-'));
    try {
      fs.writeFileSync(path.join(templates, 'index.html'), '<title>{{CURATION_TITLE}}</title>');
      fs.writeFileSync(path.join(templates, 'style.css'), 'body { color: hotpink; }\n');
      fs.writeFileSync(path.join(templates, 'main.js'), 'console.log("authored template");\n');

      await scaffoldGalleryProject(root, {
        curationId: 5,
        curationTitle: 'A <Gallery>',
        templateDir: templates,
        quiet: true,
      });

      expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toBe('<title>A &lt;Gallery&gt;</title>');
      expect(fs.readFileSync(path.join(root, 'style.css'), 'utf8')).toBe('body { color: hotpink; }\n');
      expect(fs.readFileSync(path.join(root, 'main.js'), 'utf8')).toBe('console.log("authored template");\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(templates, { recursive: true, force: true });
    }
  });
});
