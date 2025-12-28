/**
 * Field Registry System
 *
 * Provides centralized field definitions for all API entities and relations.
 * Supports field discovery, validation, and documentation.
 */

/**
 * @typedef {'sketch'|'user'|'curation'|'user.sketches'|'user.followers'|'user.following'|'curation.sketches'} FieldSetName
 */

/**
 * @typedef {'string'|'number'|'boolean'|'date'|'object'|'array'} FieldType
 */

/**
 * @typedef {Object} FieldDefinition
 * @property {string} name - Field name
 * @property {string} description - Field description
 * @property {FieldType} type - Field data type
 */

/**
 * @typedef {Object} FieldSet
 * @property {FieldSetName} name - Field set identifier
 * @property {string} description - Field set description
 * @property {FieldDefinition[]} fields - Available fields
 * @property {string} endpoint - Corresponding API endpoint
 */

class FieldRegistry {
  constructor() {
    /** @type {Map<FieldSetName, FieldSet>} */
    this.fieldSets = new Map();
  }

  /**
   * Register a field set
   * @param {FieldSet} fieldSet - Field set to register
   */
  register(fieldSet) {
    this.fieldSets.set(fieldSet.name, fieldSet);
  }

  /**
   * Get a field set by name
   * @param {FieldSetName} name - Field set name
   * @returns {FieldSet|undefined}
   */
  get(name) {
    return this.fieldSets.get(name);
  }

  /**
   * List all field set names
   * @returns {FieldSetName[]}
   */
  listFieldSets() {
    return Array.from(this.fieldSets.keys());
  }

  /**
   * Get fields for a field set
   * @param {FieldSetName} name - Field set name
   * @returns {FieldDefinition[]}
   */
  getFields(name) {
    return this.fieldSets.get(name)?.fields || [];
  }

  /**
   * Validate field names against a field set
   * @param {FieldSetName} fieldSetName - Field set to validate against
   * @param {string[]} fieldNames - Field names to validate
   * @returns {string[]} Invalid field names
   */
  validateFields(fieldSetName, fieldNames) {
    const fieldSet = this.get(fieldSetName);
    if (!fieldSet) return []; // Unknown field set, assume valid

    const validFields = new Set(fieldSet.fields.map((f) => f.name));
    const invalid = fieldNames.filter((name) => !validFields.has(name));
    return invalid;
  }
}

// Create singleton instance
const fieldRegistry = new FieldRegistry();

// Register sketch field set
fieldRegistry.register({
  name: 'sketch',
  description: 'Fields available for sketch objects',
  endpoint: '/api/sketch/:id',
  fields: [
    { name: 'visualID', description: 'Sketch ID', type: 'number' },
    { name: 'title', description: 'Sketch title', type: 'string' },
    { name: 'description', description: 'Sketch description', type: 'string' },
    { name: 'instructions', description: 'Usage instructions', type: 'string' },
    { name: 'license', description: 'License type', type: 'string' },
    { name: 'tags', description: 'Sketch tags', type: 'array' },
    { name: 'libraries', description: 'Libraries used', type: 'array' },
    { name: 'createdOn', description: 'Creation date', type: 'date' },
    { name: 'updatedOn', description: 'Last modification date', type: 'date' },
    { name: 'mode', description: 'Sketch mode (p5js, processingjs, etc.)', type: 'string' },
    { name: 'userID', description: 'Author user ID', type: 'number' },
    { name: 'parentID', description: 'Parent sketch ID if forked', type: 'number' },
    { name: 'isDraft', description: 'Whether sketch is a draft (0=false, 1=true)', type: 'number' },
    { name: 'isTemplate', description: 'Whether sketch is a template (0=false, 1=true)', type: 'number' },
    { name: 'isTutorial', description: 'Whether sketch is a tutorial (0=false, 1=true)', type: 'number' },
  ],
});

// Register user field set
fieldRegistry.register({
  name: 'user',
  description: 'Fields available for user objects',
  endpoint: '/api/user/:id',
  fields: [
    { name: 'userID', description: 'User ID', type: 'number' },
    { name: 'fullname', description: 'Full name', type: 'string' },
    { name: 'website', description: 'Website URL', type: 'string' },
    { name: 'location', description: 'Location', type: 'string' },
    { name: 'bio', description: 'User biography', type: 'string' },
    { name: 'createdOn', description: 'Account creation date', type: 'date' },
  ],
});

// Register curation field set
fieldRegistry.register({
  name: 'curation',
  description: 'Fields available for curation objects',
  endpoint: '/api/curation/:id',
  fields: [
    { name: 'curationID', description: 'Curation ID', type: 'number' },
    { name: 'title', description: 'Curation title', type: 'string' },
    { name: 'description', description: 'Curation description', type: 'string' },
    { name: 'createdOn', description: 'Creation date', type: 'date' },
    { name: 'userID', description: 'Creator user ID', type: 'number' },
  ],
});

// Register user.sketches field set
fieldRegistry.register({
  name: 'user.sketches',
  description: 'Fields available for user sketches list',
  endpoint: '/api/user/:id/sketches',
  fields: [
    { name: 'visualID', description: 'Sketch ID', type: 'number' },
    { name: 'title', description: 'Sketch title', type: 'string' },
    { name: 'description', description: 'Sketch description', type: 'string' },
    { name: 'instructions', description: 'Usage instructions', type: 'string' },
    { name: 'createdOn', description: 'Creation date', type: 'date' },
    { name: 'mode', description: 'Sketch mode (p5js, processingjs, html, applet)', type: 'string' },
  ],
});

// Register user.followers field set
fieldRegistry.register({
  name: 'user.followers',
  description: 'Fields available for user followers list',
  endpoint: '/api/user/:id/followers',
  fields: [
    { name: 'userID', description: 'User ID', type: 'number' },
    { name: 'fullname', description: 'Full name', type: 'string' },
    { name: 'followedOn', description: 'Date when follow occurred', type: 'date' },
    { name: 'membershipType', description: 'Membership type (enum: 0=free, 1=supporter, 2=patron, 3=unknown)', type: 'number' },
  ],
});

// Register user.following field set
fieldRegistry.register({
  name: 'user.following',
  description: 'Fields available for user following list',
  endpoint: '/api/user/:id/following',
  fields: [
    { name: 'userID', description: 'User ID', type: 'number' },
    { name: 'fullname', description: 'Full name', type: 'string' },
    { name: 'followedOn', description: 'Date when follow occurred', type: 'date' },
    { name: 'membershipType', description: 'Membership type (enum: 0=free, 1=supporter, 2=patron, 3=unknown)', type: 'number' },
  ],
});

// Register curation.sketches field set
fieldRegistry.register({
  name: 'curation.sketches',
  description: 'Fields available for curation sketches list',
  endpoint: '/api/curation/:id/sketches',
  fields: [
    { name: 'visualID', description: 'Sketch ID', type: 'number' },
    { name: 'title', description: 'Sketch title', type: 'string' },
    { name: 'description', description: 'Sketch description', type: 'string' },
    { name: 'instructions', description: 'Usage instructions', type: 'string' },
    { name: 'parentID', description: 'Parent sketch ID if forked (null if not forked)', type: 'number' },
    { name: 'mode', description: 'Sketch mode (p5js, processingjs, etc.)', type: 'string' },
    { name: 'createdOn', description: 'Creation date', type: 'date' },
    { name: 'submittedOn', description: 'Submission date', type: 'date' },
    { name: 'thumbnailUpdatedOn', description: 'Thumbnail update date', type: 'date' },
    { name: 'videoUpdatedOn', description: 'Video update date (null if no video)', type: 'date' },
    { name: 'userID', description: 'Author user ID', type: 'number' },
    { name: 'fullname', description: 'Author full name', type: 'string' },
    { name: 'membershipType', description: 'Author membership type (enum: 0=free, 1=supporter, 2=patron, 3=unknown)', type: 'number' },
    { name: 'status', description: 'Sketch status (0=hidden/draft, 1=published/visible)', type: 'number' },
  ],
});

module.exports = { fieldRegistry, FieldRegistry };
