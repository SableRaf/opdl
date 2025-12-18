const { fieldRegistry } = require('./fieldRegistry');

/**
 * Select specific fields from data objects
 * @param {Object|Array} data - Single object or array of objects
 * @param {Object} options - Selection options
 * @param {string|string[]} options.fields - Fields to select ('all', comma-separated string, or array)
 * @param {string} options.fieldSetName - Name of the field set for validation
 * @returns {Object|Array} Data with only selected fields
 */
function selectFields(data, options) {
  // Parse field list
  let fieldList;
  if (options.fields === 'all') {
    const fieldSet = fieldRegistry.get(options.fieldSetName);
    fieldList = fieldSet
      ? fieldSet.fields.map(f => f.name)
      : Object.keys(Array.isArray(data) ? data[0] : data);
  } else if (typeof options.fields === 'string') {
    fieldList = options.fields.split(',').map(f => f.trim());
  } else {
    fieldList = options.fields;
  }

  // Validate fields
  const invalid = fieldRegistry.validateFields(options.fieldSetName, fieldList);
  if (invalid.length > 0) {
    console.warn(`Warning: Unknown fields will be ignored: ${invalid.join(', ')}`);
    fieldList = fieldList.filter(f => !invalid.includes(f));
  }

  // Select fields from data
  if (Array.isArray(data)) {
    return data.map(item => selectFieldsFromObject(item, fieldList));
  } else {
    return selectFieldsFromObject(data, fieldList);
  }
}

/**
 * Select specific fields from a single object
 * @param {Object} obj - Source object
 * @param {string[]} fields - Field names to select
 * @returns {Object} New object with only selected fields
 */
function selectFieldsFromObject(obj, fields) {
  const result = {};

  for (const field of fields) {
    // Support nested fields with dot notation
    if (field.includes('.')) {
      const value = getNestedValue(obj, field);
      setNestedValue(result, field, value);
    } else {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
  }

  return result;
}

/**
 * Get a nested value from an object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path (e.g., 'user.username')
 * @returns {*} The nested value
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set a nested value in an object using dot notation
 * @param {Object} obj - Target object
 * @param {string} path - Dot-separated path (e.g., 'user.username')
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

module.exports = {
  selectFields,
};
