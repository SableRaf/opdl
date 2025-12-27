import { describe, it, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DownloadService } from '../../src/download/service.js';

describe('DownloadService', () => {
  let service;
  let mockClient;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      getSketch: async () => ({}),
      getUser: async () => ({}),
      getSketchCode: async () => [],
      getSketchFiles: async () => [],
      getSketchLibraries: async () => [],
    };
  });

  describe('Constructor', () => {
    it('should create service with provided client', () => {
      const service = new DownloadService(mockClient);
      assert.ok(service);
      assert.equal(service.client, mockClient);
    });

    it('should create service with default client if none provided', () => {
      const service = new DownloadService();
      assert.ok(service);
      assert.ok(service.client);
    });
  });

  describe('getCompleteSketchInfo', () => {
    it('should aggregate basic sketch data correctly', async () => {
      mockClient.getSketch = async (id) => ({
        visualID: id,
        title: 'Test Sketch',
        mode: 'p5js',
        userID: 456,
        parentID: null,
      });

      mockClient.getUser = async (id) => ({
        userID: id,
        fullname: 'Test User',
        username: 'testuser',
      });

      mockClient.getSketchCode = async () => [
        { codeID: 1, orderID: 0, title: 'sketch.js', code: '// code' },
      ];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.sketchId, 123);
      assert.equal(result.title, 'Test Sketch');
      assert.equal(result.author, 'Test User');
      assert.equal(result.mode, 'p5js');
      assert.equal(result.isFork, false);
      assert.equal(result.available, true);
      assert.equal(result.codeParts.length, 1);
    });

    it('should handle fork sketches and fetch parent info', async () => {
      mockClient.getSketch = async (id) => {
        if (id === 123) {
          return {
            visualID: 123,
            title: 'Forked Sketch',
            mode: 'p5js',
            userID: 456,
            parentID: 789,
          };
        } else {
          // Parent sketch
          return {
            visualID: 789,
            title: 'Original Sketch',
            mode: 'p5js',
            userID: 111,
          };
        }
      };

      mockClient.getUser = async (id) => {
        if (id === 456) {
          return { fullname: 'Forker User', username: 'forker' };
        } else {
          return { fullname: 'Original User', username: 'original' };
        }
      };

      mockClient.getSketchCode = async () => [{ code: '// forked code' }];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.isFork, true);
      assert.equal(result.parent.sketchID, 789);
      assert.equal(result.parent.author, 'Original User');
      assert.equal(result.parent.title, 'Original Sketch');
    });

    it('should handle hidden code gracefully', async () => {
      mockClient.getSketch = async () => ({
        visualID: 123,
        title: 'Private Sketch',
        userID: 456,
        mode: 'p5js',
      });

      mockClient.getUser = async () => ({
        fullname: 'Test User',
      });

      mockClient.getSketchCode = async () => {
        throw new Error('The source code for this sketch is hidden by the author.');
      };

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.available, false);
      assert.match(result.unavailableReason, /hidden/);
      assert.match(result.error, /hidden/); // Deprecated field
      assert.equal(result.codeParts.length, 0);
    });

    it('should handle private sketches', async () => {
      mockClient.getSketch = async () => {
        throw new Error('This sketch is private and cannot be downloaded.');
      };

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.available, false);
      assert.match(result.unavailableReason, /private/);
    });

    it('should handle not found sketches', async () => {
      mockClient.getSketch = async () => {
        throw new Error('Sketch not found.');
      };

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(999);

      assert.equal(result.sketchId, 999);
      assert.equal(result.available, false);
      assert.match(result.unavailableReason, /not found/);
    });

    it('should gracefully handle missing files and libraries', async () => {
      mockClient.getSketch = async () => ({
        visualID: 123,
        title: 'Test',
        userID: 456,
        mode: 'p5js',
      });

      mockClient.getUser = async () => ({ fullname: 'User' });
      mockClient.getSketchCode = async () => [{ code: '// code' }];
      mockClient.getSketchFiles = async () => {
        throw new Error('Files not available');
      };
      mockClient.getSketchLibraries = async () => {
        throw new Error('Libraries not available');
      };

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.available, true);
      assert.deepEqual(result.files, []);
      assert.deepEqual(result.libraries, []);
    });

    it('should handle parent sketch fetch failure gracefully', async () => {
      mockClient.getSketch = async (id) => {
        if (id === 123) {
          return {
            visualID: 123,
            title: 'Fork',
            userID: 456,
            parentID: 999,
            mode: 'p5js',
          };
        } else {
          throw new Error('Parent sketch not found');
        }
      };

      mockClient.getUser = async () => ({ fullname: 'Forker' });
      mockClient.getSketchCode = async () => [{ code: '// code' }];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123, { quiet: true });

      assert.equal(result.isFork, true);
      assert.equal(result.available, true);
      assert.equal(result.parent.sketchID, null);
    });

    it('should include full metadata in result', async () => {
      const fullMetadata = {
        visualID: 123,
        title: 'Test',
        description: 'A test sketch',
        tags: ['test', 'demo'],
        createdOn: '2024-01-01 00:00:00',
        userID: 456,
        mode: 'p5js',
        license: 'by-nc-sa',
      };

      mockClient.getSketch = async () => fullMetadata;
      mockClient.getUser = async () => ({ fullname: 'User' });
      mockClient.getSketchCode = async () => [];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.deepEqual(result.metadata, fullMetadata);
    });

    it('should use username as fallback if fullname not available', async () => {
      mockClient.getSketch = async () => ({
        visualID: 123,
        title: 'Test',
        userID: 456,
        mode: 'p5js',
      });

      mockClient.getUser = async () => ({
        userID: 456,
        username: 'testuser',
        fullname: '',
      });

      mockClient.getSketchCode = async () => [];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.author, 'testuser');
    });

    it('should use user_ID as fallback if no username available', async () => {
      mockClient.getSketch = async () => ({
        visualID: 123,
        title: 'Test',
        userID: 456,
        mode: 'p5js',
      });

      mockClient.getUser = async () => ({
        userID: 456,
      });

      mockClient.getSketchCode = async () => [];

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      assert.equal(result.author, 'user_456');
    });

    it('should fetch files and libraries in parallel', async () => {
      let filesCallTime;
      let librariesCallTime;
      const startTime = Date.now();

      mockClient.getSketch = async () => ({
        visualID: 123,
        title: 'Test',
        userID: 456,
        mode: 'p5js',
      });

      mockClient.getUser = async () => ({ fullname: 'User' });
      mockClient.getSketchCode = async () => [];

      mockClient.getSketchFiles = async () => {
        filesCallTime = Date.now() - startTime;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [{ name: 'file.png' }];
      };

      mockClient.getSketchLibraries = async () => {
        librariesCallTime = Date.now() - startTime;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [{ url: 'lib.js' }];
      };

      service = new DownloadService(mockClient);
      const result = await service.getCompleteSketchInfo(123);

      // Both should be called at approximately the same time (within 5ms)
      assert.ok(Math.abs(filesCallTime - librariesCallTime) < 5);
      assert.equal(result.files.length, 1);
      assert.equal(result.libraries.length, 1);
    });

    it('should suppress warnings when quiet option is true', async () => {
      const originalWarn = console.warn;
      let warnCalled = false;

      console.warn = () => {
        warnCalled = true;
      };

      mockClient.getSketch = async (id) => {
        if (id === 123) {
          return {
            visualID: 123,
            title: 'Fork',
            userID: 456,
            parentID: 999,
            mode: 'p5js',
          };
        }
        throw new Error('Parent not found');
      };

      mockClient.getUser = async () => ({ fullname: 'User' });
      mockClient.getSketchCode = async () => [];

      service = new DownloadService(mockClient);
      await service.getCompleteSketchInfo(123, { quiet: true });

      console.warn = originalWarn;
      assert.equal(warnCalled, false);
    });
  });
});
