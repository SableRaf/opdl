/**
 * Output Formatters
 *
 * Provides formatting functions for different output modes (table, JSON, etc.)
 */

/**
 * Format field list for discovery output
 * @param {import('./fieldRegistry').FieldDefinition[]} fields - Fields to format
 * @returns {string} Formatted field list
 */
function formatFieldList(fields) {
  if (!fields || fields.length === 0) {
    return 'No fields available.';
  }

  const maxNameLength = Math.max(...fields.map((f) => f.name.length));

  return fields
    .map((f) => {
      const name = f.name.padEnd(maxNameLength);
      const type = f.type.padEnd(8);
      return `  ${name}  ${type}  ${f.description}`;
    })
    .join('\n');
}

/**
 * Format field set list for discovery output
 * @param {import('./fieldRegistry').FieldSetName[]} fieldSets - Field set names to format
 * @returns {string} Formatted field set list
 */
function formatFieldSetList(fieldSets) {
  if (!fieldSets || fieldSets.length === 0) {
    return 'No field sets available.';
  }

  return fieldSets.map((name) => `  ${name}`).join('\n');
}

/**
 * Format a single object for display
 * @param {Record<string, any>} data - Object to format
 * @param {Object} options - Formatting options
 * @param {boolean} [options.json] - Output as JSON
 * @returns {string} Formatted output
 */
function formatObject(data, options = {}) {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  // Table format - key: value pairs
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    const formattedValue = formatValue(value);
    lines.push(`${key}: ${formattedValue}`);
  }
  return lines.join('\n');
}

/**
 * Format an array for display
 * @param {any[]} data - Array to format
 * @param {Object} options - Formatting options
 * @param {boolean} [options.json] - Output as JSON
 * @returns {string} Formatted output
 */
function formatArray(data, options = {}) {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  if (!data || data.length === 0) {
    return 'No results found.';
  }

  // Table format with headers
  const keys = Object.keys(data[0]);
  const columnWidths = keys.map((key) =>
    Math.max(key.length, ...data.map((item) => String(item[key] || '').length))
  );

  // Header
  const header = keys.map((key, i) => key.padEnd(columnWidths[i])).join('  ');
  const separator = columnWidths.map((w) => '-'.repeat(w)).join('  ');

  // Rows
  const rows = data.map((item) =>
    keys.map((key, i) => String(item[key] || '').padEnd(columnWidths[i])).join('  ')
  );

  return [header, separator, ...rows].join('\n');
}

/**
 * Format a value for display
 * @param {any} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

module.exports = {
  formatFieldList,
  formatFieldSetList,
  formatObject,
  formatArray,
  formatValue,
};
