import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createLicenseFile } from '../../src/download/licenseHandler';

describe('licenseHandler', () => {
  const testDir = path.join(__dirname, 'test-license-output');

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

  describe('createLicenseFile', () => {
    it('should create LICENSE file with CC BY license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test Sketch',
        author: 'Test Author',
        metadata: {
          license: 'by',
          createdOn: '2024-01-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);

      const licensePath = path.join(testDir, 'LICENSE');
      expect(fs.existsSync(licensePath)).toBe(true);

      const content = fs.readFileSync(licensePath, 'utf8');
      expect(content).toContain('Creative Commons Attribution 4.0 International');
      expect(content).toContain('Title: Test Sketch');
      expect(content).toContain('Author: Test Author');
      expect(content).toContain('Source: https://openprocessing.org/sketch/12345');
      expect(content).toContain('Year: 2024');
      expect(content).toContain('https://creativecommons.org/licenses/by/4.0/');
    });

    it('should create LICENSE file with CC BY-SA license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by-sa',
          createdOn: '2023-05-20T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons Attribution-ShareAlike 4.0 International');
      expect(content).toContain('https://creativecommons.org/licenses/by-sa/4.0/');
      expect(content).toContain('Year: 2023');
    });

    it('should create LICENSE file with CC BY-ND license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by-nd',
          createdOn: '2022-12-01T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons Attribution-NoDerivatives 4.0 International');
      expect(content).toContain('https://creativecommons.org/licenses/by-nd/4.0/');
    });

    it('should create LICENSE file with CC BY-NC license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by-nc',
          createdOn: '2021-08-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons Attribution-NonCommercial 4.0 International');
      expect(content).toContain('https://creativecommons.org/licenses/by-nc/4.0/');
    });

    it('should create LICENSE file with CC BY-NC-SA license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by-nc-sa',
          createdOn: '2020-03-10T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International');
      expect(content).toContain('https://creativecommons.org/licenses/by-nc-sa/4.0/');
    });

    it('should create LICENSE file with CC BY-NC-ND license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by-nc-nd',
          createdOn: '2019-11-25T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International');
      expect(content).toContain('https://creativecommons.org/licenses/by-nc-nd/4.0/');
    });

    it('should handle missing license gracefully', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test Sketch',
        author: 'Test Author',
        metadata: {
          createdOn: '2024-01-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('License Not Specified');
      expect(content).toContain('The author did not specify a license');
    });

    it('should handle unknown license code', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'unknown-license-code',
          createdOn: '2024-01-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Creative Commons license (unknown-license-code)');
    });

    it('should use current year if creation date is invalid', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by',
          createdOn: 'invalid-date',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      const currentYear = new Date().getFullYear();
      expect(content).toContain(`Year: ${currentYear}`);
    });

    it('should use current year if creation date is missing', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {
          license: 'by',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      const currentYear = new Date().getFullYear();
      expect(content).toContain(`Year: ${currentYear}`);
    });

    it('should use metadata fallbacks for title and author', () => {
      const sketchInfo = {
        sketchId: 12345,
        metadata: {
          title: 'Metadata Title',
          fullname: 'Metadata Author',
          license: 'by',
          createdOn: '2024-01-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Title: Metadata Title');
      expect(content).toContain('Author: Metadata Author');
    });

    it('should handle missing title and author gracefully', () => {
      const sketchInfo = {
        sketchId: 12345,
        metadata: {
          license: 'by',
          createdOn: '2024-01-15T10:00:00Z',
        },
      };

      createLicenseFile(sketchInfo, testDir);
      const content = fs.readFileSync(path.join(testDir, 'LICENSE'), 'utf8');

      expect(content).toContain('Title: Untitled');
      expect(content).toContain('Author: Unknown');
    });

    it('should respect quiet option and not throw on errors', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: { license: 'by' },
      };

      const invalidDir = '/invalid/path/that/does/not/exist';
      expect(() => createLicenseFile(sketchInfo, invalidDir, { quiet: true })).not.toThrow();
    });
  });
});
