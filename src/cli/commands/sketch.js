const { OpenProcessingClient } = require('../../api/client');
const { selectFields } = require('../fieldSelector');
const { formatObject } = require('../formatters');
const { validateId } = require('../../api/validator');
const opdl = require('../../index');

/**
 * Handle sketch-related commands
 * @param {Object} args - Command arguments
 * @param {string} args.subcommand - Subcommand ('download' or 'info')
 * @param {string|number} args.id - Sketch ID
 * @param {Object} args.options - Command options
 */
async function handleSketchCommand(args) {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);

  // Validate sketch ID
  const idValidation = validateId(args.id);
  if (!idValidation.valid) {
    throw new Error(idValidation.message);
  }
  const sketchId = idValidation.data;

  if (args.subcommand === 'info' || args.options.info) {
    // Get sketch metadata (client validates the response)
    const sketch = await client.getSketch(sketchId);

    // Select fields if --info specified
    let output = sketch;
    if (args.options.info) {
      output = selectFields(sketch, {
        fields: args.options.info,
        fieldSetName: 'sketch'
      });
    }

    // Format and print
    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else {
    // Download sketch (use existing opdl functionality)
    const downloadOptions = {
      outputDir: args.options.outputDir,
      downloadAssets: !args.options.skipAssets,
      downloadThumbnail: args.options.downloadThumbnail !== false,
      saveMetadata: args.options.saveMetadata !== false,
      addSourceComments: args.options.addSourceComments !== false,
      createLicenseFile: true,
      createOpMetadata: true,
      quiet: args.options.quiet || false,
      vite: args.options.vite || false,
      run: args.options.run || false,
    };

    const result = await opdl(sketchId, downloadOptions);

    if (!result.success) {
      throw new Error(result.sketchInfo.error || 'Failed to download sketch');
    }

    // Print success message before starting server (since server blocks)
    if (!args.options.quiet && !args.options.run) {
      console.log(`Sketch downloaded to: ${result.outputPath}`);
    }
  }
}

module.exports = {
  handleSketchCommand,
};
