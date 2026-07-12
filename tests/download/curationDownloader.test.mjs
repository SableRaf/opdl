import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { downloadCuration } from '../../src/download/curationDownloader.js';

describe('downloadCuration', () => {
  it('downloads a limited set, writes portable metadata, and preserves gallery config', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
    try {
      const client = { getCuration: vi.fn().mockResolvedValue({ title: 'Collection' }), getCurationSketches: vi.fn().mockResolvedValue([
        { visualID: 1, title: 'A: "quote"', userName: 'Ada' }, { visualID: 2, title: 'B' },
      ]) };
      const opdlFn = vi.fn(async (id) => ({ success: true, sketchInfo: { visualID: id, title: id === 1 ? 'A: "quote"' : 'B', author: 'Ada', mode: 'p5js', engineURL: 'p5@2.1.0' } }));
      const scaffoldFn = vi.fn();
      const result = await downloadCuration({ curationId: 9, client, opdlFn, scaffoldFn, options: { outputDir: root, limit: 1, quiet: true } });
      expect(opdlFn).toHaveBeenCalledTimes(1);
      expect(opdlFn.mock.calls[0][1].outputDir).toContain(path.join('public', 'sketches', '1_A_quote'));
      expect(result.manifest[0]).toMatchObject({ id: 1, engineURL: 'p5@2.1.0', indexPath: 'public/sketches/1_A_quote/index.html' });
      const yamlPath = path.join(root, 'public', 'gallery.yaml');
      expect(fs.readFileSync(yamlPath, 'utf8')).toContain('title: "A: \\"quote\\""');
      fs.writeFileSync(yamlPath, 'custom: true\n');
      await downloadCuration({ curationId: 9, client, opdlFn, scaffoldFn, options: { outputDir: root, limit: 1, quiet: true } });
      expect(fs.readFileSync(yamlPath, 'utf8')).toBe('custom: true\n');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('continues after thrown and unavailable sketches', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
    try {
      const client = { getCuration: async () => ({}), getCurationSketches: async () => [{ visualID: 1 }, { visualID: 2 }, { visualID: 3 }] };
      const opdlFn = vi.fn().mockRejectedValueOnce(new Error('broken')).mockResolvedValueOnce({ success: false, sketchInfo: { error: '' } }).mockResolvedValueOnce({ success: true, sketchInfo: { visualID: 3 } });
      const result = await downloadCuration({ curationId: 1, client, opdlFn, scaffoldFn: vi.fn(), options: { outputDir: root, quiet: true } });
      expect(result.failedSketches.map(x => x.error)).toEqual(['broken', 'Sketch unavailable (private or deleted)']);
      expect(result.manifest).toHaveLength(1);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});
