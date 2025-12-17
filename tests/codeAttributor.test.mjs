import { describe, it, expect } from 'vitest';
import { buildCommentBlock } from '../src/codeAttributor';

describe('codeAttributor', () => {
  describe('buildCommentBlock', () => {
    it('should generate comment block with basic sketch info', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test Sketch',
        author: 'Test Author',
        metadata: {
          license: 'by',
        },
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);

      expect(result).toContain('Title: Test Sketch');
      expect(result).toContain('Author: Test Author');
      expect(result).toContain('Source: https://openprocessing.org/sketch/12345');
      expect(result).toContain('License: CC BY 4.0 International');
      expect(result).toContain('Downloaded with opdl');
      expect(result).toContain('https://github.com/sableRaf/opdl');
    });

    it('should handle all license types correctly', () => {
      const licenses = {
        'by': 'CC BY 4.0 International',
        'by-sa': 'CC BY-SA 4.0 International',
        'by-nd': 'CC BY-ND 4.0 International',
        'by-nc': 'CC BY-NC 4.0 International',
        'by-nc-sa': 'CC BY-NC-SA 4.0 International',
        'by-nc-nd': 'CC BY-NC-ND 4.0 International',
      };

      Object.entries(licenses).forEach(([code, name]) => {
        const sketchInfo = {
          sketchId: 12345,
          title: 'Test',
          author: 'Author',
          metadata: { license: code },
          isFork: false,
        };
        const result = buildCommentBlock(sketchInfo);
        expect(result).toContain(`License: ${name}`);
      });
    });

    it('should handle missing license', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: {},
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);
      expect(result).toContain('License: Not specified');
    });

    it('should handle unknown license codes', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: { license: 'unknown-license' },
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);
      expect(result).toContain('License: unknown-license');
    });

    it('should include fork information when sketch is a fork', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Forked Sketch',
        author: 'Forker',
        metadata: { license: 'by' },
        isFork: true,
        parent: {
          sketchID: 67890,
          title: 'Original Sketch',
          author: 'Original Author',
        },
      };

      const result = buildCommentBlock(sketchInfo);

      expect(result).toContain('Forked from: Original Sketch by Original Author');
      expect(result).toContain('Fork source: https://openprocessing.org/sketch/67890');
    });

    it('should handle fork with missing parent information', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Forked Sketch',
        author: 'Forker',
        metadata: { license: 'by' },
        isFork: true,
        parent: {
          sketchID: 67890,
        },
      };

      const result = buildCommentBlock(sketchInfo);

      expect(result).toContain('Forked from: Unknown title by Unknown author');
      expect(result).toContain('Fork source: https://openprocessing.org/sketch/67890');
    });

    it('should use metadata fallback for title', () => {
      const sketchInfo = {
        sketchId: 12345,
        author: 'Author',
        metadata: {
          title: 'Metadata Title',
          license: 'by',
        },
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);
      expect(result).toContain('Title: Metadata Title');
    });

    it('should use metadata fallback for author', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Title',
        metadata: {
          fullname: 'Metadata Author',
          license: 'by',
        },
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);
      expect(result).toContain('Author: Metadata Author');
    });

    it('should handle missing title and author gracefully', () => {
      const sketchInfo = {
        sketchId: 12345,
        metadata: {},
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);
      expect(result).toContain('Title: Untitled');
      expect(result).toContain('Author: Unknown');
    });

    it('should generate valid JavaScript comment block format', () => {
      const sketchInfo = {
        sketchId: 12345,
        title: 'Test',
        author: 'Author',
        metadata: { license: 'by' },
        isFork: false,
      };

      const result = buildCommentBlock(sketchInfo);

      expect(result).toMatch(/^\/\*/);
      expect(result.trim()).toMatch(/\*\/$/);
      expect(result.split('\n').every(line =>
        line === '' || line.startsWith('/*') || line.startsWith(' *') || line.startsWith(' */') || line === '*/'
      )).toBe(true);
    });
  });
});
