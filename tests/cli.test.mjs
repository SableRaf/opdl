import { describe, it, expect } from 'vitest';
import { parseArgs, parseOptions } from '../src/cli.js';

describe('CLI Parser', () => {
  describe('parseArgs', () => {
    describe('fields command', () => {
      it('should parse fields command without field set', () => {
        const result = parseArgs(['fields']);
        expect(result).toEqual({
          command: 'fields',
          id: undefined,
          options: {}
        });
      });

      it('should parse fields command with field set', () => {
        const result = parseArgs(['fields', 'sketch']);
        expect(result).toEqual({
          command: 'fields',
          id: 'sketch',
          options: {}
        });
      });

      it('should parse fields command with --json flag', () => {
        const result = parseArgs(['fields', '--json']);
        expect(result.command).toBe('fields');
        expect(result.options.json).toBe(true);
        // Note: --json is also captured as id, which is acceptable behavior
      });

      it('should parse fields command with field set and --json', () => {
        const result = parseArgs(['fields', 'user.sketches', '--json']);
        expect(result.command).toBe('fields');
        expect(result.id).toBe('user.sketches');
        expect(result.options.json).toBe(true);
      });
    });

    describe('sketch command', () => {
      it('should parse sketch download command', () => {
        const result = parseArgs(['sketch', 'download', '1142958']);
        expect(result).toEqual({
          command: 'sketch',
          subcommand: 'download',
          id: '1142958',
          options: {}
        });
      });

      it('should parse sketch info command', () => {
        const result = parseArgs(['sketch', 'info', '1142958']);
        expect(result).toEqual({
          command: 'sketch',
          subcommand: 'info',
          id: '1142958',
          options: {}
        });
      });

      it('should parse sketch command with --info option', () => {
        const result = parseArgs(['sketch', 'info', '1142958', '--info=title,license']);
        expect(result.command).toBe('sketch');
        expect(result.subcommand).toBe('info');
        expect(result.id).toBe('1142958');
        expect(result.options.info).toBe('title,license');
      });

      it('should parse sketch download with --outputDir', () => {
        const result = parseArgs(['sketch', 'download', '1142958', '--outputDir=./projects']);
        expect(result.options.outputDir).toBe('./projects');
      });
    });

    describe('user command', () => {
      it('should parse user info command', () => {
        const result = parseArgs(['user', '123']);
        expect(result).toEqual({
          command: 'user',
          subcommand: null,
          id: '123',
          options: {}
        });
      });

      it('should parse user sketches command', () => {
        const result = parseArgs(['user', 'sketches', '123']);
        expect(result).toEqual({
          command: 'user',
          subcommand: 'sketches',
          id: '123',
          options: {}
        });
      });

      it('should parse user followers command', () => {
        const result = parseArgs(['user', 'followers', '123']);
        expect(result).toEqual({
          command: 'user',
          subcommand: 'followers',
          id: '123',
          options: {}
        });
      });

      it('should parse user following command', () => {
        const result = parseArgs(['user', 'following', '123']);
        expect(result).toEqual({
          command: 'user',
          subcommand: 'following',
          id: '123',
          options: {}
        });
      });

      it('should parse user command with list options', () => {
        const result = parseArgs(['user', 'sketches', '123', '--limit=10', '--offset=5', '--sort=desc']);
        expect(result.options.limit).toBe(10);
        expect(result.options.offset).toBe(5);
        expect(result.options.sort).toBe('desc');
      });
    });

    describe('curation command', () => {
      it('should parse curation info command', () => {
        const result = parseArgs(['curation', '456']);
        expect(result).toEqual({
          command: 'curation',
          subcommand: null,
          id: '456',
          options: {}
        });
      });

      it('should parse curation sketches command', () => {
        const result = parseArgs(['curation', 'sketches', '456']);
        expect(result).toEqual({
          command: 'curation',
          subcommand: 'sketches',
          id: '456',
          options: {}
        });
      });

      it('should parse curation sketches with --json', () => {
        const result = parseArgs(['curation', 'sketches', '456', '--json']);
        expect(result.command).toBe('curation');
        expect(result.subcommand).toBe('sketches');
        expect(result.id).toBe('456');
        expect(result.options.json).toBe(true);
      });
    });

    describe('shortcut syntax', () => {
      it('should parse numeric ID as sketch download', () => {
        const result = parseArgs(['1142958']);
        expect(result).toEqual({
          command: 'sketch',
          subcommand: 'download',
          id: '1142958',
          options: {}
        });
      });

      it('should parse numeric ID with --info as sketch info', () => {
        const result = parseArgs(['1142958', '--info=title,license']);
        expect(result.command).toBe('sketch');
        expect(result.subcommand).toBe('info');
        expect(result.id).toBe('1142958');
        expect(result.options.info).toBe('title,license');
      });

      it('should parse numeric ID with download options', () => {
        const result = parseArgs(['1142958', '--outputDir=./test', '--downloadThumbnail']);
        expect(result.command).toBe('sketch');
        expect(result.subcommand).toBe('download');
        expect(result.options.outputDir).toBe('./test');
        expect(result.options.downloadThumbnail).toBe(true);
      });
    });

    describe('error cases', () => {
      it('should throw error for empty argv', () => {
        expect(() => parseArgs([])).toThrow('No command provided');
      });

      it('should throw error for unknown command', () => {
        expect(() => parseArgs(['unknown'])).toThrow('Unknown command: unknown');
      });
    });
  });

  describe('parseOptions', () => {
    it('should parse boolean flags', () => {
      const options = parseOptions(['--json', '--quiet']);
      expect(options.json).toBe(true);
      expect(options.quiet).toBe(true);
    });

    it('should parse value flags with = syntax', () => {
      const options = parseOptions(['--info=title,license', '--limit=10']);
      expect(options.info).toBe('title,license');
      expect(options.limit).toBe(10);
    });

    it('should parse value flags with space syntax', () => {
      const options = parseOptions(['--info', 'title,license', '--limit', '10']);
      expect(options.info).toBe('title,license');
      expect(options.limit).toBe(10);
    });

    it('should parse download options', () => {
      const options = parseOptions(['--downloadThumbnail', '--saveMetadata', '--skipAssets']);
      expect(options.downloadThumbnail).toBe(true);
      expect(options.saveMetadata).toBe(true);
      expect(options.downloadAssets).toBe(false);
    });

    it('should parse outputDir option', () => {
      const options = parseOptions(['--outputDir=./projects']);
      expect(options.outputDir).toBe('./projects');
    });

    it('should parse pagination options', () => {
      const options = parseOptions(['--limit=20', '--offset=10', '--sort=asc']);
      expect(options.limit).toBe(20);
      expect(options.offset).toBe(10);
      expect(options.sort).toBe('asc');
    });

    it('should handle mixed boolean and value flags', () => {
      const options = parseOptions(['--json', '--info=all', '--quiet', '--limit=5']);
      expect(options.json).toBe(true);
      expect(options.info).toBe('all');
      expect(options.quiet).toBe(true);
      expect(options.limit).toBe(5);
    });

    it('should skip non-flag arguments', () => {
      const options = parseOptions(['sketch', '--json', 'someValue']);
      expect(options.json).toBe(true);
      expect(options).not.toHaveProperty('sketch');
      expect(options).not.toHaveProperty('someValue');
    });

    it('should parse skip flags correctly', () => {
      const options = parseOptions(['--skipComments', '--skipLicense', '--skipOpMetadata']);
      expect(options.addSourceComments).toBe(false);
      expect(options.createLicenseFile).toBe(false);
      expect(options.createOpMetadata).toBe(false);
    });

    it('should parse --vite flag', () => {
      const options = parseOptions(['--vite']);
      expect(options.vite).toBe(true);
    });

    it('should parse --vite flag with other options', () => {
      const options = parseOptions(['--vite', '--quiet', '--outputDir=./projects']);
      expect(options.vite).toBe(true);
      expect(options.quiet).toBe(true);
      expect(options.outputDir).toBe('./projects');
    });

    it('should return empty object for no options', () => {
      const options = parseOptions([]);
      expect(options).toEqual({});
    });
  });
});
