import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { selectFields } from '../src/fieldSelector.js';
import { fieldRegistry } from '../src/fieldRegistry.js';

describe('Field Selector', () => {
  // Suppress console.warn during tests
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('selectFields with single object', () => {
    it('should select specified fields from object', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        description: 'A test sketch',
        license: 'CC BY-SA'
      };

      const result = selectFields(data, {
        fields: 'visualID,title',
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({
        visualID: 1142958,
        title: 'My Sketch'
      });
    });

    it('should handle comma-separated fields with spaces', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        license: 'CC BY-SA'
      };

      const result = selectFields(data, {
        fields: 'visualID, title, license',
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({
        visualID: 1142958,
        title: 'My Sketch',
        license: 'CC BY-SA'
      });
    });

    it('should handle array of field names', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        license: 'CC BY-SA'
      };

      const result = selectFields(data, {
        fields: ['visualID', 'license'],
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({
        visualID: 1142958,
        license: 'CC BY-SA'
      });
    });

    it('should handle "all" keyword with registered field set', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        description: 'Test',
        license: 'CC BY-SA',
        extraField: 'ignored'
      };

      const result = selectFields(data, {
        fields: 'all',
        fieldSetName: 'sketch'
      });

      // Should include all registered fields that exist in data
      expect(result).toHaveProperty('visualID');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('license');
    });

    it('should handle "all" keyword with unregistered field set', () => {
      const data = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      };

      const result = selectFields(data, {
        fields: 'all',
        fieldSetName: 'unknown'
      });

      // Should include all keys from the object
      expect(result).toEqual(data);
    });

    it('should handle empty array with "all" keyword and unregistered field set', () => {
      const result = selectFields([], {
        fields: 'all',
        fieldSetName: 'unknown'
      });

      // Should return empty array without crashing
      expect(result).toEqual([]);
    });

    it('should ignore non-existent fields', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch'
      };

      const result = selectFields(data, {
        fields: 'visualID,nonExistent,title',
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({
        visualID: 1142958,
        title: 'My Sketch'
      });
    });

    it('should handle nested field access with dot notation', () => {
      const data = {
        id: 1,
        title: 'My Item',
        user: {
          userID: 1,
          username: 'testuser',
          fullname: 'Test User'
        }
      };

      // Use unknown field set to bypass validation
      const result = selectFields(data, {
        fields: 'id,user.username',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual({
        id: 1,
        user: {
          username: 'testuser'
        }
      });
    });

    it('should handle deeply nested fields', () => {
      const data = {
        id: 1,
        metadata: {
          author: {
            name: 'John',
            contact: {
              email: 'john@example.com'
            }
          }
        }
      };

      const result = selectFields(data, {
        fields: 'metadata.author.contact.email',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual({
        metadata: {
          author: {
            contact: {
              email: 'john@example.com'
            }
          }
        }
      });
    });

    it('should handle undefined nested values gracefully', () => {
      const data = {
        id: 1,
        user: {
          username: 'test'
        }
      };

      const result = selectFields(data, {
        fields: 'user.profile.bio',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual({
        user: {
          profile: {
            bio: undefined
          }
        }
      });
    });

    it('should warn about invalid fields', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch'
      };

      selectFields(data, {
        fields: 'visualID,invalidField',
        fieldSetName: 'sketch'
      });

      // Check that console.warn was called
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toContain('Unknown fields');
    });
  });

  describe('selectFields with array of objects', () => {
    it('should select fields from all objects in array', () => {
      const data = [
        { visualID: 1, title: 'Sketch 1', license: 'CC BY-SA' },
        { visualID: 2, title: 'Sketch 2', license: 'MIT' },
        { visualID: 3, title: 'Sketch 3', license: 'GPL' }
      ];

      const result = selectFields(data, {
        fields: 'visualID,title',
        fieldSetName: 'user.sketches'
      });

      expect(result).toEqual([
        { visualID: 1, title: 'Sketch 1' },
        { visualID: 2, title: 'Sketch 2' },
        { visualID: 3, title: 'Sketch 3' }
      ]);
    });

    it('should handle "all" keyword with array', () => {
      const data = [
        { userID: 1, fullname: 'User One' },
        { userID: 2, fullname: 'User Two' }
      ];

      const result = selectFields(data, {
        fields: 'all',
        fieldSetName: 'user.followers'
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('userID');
      expect(result[0]).toHaveProperty('fullname');
    });

    it('should handle nested fields in array', () => {
      const data = [
        {
          id: 1,
          title: 'Item 1',
          user: { username: 'user1' }
        },
        {
          id: 2,
          title: 'Item 2',
          user: { username: 'user2' }
        }
      ];

      // Use unknown field set to bypass validation
      const result = selectFields(data, {
        fields: 'id,user.username',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual([
        { id: 1, user: { username: 'user1' } },
        { id: 2, user: { username: 'user2' } }
      ]);
    });

    it('should handle empty array', () => {
      const result = selectFields([], {
        fields: 'visualID,title',
        fieldSetName: 'user.sketches'
      });

      expect(result).toEqual([]);
    });

    it('should handle array with inconsistent field presence', () => {
      const data = [
        { id: 1, name: 'Item 1', optional: 'present' },
        { id: 2, name: 'Item 2' }, // missing optional field
        { id: 3, name: 'Item 3', optional: 'also present' }
      ];

      const result = selectFields(data, {
        fields: 'id,name,optional',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual([
        { id: 1, name: 'Item 1', optional: 'present' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3', optional: 'also present' }
      ]);
    });
  });

  describe('field validation', () => {
    it('should filter out invalid fields for known field sets', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        invalidField: 'should be filtered'
      };

      const result = selectFields(data, {
        fields: 'visualID,title,invalidField',
        fieldSetName: 'sketch'
      });

      expect(result).not.toHaveProperty('invalidField');
      expect(result).toHaveProperty('visualID');
      expect(result).toHaveProperty('title');
    });

    it('should not validate for unknown field sets', () => {
      const data = {
        customField1: 'value1',
        customField2: 'value2'
      };

      const result = selectFields(data, {
        fields: 'customField1,customField2',
        fieldSetName: 'unknownFieldSet'
      });

      expect(result).toEqual({
        customField1: 'value1',
        customField2: 'value2'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle object with no matching fields', () => {
      const data = {
        field1: 'value1',
        field2: 'value2'
      };

      const result = selectFields(data, {
        fields: 'nonExistent1,nonExistent2',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual({});
    });

    it('should handle empty field list', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch'
      };

      const result = selectFields(data, {
        fields: '',
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({});
    });

    it('should handle single field selection', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        license: 'CC BY-SA'
      };

      const result = selectFields(data, {
        fields: 'title',
        fieldSetName: 'sketch'
      });

      expect(result).toEqual({
        title: 'My Sketch'
      });
    });

    it('should preserve field values including falsy values', () => {
      const data = {
        id: 0,
        name: '',
        active: false,
        count: null,
        description: undefined
      };

      const result = selectFields(data, {
        fields: 'id,name,active,count,description',
        fieldSetName: 'unknown'
      });

      expect(result).toEqual({
        id: 0,
        name: '',
        active: false,
        count: null,
        description: undefined
      });
    });
  });
});
