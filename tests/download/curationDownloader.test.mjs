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
      const yaml = fs.readFileSync(yamlPath, 'utf8');
      expect(yaml).toContain('slideDuration: 8');
      expect(yaml).toContain('randomize: true');
      expect(yaml).not.toContain('projects:');
      expect(yaml).not.toContain('A:');
      fs.writeFileSync(yamlPath, 'custom: true\n');
      await downloadCuration({ curationId: 9, client, opdlFn, scaffoldFn, options: { outputDir: root, limit: 1, quiet: true } });
      expect(fs.readFileSync(yamlPath, 'utf8')).toBe('custom: true\n');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  const seedExistingSketch = (root, dir, meta) => {
    const sketchDir = path.join(root, 'public', 'sketches', dir);
    fs.mkdirSync(path.join(sketchDir, 'metadata'), { recursive: true });
    fs.writeFileSync(path.join(sketchDir, 'stale.js'), 'old');
    if (meta) fs.writeFileSync(path.join(sketchDir, 'metadata', 'metadata.json'), JSON.stringify(meta));
  };
  const conflictClient = (sketches) => ({ getCuration: async () => ({ title: 'C' }), getCurationSketches: async () => sketches });
  const okOpdl = () => vi.fn(async (id) => ({ success: true, sketchInfo: { visualID: id, title: `S${id}` } }));

  it('skips an existing sketch and rehydrates its manifest entry from disk metadata', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
    try {
      seedExistingSketch(root, '1_A', { visualID: 1, title: 'A (edited)', author: 'Ada', mode: 'p5js', engineURL: 'p5@2.1.0' });
      const opdlFn = okOpdl();
      const onConflict = vi.fn().mockResolvedValue('skip');
      const result = await downloadCuration({
        curationId: 9, client: conflictClient([{ visualID: 1, title: 'A' }, { visualID: 2, title: 'B' }]),
        opdlFn, scaffoldFn: vi.fn(), onConflict, options: { outputDir: root, quiet: true },
      });
      expect(onConflict).toHaveBeenCalledTimes(1);
      expect(onConflict.mock.calls[0][0]).toMatchObject({ title: 'A', dir: '1_A', quiet: true });
      expect(opdlFn).toHaveBeenCalledTimes(1);
      expect(opdlFn.mock.calls[0][0]).toBe(2);
      expect(result.skippedSketches).toEqual([{ id: 1, title: 'A' }]);
      expect(result.manifest[0]).toMatchObject({ id: 1, title: 'A (edited)', author: 'Ada', engineURL: 'p5@2.1.0', dir: '1_A', available: true });
      expect(result.manifest).toHaveLength(2);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('overwrite clears the existing directory before re-downloading', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
    try {
      seedExistingSketch(root, '1_A', null);
      const stale = path.join(root, 'public', 'sketches', '1_A', 'stale.js');
      const opdlFn = okOpdl();
      const result = await downloadCuration({
        curationId: 9, client: conflictClient([{ visualID: 1, title: 'A' }]),
        opdlFn, scaffoldFn: vi.fn(), onConflict: vi.fn().mockResolvedValue('overwrite'),
        options: { outputDir: root, quiet: true },
      });
      expect(fs.existsSync(stale)).toBe(false);
      expect(opdlFn).toHaveBeenCalledTimes(1);
      expect(result.skippedSketches).toEqual([]);
      expect(result.manifest).toHaveLength(1);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('applies skip-all and overwrite-all to remaining conflicts without re-prompting', async () => {
    for (const [action, downloads] of [['skip-all', 0], ['overwrite-all', 2]]) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
      try {
        seedExistingSketch(root, '1_A', null);
        seedExistingSketch(root, '2_B', null);
        const opdlFn = okOpdl();
        const onConflict = vi.fn().mockResolvedValue(action);
        const result = await downloadCuration({
          curationId: 9, client: conflictClient([{ visualID: 1, title: 'A' }, { visualID: 2, title: 'B' }]),
          opdlFn, scaffoldFn: vi.fn(), onConflict, options: { outputDir: root, quiet: true },
        });
        expect(onConflict).toHaveBeenCalledTimes(1);
        expect(opdlFn).toHaveBeenCalledTimes(downloads);
        expect(result.manifest).toHaveLength(2);
      } finally { fs.rmSync(root, { recursive: true, force: true }); }
    }
  });

  it('cancel stops the download without scaffolding or writing the manifest', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
    try {
      seedExistingSketch(root, '2_B', null);
      const opdlFn = okOpdl();
      const scaffoldFn = vi.fn();
      const result = await downloadCuration({
        curationId: 9, client: conflictClient([{ visualID: 1, title: 'A' }, { visualID: 2, title: 'B' }, { visualID: 3, title: 'C' }]),
        opdlFn, scaffoldFn, onConflict: vi.fn().mockResolvedValue('cancel'),
        options: { outputDir: root, quiet: true },
      });
      expect(result).toMatchObject({ success: false, cancelled: true });
      expect(opdlFn).toHaveBeenCalledTimes(1);
      expect(scaffoldFn).not.toHaveBeenCalled();
      expect(fs.existsSync(path.join(root, 'public', 'manifest.json'))).toBe(false);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });

  it('honors forced --overwrite and --skipExisting policies without prompting', async () => {
    for (const [options, downloads] of [[{ overwrite: true }, 1], [{ skipExisting: true }, 0]]) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opdl-curation-'));
      try {
        seedExistingSketch(root, '1_A', null);
        const opdlFn = okOpdl();
        const onConflict = vi.fn();
        await downloadCuration({
          curationId: 9, client: conflictClient([{ visualID: 1, title: 'A' }]),
          opdlFn, scaffoldFn: vi.fn(), onConflict, options: { ...options, outputDir: root, quiet: true },
        });
        expect(onConflict).not.toHaveBeenCalled();
        expect(opdlFn).toHaveBeenCalledTimes(downloads);
      } finally { fs.rmSync(root, { recursive: true, force: true }); }
    }
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
