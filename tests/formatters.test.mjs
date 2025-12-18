import { describe, it, expect } from 'vitest';
import {
  formatFieldList,
  formatFieldSetList,
  formatObject,
  formatArray,
  formatValue
} from '../src/formatters.js';

describe('Formatters', () => {
  describe('formatFieldList', () => {
    it('should format field definitions with aligned columns', () => {
      const fields = [
        { name: 'visualID', description: 'Sketch ID', type: 'number' },
        { name: 'title', description: 'Sketch title', type: 'string' },
        { name: 'libraries', description: 'Libraries used', type: 'array' }
      ];

      const result = formatFieldList(fields);

      expect(result).toContain('visualID');
      expect(result).toContain('number');
      expect(result).toContain('Sketch ID');
      expect(result).toContain('title');
      expect(result).toContain('string');
      expect(result).toContain('Sketch title');
      expect(result).toContain('libraries');
      expect(result).toContain('array');
      expect(result).toContain('Libraries used');
    });

    it('should handle empty field list', () => {
      const result = formatFieldList([]);
      expect(result).toBe('No fields available.');
    });

    it('should handle null or undefined input', () => {
      expect(formatFieldList(null)).toBe('No fields available.');
      expect(formatFieldList(undefined)).toBe('No fields available.');
    });

    it('should pad field names correctly', () => {
      const fields = [
        { name: 'id', description: 'ID', type: 'number' },
        { name: 'username', description: 'Username', type: 'string' }
      ];

      const result = formatFieldList(fields);
      const lines = result.split('\n');

      // Both lines should have the same prefix length due to padding
      expect(lines[0].indexOf('number')).toBe(lines[1].indexOf('string'));
    });
  });

  describe('formatFieldSetList', () => {
    it('should format field set names with indentation', () => {
      const fieldSets = ['sketch', 'user', 'curation', 'user.sketches'];

      const result = formatFieldSetList(fieldSets);

      expect(result).toContain('  sketch');
      expect(result).toContain('  user');
      expect(result).toContain('  curation');
      expect(result).toContain('  user.sketches');
    });

    it('should handle empty field set list', () => {
      const result = formatFieldSetList([]);
      expect(result).toBe('No field sets available.');
    });

    it('should handle null or undefined input', () => {
      expect(formatFieldSetList(null)).toBe('No field sets available.');
      expect(formatFieldSetList(undefined)).toBe('No field sets available.');
    });

    it('should separate field sets with newlines', () => {
      const fieldSets = ['sketch', 'user', 'curation'];
      const result = formatFieldSetList(fieldSets);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3);
    });
  });

  describe('formatObject', () => {
    it('should format object as JSON when json option is true', () => {
      const data = { title: 'My Sketch', license: 'CC BY-SA' };
      const result = formatObject(data, { json: true });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(data);
    });

    it('should format object as key-value pairs in table format', () => {
      const data = {
        visualID: 1142958,
        title: 'My Sketch',
        license: 'CC BY-SA'
      };

      const result = formatObject(data);

      expect(result).toContain('visualID: 1142958');
      expect(result).toContain('title: My Sketch');
      expect(result).toContain('license: CC BY-SA');
    });

    it('should handle arrays in object values', () => {
      const data = {
        title: 'My Sketch',
        libraries: ['p5js', 'p5.sound']
      };

      const result = formatObject(data);

      expect(result).toContain('title: My Sketch');
      expect(result).toContain('libraries: p5js, p5.sound');
    });

    it('should handle nested objects', () => {
      const data = {
        title: 'My Sketch',
        user: { userID: 1, username: 'testuser' }
      };

      const result = formatObject(data);

      expect(result).toContain('title: My Sketch');
      expect(result).toContain('user: {"userID":1,"username":"testuser"}');
    });

    it('should handle null and undefined values', () => {
      const data = {
        title: 'My Sketch',
        description: null,
        website: undefined
      };

      const result = formatObject(data);

      expect(result).toContain('title: My Sketch');
      expect(result).toContain('description:');
      expect(result).toContain('website:');
    });

    it('should default to table format when json option is not provided', () => {
      const data = { title: 'Test' };
      const result = formatObject(data);

      expect(result).toBe('title: Test');
    });
  });

  describe('formatArray', () => {
    it('should format array as JSON when json option is true', () => {
      const data = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' }
      ];

      const result = formatArray(data, { json: true });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
    });

    it('should format array as table with headers', () => {
      const data = [
        { visualID: 1, title: 'Sketch 1' },
        { visualID: 2, title: 'Sketch 2' }
      ];

      const result = formatArray(data);

      // Should contain headers
      expect(result).toContain('visualID');
      expect(result).toContain('title');

      // Should contain separator line
      expect(result).toContain('---');

      // Should contain data
      expect(result).toContain('1');
      expect(result).toContain('Sketch 1');
      expect(result).toContain('2');
      expect(result).toContain('Sketch 2');
    });

    it('should align columns correctly', () => {
      const data = [
        { id: 1, name: 'Short' },
        { id: 123, name: 'Very Long Name' }
      ];

      const result = formatArray(data);
      const lines = result.split('\n');

      // All data lines should have the same structure
      expect(lines.length).toBeGreaterThan(2); // header + separator + rows
    });

    it('should handle empty array', () => {
      const result = formatArray([]);
      expect(result).toBe('No results found.');
    });

    it('should handle null or undefined values in array items', () => {
      const data = [
        { id: 1, name: 'Test', value: null },
        { id: 2, name: null, value: undefined }
      ];

      const result = formatArray(data);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('value');
    });

    it('should handle arrays with single item', () => {
      const data = [{ id: 1, name: 'Single' }];
      const result = formatArray(data);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('1');
      expect(result).toContain('Single');
    });

    it('should default to table format when json option is not provided', () => {
      const data = [{ id: 1 }];
      const result = formatArray(data);

      // Should not be JSON (no braces)
      expect(result).not.toContain('[');
      expect(result).not.toContain('{');
      // Should be table format
      expect(result).toContain('id');
    });
  });

  describe('formatValue', () => {
    it('should format null as empty string', () => {
      expect(formatValue(null)).toBe('');
    });

    it('should format undefined as empty string', () => {
      expect(formatValue(undefined)).toBe('');
    });

    it('should format arrays as comma-separated values', () => {
      expect(formatValue(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should format empty arrays', () => {
      expect(formatValue([])).toBe('');
    });

    it('should format objects as JSON strings', () => {
      const obj = { foo: 'bar', baz: 123 };
      const result = formatValue(obj);

      expect(result).toBe(JSON.stringify(obj));
    });

    it('should format strings as-is', () => {
      expect(formatValue('hello')).toBe('hello');
    });

    it('should format numbers as strings', () => {
      expect(formatValue(123)).toBe('123');
      expect(formatValue(45.67)).toBe('45.67');
    });

    it('should format booleans as strings', () => {
      expect(formatValue(true)).toBe('true');
      expect(formatValue(false)).toBe('false');
    });

    it('should format zero correctly', () => {
      expect(formatValue(0)).toBe('0');
    });

    it('should format empty string correctly', () => {
      expect(formatValue('')).toBe('');
    });
  });
});
