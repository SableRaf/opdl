/**
 * Fields Command Handler
 *
 * Handles the 'fields' command for discovering available fields.
 */

const { fieldRegistry } = require('../fieldRegistry');
const { formatFieldList, formatFieldSetList } = require('../formatters');

/**
 * Handle the fields command
 * @param {Object} args - Command arguments
 * @param {string} [args.fieldSetName] - Field set name to show details for
 * @param {boolean} [args.json] - Output in JSON format
 * @returns {Promise<void>}
 */
async function handleFieldsCommand(args) {
  if (!args.fieldSetName) {
    // List all field sets: opdl fields
    const fieldSets = fieldRegistry.listFieldSets();

    if (args.json) {
      console.log(JSON.stringify(fieldSets, null, 2));
    } else {
      console.log('Available field sets:\n');
      console.log(formatFieldSetList(fieldSets));
      console.log('\nUse "opdl fields <fieldSet>" to see available fields for a specific set.');
    }
    return;
  }

  // Show fields for specific field set: opdl fields sketch
  const fieldSet = fieldRegistry.get(args.fieldSetName);

  if (!fieldSet) {
    throw new Error(`Unknown field set: ${args.fieldSetName}`);
  }

  if (args.json) {
    console.log(JSON.stringify(fieldSet.fields, null, 2));
  } else {
    console.log(`Fields for ${args.fieldSetName}:\n`);
    console.log(`Description: ${fieldSet.description}`);
    console.log(`Endpoint: ${fieldSet.endpoint}\n`);
    console.log(formatFieldList(fieldSet.fields));
  }
}

module.exports = { handleFieldsCommand };
