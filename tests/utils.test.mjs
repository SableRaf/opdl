import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ensureDirectoryExists, sanitizeFilename, resolveAssetUrl } from '../src/utils';

describe('utils', () => {
  describe('sanitizeFilename', () => {
    it('should sanitize filenames with special characters', () => {
      expect(sanitizeFilename('file<>name.js')).toBe('filename.js');
      expect(sanitizeFilename('file:name.js')).toBe('filename.js');
      expect(sanitizeFilename('file/name.js')).toBe('filename.js');
      expect(sanitizeFilename('file\\name.js')).toBe('filename.js');
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
