import { describe, it, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import nock from 'nock';
import { OpenProcessingClient } from '../../src/api/client.js';

describe('OpenProcessingClient', () => {
  let client;
  const BASE_URL = 'https://openprocessing.org';

  beforeEach(() => {
    client = new OpenProcessingClient();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('HTTP 429 Rate Limit Handling', () => {
    it('should throw descriptive error for rate limit (429) on list endpoints', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/forks')
        .reply(429, { message: 'Too Many Requests' });

      await assert.rejects(
        async () => await client.getSketchForks(123),
        {
          message: /Rate limit exceeded: 40 calls\/minute/,
        }
      );
    });

    it('should include retry guidance in 429 error message', async () => {
      nock(BASE_URL)
        .get('/api/tags')
        .reply(429);

      try {
        await client.getTags();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.match(error.message, /Implement retry logic or reduce request frequency/);
        assert.equal(error.status, 429);
      }
    });
  });

  describe('getSketchCode', () => {
    it('should fetch sketch code successfully', async () => {
      const mockCode = [
        { codeID: 1, orderID: 0, title: 'sketch.js', code: '// code here' },
      ];

      nock(BASE_URL)
        .get('/api/sketch/123/code')
        .reply(200, mockCode);

      const result = await client.getSketchCode(123);
      assert.deepEqual(result, mockCode);
    });

    it('should throw error for hidden code', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/code')
        .reply(200, {
          success: false,
          message: 'Sketch source code is hidden.',
        });

      await assert.rejects(
        async () => await client.getSketchCode(123),
        {
          message: /source code for this sketch is hidden/,
        }
      );
    });

    it('should throw error for private sketch code', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/code')
        .reply(200, {
          success: false,
          message: 'This is a private sketch',
        });

      await assert.rejects(
        async () => await client.getSketchCode(123),
        {
          message: /private/,
        }
      );
    });
  });

  describe('getSketchForks', () => {
    it('should fetch sketch forks', async () => {
      const mockForks = [
        {
          visualID: 789,
          title: 'Fork 1',
          userID: 111,
          fullname: 'User One',
          createdOn: '2024-01-01 00:00:00',
          updatedOn: '2024-01-02 00:00:00',
        },
      ];

      nock(BASE_URL)
        .get('/api/sketch/123/forks')
        .reply(200, mockForks);

      const result = await client.getSketchForks(123);
      assert.deepEqual(result, mockForks);
    });

    it('should pass options as query params', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/forks')
        .query({ limit: 10, offset: 20, sort: 'asc' })
        .reply(200, []);

      const result = await client.getSketchForks(123, {
        limit: 10,
        offset: 20,
        sort: 'asc',
      });
      assert.deepEqual(result, []);
    });

    it('should handle empty forks list', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/forks')
        .reply(200, []);

      const result = await client.getSketchForks(123);
      assert.deepEqual(result, []);
    });
  });

  describe('getSketchHearts', () => {
    it('should fetch users who hearted sketch', async () => {
      const mockHearts = [
        {
          userID: 111,
          fullname: 'User One',
          createdOn: '2024-01-01 00:00:00',
        },
        {
          userID: 222,
          fullname: 'User Two',
          createdOn: '2024-01-02 00:00:00',
        },
      ];

      nock(BASE_URL)
        .get('/api/sketch/123/hearts')
        .reply(200, mockHearts);

      const result = await client.getSketchHearts(123);
      assert.deepEqual(result, mockHearts);
    });

    it('should pass pagination options', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/hearts')
        .query({ limit: 50, offset: 0, sort: 'desc' })
        .reply(200, []);

      const result = await client.getSketchHearts(123, {
        limit: 50,
        offset: 0,
        sort: 'desc',
      });
      assert.deepEqual(result, []);
    });
  });

  describe('getUserFollowers', () => {
    it('should fetch user followers', async () => {
      const mockFollowers = [
        {
          userID: 111,
          fullname: 'Follower One',
          membershipType: 0,
          followedOn: '2024-01-01 00:00:00',
        },
      ];

      nock(BASE_URL)
        .get('/api/user/456/followers')
        .reply(200, mockFollowers);

      const result = await client.getUserFollowers(456);
      assert.deepEqual(result, mockFollowers);
    });

    it('should handle username instead of ID', async () => {
      nock(BASE_URL)
        .get('/api/user/testuser/followers')
        .reply(200, []);

      const result = await client.getUserFollowers('testuser');
      assert.deepEqual(result, []);
    });

    it('should pass list options', async () => {
      nock(BASE_URL)
        .get('/api/user/456/followers')
        .query({ limit: 25, offset: 5, sort: 'asc' })
        .reply(200, []);

      await client.getUserFollowers(456, {
        limit: 25,
        offset: 5,
        sort: 'asc',
      });
    });
  });

  describe('getUserFollowing', () => {
    it('should fetch users followed by user', async () => {
      const mockFollowing = [
        {
          userID: 222,
          fullname: 'Followed User',
          membershipType: 1,
          followedOn: '2024-01-01 00:00:00',
        },
      ];

      nock(BASE_URL)
        .get('/api/user/456/following')
        .reply(200, mockFollowing);

      const result = await client.getUserFollowing(456);
      assert.deepEqual(result, mockFollowing);
    });

    it('should pass pagination parameters', async () => {
      nock(BASE_URL)
        .get('/api/user/456/following')
        .query({ limit: 100, offset: 50 })
        .reply(200, []);

      const result = await client.getUserFollowing(456, {
        limit: 100,
        offset: 50,
      });
      assert.deepEqual(result, []);
    });
  });

  describe('getUserHearts', () => {
    it('should fetch sketches hearted by user', async () => {
      const mockHearts = [
        {
          visualID: 789,
          title: 'Hearted Sketch',
          mode: 'p5js',
        },
        {
          visualID: 790,
          title: 'Another Heart',
          mode: 'processingjs',
        },
      ];

      nock(BASE_URL)
        .get('/api/user/456/hearts')
        .reply(200, mockHearts);

      const result = await client.getUserHearts(456);
      assert.deepEqual(result, mockHearts);
    });

    it('should handle empty hearts list', async () => {
      nock(BASE_URL)
        .get('/api/user/456/hearts')
        .reply(200, []);

      const result = await client.getUserHearts(456);
      assert.deepEqual(result, []);
    });

    it('should apply sort and limit options', async () => {
      nock(BASE_URL)
        .get('/api/user/456/hearts')
        .query({ limit: 10, sort: 'desc' })
        .reply(200, []);

      await client.getUserHearts(456, { limit: 10, sort: 'desc' });
    });
  });

  describe('getCurationSketches', () => {
    it('should fetch sketches in curation', async () => {
      const mockSketches = [
        {
          visualID: 123,
          title: 'Curation Sketch',
          description: 'A sketch in the curation',
          mode: 'p5js',
          userID: 456,
          fullname: 'Creator',
          submittedOn: '2024-01-01 00:00:00',
        },
      ];

      nock(BASE_URL)
        .get('/api/curation/789/sketches')
        .reply(200, mockSketches);

      const result = await client.getCurationSketches(789);
      assert.deepEqual(result, mockSketches);
    });

    it('should pass options correctly', async () => {
      nock(BASE_URL)
        .get('/api/curation/789/sketches')
        .query({ limit: 20, offset: 10 })
        .reply(200, []);

      await client.getCurationSketches(789, { limit: 20, offset: 10 });
    });
  });

  describe('getTags', () => {
    it('should fetch popular tags', async () => {
      const mockTags = [
        { tag: 'generative', quantity: 1500 },
        { tag: 'animation', quantity: 1200 },
        { tag: '3d', quantity: 800 },
      ];

      nock(BASE_URL)
        .get('/api/tags')
        .reply(200, mockTags);

      const result = await client.getTags();
      assert.deepEqual(result, mockTags);
    });

    it('should pass duration parameter', async () => {
      nock(BASE_URL)
        .get('/api/tags')
        .query({ duration: 'thisWeek' })
        .reply(200, []);

      await client.getTags({ duration: 'thisWeek' });
    });

    it('should pass all tags options', async () => {
      nock(BASE_URL)
        .get('/api/tags')
        .query({ duration: 'thisMonth', limit: 50, offset: 10 })
        .reply(200, []);

      await client.getTags({
        duration: 'thisMonth',
        limit: 50,
        offset: 10,
      });
    });

    it('should handle different duration values', async () => {
      const durations = ['thisWeek', 'thisMonth', 'thisYear', 'anytime'];

      for (const duration of durations) {
        nock(BASE_URL)
          .get('/api/tags')
          .query({ duration })
          .reply(200, []);

        const result = await client.getTags({ duration });
        assert.deepEqual(result, []);
      }
    });
  });

  describe('Existing Methods - Regression Tests', () => {
    it('getSketch should still work with validation', async () => {
      const mockSketch = {
        visualID: 123,
        title: 'Test Sketch',
        mode: 'p5js',
        userID: 456,
      };

      nock(BASE_URL)
        .get('/api/sketch/123')
        .reply(200, mockSketch);

      const result = await client.getSketch(123);
      assert.deepEqual(result, mockSketch);
    });

    it('getUser should handle errors properly', async () => {
      nock(BASE_URL)
        .get('/api/user/999')
        .reply(200, null);

      await assert.rejects(
        async () => await client.getUser(999),
        {
          message: /User not found/,
        }
      );
    });

    it('getSketchFiles should work with options', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/files')
        .query({ limit: 10 })
        .reply(200, []);

      const result = await client.getSketchFiles(123, { limit: 10 });
      assert.deepEqual(result, []);
    });

    it('getUserSketches should pass parameters', async () => {
      nock(BASE_URL)
        .get('/api/user/456/sketches')
        .query({ limit: 20, offset: 0, sort: 'desc' })
        .reply(200, []);

      await client.getUserSketches(456, {
        limit: 20,
        offset: 0,
        sort: 'desc',
      });
    });

    it('getCuration should validate response', async () => {
      const mockCuration = {
        curationID: 789,
        title: 'Test Curation',
        userID: 456,
      };

      nock(BASE_URL)
        .get('/api/curation/789')
        .reply(200, mockCuration);

      const result = await client.getCuration(789);
      assert.deepEqual(result, mockCuration);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      nock(BASE_URL)
        .get('/api/tags')
        .replyWithError('Network error');

      await assert.rejects(
        async () => await client.getTags(),
        {
          message: /Network error/,
        }
      );
    });

    it('should handle 500 server errors on list endpoints', async () => {
      nock(BASE_URL)
        .get('/api/sketch/123/forks')
        .reply(500, { error: 'Internal Server Error' });

      await assert.rejects(async () => await client.getSketchForks(123));
    });

    it('should pass through non-429 HTTP errors', async () => {
      nock(BASE_URL)
        .get('/api/user/456/hearts')
        .reply(404, { message: 'Not found' });

      await assert.rejects(async () => await client.getUserHearts(456));
    });
  });

  describe('Constructor', () => {
    it('should create client without API key', () => {
      const client = new OpenProcessingClient();
      assert.ok(client);
      assert.equal(client.apiKey, undefined);
    });

    it('should create client with API key', () => {
      const client = new OpenProcessingClient('test-api-key');
      assert.equal(client.apiKey, 'test-api-key');
    });

    it('should set Authorization header when API key provided', async () => {
      const client = new OpenProcessingClient('test-key');

      nock(BASE_URL, {
        reqheaders: {
          authorization: 'Bearer test-key',
        },
      })
        .get('/api/sketch/123')
        .reply(200, { visualID: 123 });

      await client.getSketch(123);
    });
  });
});
