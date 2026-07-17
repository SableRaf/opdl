const { OpenProcessingClient } = require('../../api/client');
const { selectFields } = require('../fieldSelector');
const { formatObject } = require('../formatters');
const { validateId, VALIDATION_REASONS } = require('../../api/validator');
const opdl = require('../../index');
const { getToken } = require('../../config');
const { reportHealthAfterFailure } = require('./health');

/**
 * Handle sketch-related commands
 * @param {Object} args - Command arguments
 * @param {string} args.subcommand - Subcommand ('download' or 'info')
 * @param {string|number} args.id - Sketch ID
 * @param {Object} args.options - Command options
 */
async function handleSketchCommand(args) {
  const token = getToken(args.options.token);
  const client = new OpenProcessingClient(token);

  // Validate sketch ID
  const idValidation = validateId(args.id);
  if (!idValidation.valid) {
    throw new Error(idValidation.message);
  }
  const sketchId = idValidation.data;

  if (args.subcommand === 'info' || args.options.info) {
    const sketch = await client.getSketch(sketchId);

    let output = sketch;
    if (args.options.info) {
      output = selectFields(sketch, {
        fields: args.options.info,
        fieldSetName: 'sketch'
      });
    }

    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else {
    const downloadOptions = {
      outputDir: args.options.outputDir,
      downloadAssets: !args.options.skipAssets,
      downloadThumbnail: args.options.downloadThumbnail !== false,
      saveMetadata: args.options.saveMetadata !== false,
      addSourceComments: args.options.addSourceComments !== false,
      createLicenseFile: true,
      createOpMetadata: true,
      quiet: args.options.quiet || false,
      verbose: args.options.verbose || false,
      vite: args.options.vite || false,
      run: args.options.run || false,
    };

    const result = await opdl(sketchId, { ...downloadOptions, token });

    if (!result.success) {
      // Expected conditions (missing/private/hidden sketches) are the user's
      // problem, not the API's — only probe health for genuinely unexpected
      // failures so we can tell an API outage apart from a plain bug.
      const expectedReasons = [
        VALIDATION_REASONS.NOT_FOUND,
        VALIDATION_REASONS.PRIVATE,
        VALIDATION_REASONS.CODE_HIDDEN,
        VALIDATION_REASONS.DELETED,
        VALIDATION_REASONS.INVALID_ID,
      ];
      if (!expectedReasons.includes(result.unavailableReason)) {
        await reportHealthAfterFailure({ token, quiet: args.options.quiet });
      }
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
