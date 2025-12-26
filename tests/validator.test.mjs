import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  validateSketch,
  validateUser,
  validateCuration,
  validateId,
  validateResponse,
  isPrivateResponse,
  isCodeHidden,
  VALIDATION_REASONS,
  MESSAGES,
} from '../src/validator.js';

describe('Validator Module', () => {
  describe('isPrivateResponse', () => {
    it('should detect private sketch response', () => {
      const response = {
        success: false,
        message: 'This is a private sketch',
      };
      assert.equal(isPrivateResponse(response), true);
    });

    it('should detect private sketch with case variations', () => {
      const response = {
        success: false,
        message: 'Private Sketch - access denied',
      };
      assert.equal(isPrivateResponse(response), true);
    });

    it('should not detect non-private responses', () => {
      const response = {
        success: true,
        data: { id: 123 },
      };
      assert.equal(isPrivateResponse(response), false);
    });

    it('should handle null response', () => {
      assert.equal(isPrivateResponse(null), false);
    });

    it('should handle undefined response', () => {
      assert.equal(isPrivateResponse(undefined), false);
    });
  });

  describe('isCodeHidden', () => {
    it('should detect hidden code response', () => {
      const response = {
        success: false,
        message: 'Sketch source code is hidden.',
      };
      assert.equal(isCodeHidden(response), true);
    });

    it('should not detect non-hidden code responses', () => {
      const response = {
        success: false,
        message: 'Some other error',
      };
      assert.equal(isCodeHidden(response), false);
    });

    it('should handle null response', () => {
      assert.equal(isCodeHidden(null), false);
    });

    it('should handle undefined response', () => {
      assert.equal(isCodeHidden(undefined), false);
    });
  });

  describe('validateResponse', () => {
    it('should return not_found for null response', () => {
      const result = validateResponse(null, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
      assert.equal(result.message, MESSAGES.NOT_FOUND_SKETCH);
      assert.equal(result.canRetry, false);
    });

    it('should return not_found for undefined response', () => {
      const result = validateResponse(undefined, 'user');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
      assert.equal(result.message, MESSAGES.NOT_FOUND_USER);
    });

    it('should detect private resource', () => {
      const response = {
        success: false,
        message: 'This is a private sketch',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.PRIVATE);
      assert.equal(result.message, MESSAGES.PRIVATE_SKETCH);
      assert.equal(result.canRetry, false);
    });

    it('should detect hidden code', () => {
      const response = {
        success: false,
        message: 'Sketch source code is hidden.',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.CODE_HIDDEN);
      assert.equal(result.message, MESSAGES.HIDDEN_CODE);
      assert.equal(result.canRetry, false);
    });

    it('should detect generic API error', () => {
      const response = {
        success: false,
        message: 'Some API error',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      assert.equal(result.message, 'Some API error');
      assert.equal(result.canRetry, true);
    });

    it('should return null for valid response', () => {
      const response = {
        success: true,
        data: { id: 123 },
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result, null);
    });
  });

  describe('validateSketch', () => {
    describe('metadata validation', () => {
      it('should validate valid metadata response', () => {
        const response = {
          id: 123,
          title: 'Test Sketch',
          userID: 456,
          mode: 'p5js',
        };
        const result = validateSketch(response, { type: 'metadata' });
        assert.equal(result.valid, true);
        assert.equal(result.reason, null);
        assert.equal(result.message, '');
        assert.deepEqual(result.data, response);
      });

      it('should reject private sketch metadata', () => {
        const response = {
          success: false,
          message: 'This is a private sketch',
        };
        const result = validateSketch(response, { type: 'metadata' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.PRIVATE);
        assert.equal(result.message, MESSAGES.PRIVATE_SKETCH);
      });

      it('should reject null metadata', () => {
        const result = validateSketch(null, { type: 'metadata' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
        assert.equal(result.message, MESSAGES.NOT_FOUND_SKETCH);
      });
    });

    describe('code validation', () => {
      it('should validate valid code response', () => {
        const response = [
          { filename: 'sketch.js', content: 'console.log("hello");' },
        ];
        const result = validateSketch(response, { type: 'code' });
        assert.equal(result.valid, true);
        assert.equal(result.reason, null);
        assert.deepEqual(result.data, response);
      });

      it('should validate empty code array', () => {
        const response = [];
        const result = validateSketch(response, { type: 'code' });
        assert.equal(result.valid, true);
      });

      it('should reject hidden code', () => {
        const response = {
          success: false,
          message: 'Sketch source code is hidden.',
        };
        const result = validateSketch(response, { type: 'code' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.CODE_HIDDEN);
        assert.equal(result.message, MESSAGES.HIDDEN_CODE);
      });

      it('should reject private sketch code', () => {
        const response = {
          success: false,
          message: 'private sketch',
        };
        const result = validateSketch(response, { type: 'code' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.PRIVATE);
      });

      it('should reject non-array code response', () => {
        const response = { not: 'an array' };
        const result = validateSketch(response, { type: 'code' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      });
    });

    describe('files validation', () => {
      it('should validate valid files response', () => {
        const response = [
          { filename: 'image.png', url: 'https://example.com/image.png' },
        ];
        const result = validateSketch(response, { type: 'files' });
        assert.equal(result.valid, true);
      });

      it('should validate empty files array', () => {
        const response = [];
        const result = validateSketch(response, { type: 'files' });
        assert.equal(result.valid, true);
      });

      it('should handle null files response', () => {
        const result = validateSketch(null, { type: 'files' });
        assert.equal(result.valid, false);
        assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
      });
    });

    describe('libraries validation', () => {
      it('should validate valid libraries response', () => {
        const response = [
          { name: 'p5.sound', version: '1.0.0' },
        ];
        const result = validateSketch(response, { type: 'libraries' });
        assert.equal(result.valid, true);
      });

      it('should validate empty libraries array', () => {
        const response = [];
        const result = validateSketch(response, { type: 'libraries' });
        assert.equal(result.valid, true);
      });
    });
  });

  describe('validateUser', () => {
    it('should validate valid user response', () => {
      const response = {
        id: 123,
        username: 'testuser',
        fullname: 'Test User',
      };
      const result = validateUser(response);
      assert.equal(result.valid, true);
      assert.equal(result.reason, null);
      assert.equal(result.message, '');
    });

    it('should reject null user response', () => {
      const result = validateUser(null);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
      assert.equal(result.message, MESSAGES.NOT_FOUND_USER);
    });

    it('should reject private user', () => {
      const response = {
        success: false,
        message: 'This is a private sketch', // User endpoints might use similar messages
      };
      const result = validateUser(response);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.PRIVATE);
    });

    it('should reject array response', () => {
      const response = [{ id: 123 }];
      const result = validateUser(response);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      assert.equal(result.message, 'Unexpected response format for user');
    });
  });

  describe('validateCuration', () => {
    it('should validate valid curation response', () => {
      const response = {
        id: 123,
        title: 'Test Curation',
        description: 'A test curation',
      };
      const result = validateCuration(response);
      assert.equal(result.valid, true);
      assert.equal(result.reason, null);
      assert.equal(result.message, '');
    });

    it('should reject null curation response', () => {
      const result = validateCuration(null);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.NOT_FOUND);
      assert.equal(result.message, MESSAGES.NOT_FOUND_CURATION);
    });

    it('should reject private curation', () => {
      const response = {
        success: false,
        message: 'This is a private sketch',
      };
      const result = validateCuration(response);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.PRIVATE);
    });

    it('should reject array response', () => {
      const response = [{ id: 123 }];
      const result = validateCuration(response);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      assert.equal(result.message, 'Unexpected response format for curation');
    });
  });

  describe('validateId', () => {
    it('should validate valid numeric ID', () => {
      const result = validateId(123);
      assert.equal(result.valid, true);
      assert.equal(result.reason, null);
      assert.equal(result.data, 123);
    });

    it('should validate valid string ID', () => {
      const result = validateId('456');
      assert.equal(result.valid, true);
      assert.equal(result.data, 456);
    });

    it('should reject zero', () => {
      const result = validateId(0);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
      assert.equal(result.message, MESSAGES.INVALID_ID);
    });

    it('should reject negative numbers', () => {
      const result = validateId(-1);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });

    it('should reject non-numeric strings', () => {
      const result = validateId('abc');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });

    it('should reject null', () => {
      const result = validateId(null);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });

    it('should reject undefined', () => {
      const result = validateId(undefined);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });

    it('should reject NaN', () => {
      const result = validateId(NaN);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });

    it('should reject Infinity', () => {
      const result = validateId(Infinity);
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.INVALID_ID);
    });
  });

  describe('canRetry flag', () => {
    it('should set canRetry to true for API errors', () => {
      const response = {
        success: false,
        message: 'Internal server error',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.canRetry, true);
    });

    it('should set canRetry to false for private resources', () => {
      const response = {
        success: false,
        message: 'This is a private sketch',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.canRetry, false);
    });

    it('should set canRetry to false for hidden code', () => {
      const response = {
        success: false,
        message: 'Sketch source code is hidden.',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.canRetry, false);
    });

    it('should set canRetry to false for not found', () => {
      const result = validateResponse(null, 'sketch');
      assert.equal(result.canRetry, false);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed response objects', () => {
      const response = { random: 'data', without: 'success' };
      const result = validateSketch(response, { type: 'metadata' });
      // Should treat as valid since success !== false
      assert.equal(result.valid, true);
    });

    it('should handle response with success=true', () => {
      const response = {
        success: true,
        id: 123,
        title: 'Test',
      };
      const result = validateSketch(response, { type: 'metadata' });
      assert.equal(result.valid, true);
    });

    it('should handle empty string message', () => {
      const response = {
        success: false,
        message: '',
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      assert.equal(result.message, MESSAGES.API_ERROR);
    });

    it('should handle missing message field in error', () => {
      const response = {
        success: false,
      };
      const result = validateResponse(response, 'sketch');
      assert.equal(result.valid, false);
      assert.equal(result.reason, VALIDATION_REASONS.API_ERROR);
      assert.equal(result.message, MESSAGES.API_ERROR);
    });
  });

  describe('partial availability scenarios', () => {
    it('should handle public sketch with hidden code', () => {
      const metadataResponse = {
        id: 123,
        title: 'Public Sketch',
        userID: 456,
      };
      const codeResponse = {
        success: false,
        message: 'Sketch source code is hidden.',
      };

      const metadataResult = validateSketch(metadataResponse, { type: 'metadata' });
      const codeResult = validateSketch(codeResponse, { type: 'code' });

      assert.equal(metadataResult.valid, true);
      assert.equal(codeResult.valid, false);
      assert.equal(codeResult.reason, VALIDATION_REASONS.CODE_HIDDEN);
    });

    it('should handle user with some sketches skipped', () => {
      const userResponse = {
        id: 123,
        username: 'testuser',
        fullname: 'Test User',
      };
      const userResult = validateUser(userResponse);
      assert.equal(userResult.valid, true);
      // Note: Skipped sketches would be handled at a higher level
    });
  });
});
