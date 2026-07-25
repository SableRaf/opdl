import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ensureDirectoryExists,
  sanitizeFilename,
  resolveAssetFileName,
  buildAssetRenameMap,
  rewriteAssetReferences,
  resolveAssetUrl,
} from '../src/utils';

describe('utils', () => {
  describe('sanitizeFilename', () => {
    it('should sanitize filenames with special characters', () => {
      expect(sanitizeFilename('file<>name.js')).toBe('filename.js');
      expect(sanitizeFilename('file:name.js')).toBe('filename.js');
      expect(sanitizeFilename('file/name.js')).toBe('filename.js');
      expect(sanitizeFilename('file\\name.js')).toBe('filename.js');
    });

    it('should strip URL-fragile characters (#, ?, %, comma)', () => {
      // These are legal in filenames but get percent-encoded in the fetch
      // URL and many static servers don't decode them back to a file path,
      // so the gallery fails to find the sketch/thumbnail. Only letters,
      // digits, spaces, '.', '-', '_' survive.
      expect(sanitizeFilename('Genuary 2023 #6 Chrome At Last'))
        .toBe('Genuary_2023_6_Chrome_At_Last');
      expect(sanitizeFilename('what? maybe 50%')).toBe('what_maybe_50');
      expect(sanitizeFilename('2D Canvas, 6 circles, 10 lines, 5'))
        .toBe('2D_Canvas_6_circles_10_lines_5');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my file.js')).toBe('my_file.js');
      expect(sanitizeFilename('my   file.js')).toBe('my_file.js');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  filename.js  ')).toBe('filename.js');
    });

    it('should handle empty strings', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeFilename('файл.js')).toBe('файл.js');
      expect(sanitizeFilename('文件.js')).toBe('文件.js');
    });
  });

  describe('resolveAssetFileName', () => {
    it('passes normal names through sanitized', () => {
      expect(resolveAssetFileName('image.png', 0)).toBe('image.png');
      expect(resolveAssetFileName('Bottle slide.m4a', 3)).toBe('Bottle_slide.m4a');
    });

    it('falls back to asset_<n> when the original sanitizes to an empty string', () => {
      expect(resolveAssetFileName('***', 0)).toBe('asset_1');
    });

    it('strips quotes/backticks like sanitizeFilename does elsewhere', () => {
      const result = resolveAssetFileName('weird`"name.png', 4);
      expect(result).toBe('weirdname.png');
    });

    it('falls back to asset_<n>.<ext> when the sanitized result is a bare extension with no stem', () => {
      // '???.png' sanitizes to '.png' — sanitization-stable but has no usable
      // stem, so it would land on disk as a hidden dotfile, not a real name.
      const result = resolveAssetFileName('???.png', 2);
      expect(result).toBe('asset_3.png');
    });

    it('drops the extension when it is itself unsalvageable', () => {
      const result = resolveAssetFileName('file.`"', 0);
      expect(result).toBe('asset_1');
    });

    it('never returns the raw unsanitized original as a fallback', () => {
      const result = resolveAssetFileName('a"b`c.png', 1);
      expect(result).not.toBe('a"b`c.png');
      expect(sanitizeFilename(result)).toBe(result);
    });
  });

  describe('buildAssetRenameMap', () => {
    it('includes only files whose sanitized name differs', () => {
      const files = [
        { name: 'Bottle slide.m4a' },
        { name: 'Clink.m4a' },
        { name: 'IMG_4285.PNG' },
      ];
      expect(buildAssetRenameMap(files)).toEqual([
        { original: 'Bottle slide.m4a', sanitized: 'Bottle_slide.m4a' },
      ]);
    });

    it('agrees with resolveAssetFileName by index for quote/backtick-bearing names', () => {
      const files = [
        { name: 'a"b`c.png' },
        { name: 'plain.png' },
        { name: '???.jpg' },
      ];
      const renames = buildAssetRenameMap(files);
      expect(renames).toEqual([
        { original: 'a"b`c.png', sanitized: resolveAssetFileName('a"b`c.png', 0) },
        { original: '???.jpg', sanitized: resolveAssetFileName('???.jpg', 2) },
      ]);
    });

    it('skips entries without a name and non-array input', () => {
      expect(buildAssetRenameMap([{ size: '10' }, null, { name: '' }])).toEqual([]);
      expect(buildAssetRenameMap(undefined)).toEqual([]);
      expect(buildAssetRenameMap(null)).toEqual([]);
    });
  });

  describe('rewriteAssetReferences', () => {
    it('rewrites references to renamed assets', () => {
      const code = "loadSound('Bottle slide.m4a'); loadSound('Clink.m4a');";
      const renames = [{ original: 'Bottle slide.m4a', sanitized: 'Bottle_slide.m4a' }];
      expect(rewriteAssetReferences(code, renames)).toBe(
        "loadSound('Bottle_slide.m4a'); loadSound('Clink.m4a');"
      );
    });

    it('applies longer originals first so shorter names cannot clobber them', () => {
      const code = "a('slide.m4a'); b('Bottle slide.m4a');";
      const renames = [
        { original: 'slide.m4a', sanitized: 'slide_x.m4a' },
        { original: 'Bottle slide.m4a', sanitized: 'Bottle_slide.m4a' },
      ];
      expect(rewriteAssetReferences(code, renames)).toBe(
        "a('slide_x.m4a'); b('Bottle_slide.m4a');"
      );
    });

    it('returns code unchanged when there are no renames', () => {
      const code = "loadImage('a.png');";
      expect(rewriteAssetReferences(code, [])).toBe(code);
      expect(rewriteAssetReferences(code, undefined)).toBe(code);
    });

    it('handles empty code', () => {
      expect(rewriteAssetReferences('', [{ original: 'a', sanitized: 'b' }])).toBe('');
    });
  });

  describe('resolveAssetUrl', () => {
    it('should resolve URLs with http base URL', () => {
      const result = resolveAssetUrl('https://example.com/assets', 'image.png');
      expect(result).toBe('https://example.com/assets/image.png');
    });

    it('should resolve URLs with http base URL ending with slash', () => {
      const result = resolveAssetUrl('https://example.com/assets/', 'image.png');
      expect(result).toBe('https://example.com/assets/image.png');
    });

    it('should resolve URLs with filename starting with slash', () => {
      const result = resolveAssetUrl('https://example.com/assets', '/image.png');
      expect(result).toBe('https://example.com/assets/image.png');
    });

    it('should resolve OpenProcessing relative URLs', () => {
      const result = resolveAssetUrl('/sketch/12345/files', 'image.png');
      expect(result).toBe('https://openprocessing.org/sketch/12345/files/image.png');
    });

    it('should handle OpenProcessing URLs with trailing slash', () => {
      const result = resolveAssetUrl('/sketch/12345/files/', 'image.png');
      expect(result).toBe('https://openprocessing.org/sketch/12345/files/image.png');
    });

    it('should handle filename with leading slash for OpenProcessing URLs', () => {
      const result = resolveAssetUrl('/sketch/12345/files', '/image.png');
      expect(result).toBe('https://openprocessing.org/sketch/12345/files/image.png');
    });

    it('should return empty string for missing base URL', () => {
      expect(resolveAssetUrl('', 'image.png')).toBe('');
      expect(resolveAssetUrl(null, 'image.png')).toBe('');
    });

    it('should return empty string for missing filename', () => {
      expect(resolveAssetUrl('https://example.com', '')).toBe('');
      expect(resolveAssetUrl('https://example.com', null)).toBe('');
    });

    it('should return empty string for invalid base URL format', () => {
      expect(resolveAssetUrl('invalid-url', 'image.png')).toBe('');
    });
  });

  describe('ensureDirectoryExists', () => {
    const testDir = path.join(__dirname, 'test-temp-dir');
    const nestedDir = path.join(testDir, 'nested', 'deep', 'path');

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should create a directory if it does not exist', () => {
      expect(fs.existsSync(testDir)).toBe(false);
      ensureDirectoryExists(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should create nested directories recursively', () => {
      expect(fs.existsSync(nestedDir)).toBe(false);
      ensureDirectoryExists(nestedDir);
      expect(fs.existsSync(nestedDir)).toBe(true);
    });

    it('should not throw error if directory already exists', () => {
      ensureDirectoryExists(testDir);
      expect(() => ensureDirectoryExists(testDir)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
    });
  });
});
