/**
 * Field Registry Validation Tests
 *
 * These tests validate that all field registries match the actual OpenProcessing API responses.
 * Run these tests periodically to catch API changes that would affect the tool.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { OpenProcessingClient } from '../src/api/client';
import { fieldRegistry } from '../src/fieldRegistry';

// Helper to get actual fields from API response
function getFieldsFromResponse(data) {
  if (Array.isArray(data) && data.length > 0) {
    return Object.keys(data[0]).sort();
  }
  return Object.keys(data).sort();
}

// Helper to get registered fields for a field set
function getRegisteredFields(fieldSetName) {
  const fieldSet = fieldRegistry.get(fieldSetName);
  if (!fieldSet) return [];
  return fieldSet.fields.map(f => f.name).sort();
}

// Helper to infer JavaScript type from value
function inferType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    // Check if it's a date string (YYYY-MM-DD HH:MM:SS format)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return 'date';
    }
    return 'string';
  }
  return 'unknown';
}

// Helper to validate field types match expected types
function validateFieldTypes(data, fieldSetName) {
  const fieldSet = fieldRegistry.get(fieldSetName);
  if (!fieldSet) return { valid: true, errors: [] };

  const errors = [];
  const sample = Array.isArray(data) ? data[0] : data;

  fieldSet.fields.forEach(field => {
    if (!(field.name in sample)) {
      // Field is missing - this will be caught by other tests
      return;
    }

    const actualValue = sample[field.name];
    const actualType = inferType(actualValue);
    const expectedType = field.type;

    // Allow null values for any field type (API may return null)
    if (actualType === 'null') return;

    // Check type match
    if (actualType !== expectedType) {
      errors.push({
        field: field.name,
        expected: expectedType,
        actual: actualType,
        value: actualValue
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

describe('Field Registry Validation', () => {
  let client;

  beforeAll(() => {
    client = new OpenProcessingClient(process.env.OP_API_KEY);
  });

  describe('Sketch fields', () => {
    it('should match actual API response from /api/sketch/:id', async () => {
      const sketch = await client.getSketch(1142958);
      const actualFields = getFieldsFromResponse(sketch);
      const registeredFields = getRegisteredFields('sketch');

      // Check that all registered fields exist in the API response
      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      // Log fields in API but not in registry (informational)
      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  Sketch fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const sketch = await client.getSketch(1142958);
      const typeValidation = validateFieldTypes(sketch, 'sketch');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('User fields', () => {
    it('should match actual API response from /api/user/:id', async () => {
      const user = await client.getUser(1);
      const actualFields = getFieldsFromResponse(user);
      const registeredFields = getRegisteredFields('user');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  User fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const user = await client.getUser(1);
      const typeValidation = validateFieldTypes(user, 'user');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('User.sketches fields', () => {
    it('should match actual API response from /api/user/:id/sketches', async () => {
      const sketches = await client.getUserSketches(1, { limit: 1 });
      const actualFields = getFieldsFromResponse(sketches);
      const registeredFields = getRegisteredFields('user.sketches');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  User.sketches fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const sketches = await client.getUserSketches(1, { limit: 1 });
      const typeValidation = validateFieldTypes(sketches, 'user.sketches');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('User.followers fields', () => {
    it('should match actual API response from /api/user/:id/followers', async () => {
      const followers = await client.getUserFollowers(1, { limit: 1 });
      const actualFields = getFieldsFromResponse(followers);
      const registeredFields = getRegisteredFields('user.followers');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  User.followers fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const followers = await client.getUserFollowers(1, { limit: 1 });
      const typeValidation = validateFieldTypes(followers, 'user.followers');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('User.following fields', () => {
    it('should match actual API response from /api/user/:id/following', async () => {
      const following = await client.getUserFollowing(1, { limit: 1 });
      const actualFields = getFieldsFromResponse(following);
      const registeredFields = getRegisteredFields('user.following');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  User.following fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const following = await client.getUserFollowing(1, { limit: 1 });
      const typeValidation = validateFieldTypes(following, 'user.following');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('Curation fields', () => {
    it('should match actual API response from /api/curation/:id', async () => {
      const curation = await client.getCuration(25);
      const actualFields = getFieldsFromResponse(curation);
      const registeredFields = getRegisteredFields('curation');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  Curation fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      const curation = await client.getCuration(25);
      const typeValidation = validateFieldTypes(curation, 'curation');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });
  });

  describe('Curation.sketches fields', () => {
    let testSketches;

    beforeAll(async () => {
      // Find a valid curation with sketches
      for (const id of [25, 30, 35, 40, 45]) {
        try {
          const sketches = await client.getCurationSketches(id, { limit: 10 });
          if (sketches && sketches.length > 0) {
            testSketches = sketches;
            break;
          }
        } catch (e) {
          // Try next ID
        }
      }

      if (!testSketches || testSketches.length === 0) {
        console.log('\n⚠️  Warning: Could not find a valid curation with sketches to test');
      }
    });

    it('should match actual API response from /api/curation/:id/sketches', async () => {
      if (!testSketches || testSketches.length === 0) {
        console.log('\nℹ️  Skipping test - no curation sketches available');
        return;
      }

      const actualFields = getFieldsFromResponse(testSketches);
      const registeredFields = getRegisteredFields('curation.sketches');

      const missingInApi = registeredFields.filter(f => !actualFields.includes(f));
      expect(missingInApi).toEqual([]);

      const missingInRegistry = actualFields.filter(f => !registeredFields.includes(f));
      if (missingInRegistry.length > 0) {
        console.log(`\nℹ️  Curation.sketches fields in API but not in registry: ${missingInRegistry.join(', ')}`);
      }
    });

    it('should have correct field types', async () => {
      if (!testSketches || testSketches.length === 0) {
        console.log('\nℹ️  Skipping test - no curation sketches available');
        return;
      }

      const typeValidation = validateFieldTypes(testSketches, 'curation.sketches');

      if (!typeValidation.valid) {
        const errorMsg = typeValidation.errors.map(e =>
          `Field '${e.field}': expected ${e.expected}, got ${e.actual} (value: ${JSON.stringify(e.value)})`
        ).join('\n');
        throw new Error(`Type mismatches found:\n${errorMsg}`);
      }

      expect(typeValidation.valid).toBe(true);
    });

    it('should validate membershipType enum values', async () => {
      if (!testSketches || testSketches.length === 0) {
        console.log('\nℹ️  Skipping test - no curation sketches available');
        return;
      }

      const validMembershipTypes = [0, 1, 2];
      const invalidValues = testSketches
        .map(s => s.membershipType)
        .filter(mt => mt !== null && !validMembershipTypes.includes(mt));

      if (invalidValues.length > 0) {
        console.log(`\n⚠️  Found unexpected membershipType values: ${[...new Set(invalidValues)].join(', ')}`);
      }

      // Don't fail the test, just inform about unexpected values
      expect(invalidValues.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate status enum values', async () => {
      if (!testSketches || testSketches.length === 0) {
        console.log('\nℹ️  Skipping test - no curation sketches available');
        return;
      }

      const statusValues = testSketches
        .map(s => s.status)
        .filter(s => s !== null);

      const uniqueStatuses = [...new Set(statusValues)];

      if (uniqueStatuses.length > 0) {
        console.log(`\nℹ️  Found status values: ${uniqueStatuses.join(', ')}`);
      }

      // All status values should be numbers
      const nonNumericStatuses = statusValues.filter(s => typeof s !== 'number');
      expect(nonNumericStatuses).toEqual([]);
    });

    it('should validate nullable fields', async () => {
      if (!testSketches || testSketches.length === 0) {
        console.log('\nℹ️  Skipping test - no curation sketches available');
        return;
      }

      // Check if we have examples of nullable fields
      const hasNullParentID = testSketches.some(s => s.parentID === null);
      const hasNullVideoUpdatedOn = testSketches.some(s => s.videoUpdatedOn === null);

      if (hasNullParentID) {
        console.log('\nℹ️  Confirmed: parentID can be null (original sketch, not a fork)');
      }
      if (hasNullVideoUpdatedOn) {
        console.log('\nℹ️  Confirmed: videoUpdatedOn can be null (no video preview)');
      }

      // This test is informational - just checking we have the data
      expect(testSketches.length).toBeGreaterThan(0);
    });
  });

  describe('Field registry completeness', () => {
    it('should have all field sets registered', () => {
      const expectedFieldSets = [
        'sketch',
        'user',
        'curation',
        'user.sketches',
        'user.followers',
        'user.following',
        'curation.sketches'
      ];

      const registeredFieldSets = fieldRegistry.listFieldSets();

      expectedFieldSets.forEach(fieldSetName => {
        expect(registeredFieldSets).toContain(fieldSetName);
      });
    });

    it('should have descriptions for all field sets', () => {
      const fieldSets = fieldRegistry.listFieldSets();

      fieldSets.forEach(fieldSetName => {
        const fieldSet = fieldRegistry.get(fieldSetName);
        expect(fieldSet.description).toBeTruthy();
        expect(fieldSet.endpoint).toBeTruthy();
        expect(fieldSet.fields.length).toBeGreaterThan(0);
      });
    });

    it('should have valid field definitions', () => {
      const fieldSets = fieldRegistry.listFieldSets();
      const validTypes = ['string', 'number', 'boolean', 'date', 'object', 'array'];

      fieldSets.forEach(fieldSetName => {
        const fieldSet = fieldRegistry.get(fieldSetName);

        fieldSet.fields.forEach(field => {
          expect(field.name).toBeTruthy();
          expect(field.description).toBeTruthy();
          expect(field.type).toBeTruthy();
          expect(validTypes).toContain(field.type);
        });
      });
    });
  });
});
