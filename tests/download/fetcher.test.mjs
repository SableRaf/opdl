import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';
import { fetchSketchInfo, fetchUserInfo } from '../../src/fetcher';
import { VALIDATION_REASONS } from '../../src/api/validator';

describe('fetcher', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchUserInfo', () => {
    it('should fetch user information successfully', async () => {
      nock('https://openprocessing.org')
        .get('/api/user/123')
        .reply(200, {
          fullname: 'Test User',
          userId: 123,
        });

      const result = await fetchUserInfo(123);
      expect(result).toEqual({
        fullname: 'Test User',
        userId: 123,
      });
    });

    it('should return empty object for missing user ID', async () => {
      const result = await fetchUserInfo(null);
      expect(result).toEqual({});
    });

    it('should return empty object on error', async () => {
      nock('https://openprocessing.org')
        .get('/api/user/999')
        .reply(404, { success: false, message: 'User not found' });

      const result = await fetchUserInfo(999);
      expect(result).toEqual({});
    });

    it('should respect quiet option', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      nock('https://openprocessing.org')
        .get('/api/user/999')
        .reply(404);

      await fetchUserInfo(999, { quiet: true });
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('fetchSketchInfo', () => {
    it('should return null for invalid sketch ID', async () => {
      expect(await fetchSketchInfo('invalid')).toBeNull();
      expect(await fetchSketchInfo(-1)).toBeNull();
      expect(await fetchSketchInfo(0)).toBeNull();
      expect(await fetchSketchInfo(null)).toBeNull();
    });

    it('should fetch complete sketch information for valid sketch', async () => {
      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(200, {
          title: 'Test Sketch',
          mode: 'p5js',
          userID: 100,
          parentID: null,
        });

      nock('https://openprocessing.org')
        .get(`/api/user/100`)
        .reply(200, {
          fullname: 'Test Author',
        });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(200, [
          { title: 'sketch.js', code: 'console.log("test");' },
        ]);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(200, [
          { name: 'image.png' },
        ]);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(200, [
          { url: 'https://lib.com/lib.js' },
        ]);

      const result = await fetchSketchInfo(sketchId);

      expect(result).toBeDefined();
      expect(result.sketchId).toBe(sketchId);
      expect(result.title).toBe('Test Sketch');
      expect(result.mode).toBe('p5js');
      expect(result.author).toBe('Test Author');
      expect(result.isFork).toBe(false);
      expect(result.available).toBe(true);
      expect(result.unavailableReason).toBeNull();
      expect(result.codeParts).toHaveLength(1);
      expect(result.files).toHaveLength(1);
      expect(result.libraries).toHaveLength(1);
    });

    it('should detect hidden code correctly', async () => {
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
        .reply(200, {
          fullname: 'Author',
        });

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

      const result = await fetchSketchInfo(sketchId);

      expect(result.available).toBe(false);
      expect(result.unavailableReason).toBe(VALIDATION_REASONS.CODE_HIDDEN);
      expect(result.codeParts).toHaveLength(0);
    });

    it('should mark private sketches and stop processing', async () => {
      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(200, {
          success: false,
          message: 'This is a private sketch.',
        });

      const result = await fetchSketchInfo(sketchId);

      expect(result.available).toBe(false);
      expect(result.unavailableReason).toBe(VALIDATION_REASONS.PRIVATE);
      expect(result.error).toBe('This sketch is private and cannot be downloaded.');
      expect(result.metadata).toEqual({});
      expect(result.codeParts).toHaveLength(0);
    });

    it('should handle fork sketches correctly', async () => {
      const sketchId = 12345;
      const parentId = 67890;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(200, {
          title: 'Forked Sketch',
          mode: 'p5js',
          userID: 100,
          parentID: parentId,
        });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${parentId}`)
        .reply(200, {
          title: 'Original Sketch',
          userID: 200,
        });

      nock('https://openprocessing.org')
        .get(`/api/user/200`)
        .reply(200, {
          fullname: 'Original Author',
        });

      nock('https://openprocessing.org')
        .get(`/api/user/100`)
        .reply(200, {
          fullname: 'Forker',
        });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(200, []);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(200, []);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(200, []);

      const result = await fetchSketchInfo(sketchId);

      expect(result.isFork).toBe(true);
      expect(result.parent.sketchID).toBe(parentId);
      expect(result.parent.title).toBe('Original Sketch');
      expect(result.parent.author).toBe('Original Author');
    });

    it('should handle API errors gracefully', async () => {
      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(404, {
          success: false,
          message: 'Sketch not found',
        });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(404);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(404);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(404);

      const result = await fetchSketchInfo(sketchId, { quiet: true });

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
    });

    it('should handle parentID as string "0"', async () => {
      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(200, {
          title: 'Test',
          mode: 'p5js',
          userID: 100,
          parentID: '0',
        });

      nock('https://openprocessing.org')
        .get(`/api/user/100`)
        .reply(200, { fullname: 'Author' });

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(200, []);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(200, []);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(200, []);

      const result = await fetchSketchInfo(sketchId);

      expect(result.isFork).toBe(false);
    });

    it('should handle different sketch modes (processingjs, html)', async () => {
      const modes = ['processingjs', 'html', 'p5js'];

      for (const mode of modes) {
        nock.cleanAll();
        const sketchId = 12345;

        nock('https://openprocessing.org')
          .get(`/api/sketch/${sketchId}`)
          .reply(200, {
            title: 'Test',
            mode: mode,
            userID: 100,
          });

        nock('https://openprocessing.org')
          .get(`/api/user/100`)
          .reply(200, { fullname: 'Author' });

        nock('https://openprocessing.org')
          .get(`/api/sketch/${sketchId}/code`)
          .reply(200, []);

        nock('https://openprocessing.org')
          .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
          .reply(200, []);

        nock('https://openprocessing.org')
          .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
          .reply(200, []);

        const result = await fetchSketchInfo(sketchId);
        expect(result.mode).toBe(mode);
      }
    });

    it('should respect quiet option for console output', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const sketchId = 12345;

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}`)
        .reply(500);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/code`)
        .reply(500);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/files?limit=100&offset=0`)
        .reply(500);

      nock('https://openprocessing.org')
        .get(`/api/sketch/${sketchId}/libraries?limit=100&offset=0`)
        .reply(500);

      await fetchSketchInfo(sketchId, { quiet: true });
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
