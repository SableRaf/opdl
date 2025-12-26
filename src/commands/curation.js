const { OpenProcessingClient } = require('../api/client');
const { selectFields } = require('../fieldSelector');
const { formatObject, formatArray } = require('../formatters');
const { validateId } = require('../validator');

/**
 * Handle curation-related commands
 * @param {Object} args - Command arguments
 * @param {string} [args.subcommand] - Subcommand ('sketches' or undefined for info)
 * @param {string|number} args.id - Curation ID
 * @param {Object} args.options - Command options
 */
async function handleCurationCommand(args) {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);

  // Validate curation ID
  const idValidation = validateId(args.id);
  if (!idValidation.valid) {
    throw new Error(idValidation.message);
  }
  const curationId = idValidation.data;

  const listOptions = {
    limit: args.options.limit,
    offset: args.options.offset,
    sort: args.options.sort
  };

  if (!args.subcommand) {
    // opdl curation <id> --info ... (client validates the response)
    const curation = await client.getCuration(curationId);

    let output = curation;
    if (args.options.info) {
      output = selectFields(curation, {
        fields: args.options.info,
        fieldSetName: 'curation'
      });
    }

    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'sketches') {
    // opdl curation sketches <id> [--info ...]
    const sketches = await client.getCurationSketches(curationId, listOptions);

    let output = sketches;
    if (args.options.info) {
      output = selectFields(sketches, {
        fields: args.options.info,
        fieldSetName: 'curation.sketches'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else {
    throw new Error(`Unknown curation subcommand: ${args.subcommand}`);
  }
}

module.exports = {
  handleCurationCommand,
};
