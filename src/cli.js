/**
 * CLI Parser
 *
 * Parses command-line arguments into structured command objects.
 */

/**
 * @typedef {Object} ParsedCommand
 * @property {'fields'|'sketch'|'user'|'curation'} command - Main command
 * @property {string} [subcommand] - Subcommand (download, info, sketches, etc.)
 * @property {string|number} [id] - Entity ID
 * @property {Object} options - Command options
 * @property {string} [options.info] - Comma-separated fields or "all"
 * @property {boolean} [options.json] - Output in JSON format
 * @property {boolean} [options.quiet] - Suppress output messages
 * @property {string} [options.outputDir] - Output directory for downloads
 * @property {number} [options.limit] - Limit number of results
 * @property {number} [options.offset] - Skip first n results
 * @property {'asc'|'desc'} [options.sort] - Sort order
 * @property {boolean} [options.downloadThumbnail] - Download thumbnail
 * @property {boolean} [options.saveMetadata] - Save metadata file
 * @property {boolean} [options.downloadAssets] - Download assets
 * @property {boolean} [options.addSourceComments] - Add source attribution comments
 * @property {boolean} [options.createLicenseFile] - Create license file
 * @property {boolean} [options.createOpMetadata] - Create OP metadata file
 * @property {boolean} [options.vite] - Set up Vite project structure
 */

/**
 * Parse command-line arguments
 * @param {string[]} argv - Command-line arguments
 * @returns {ParsedCommand} Parsed command object
 */
function parseArgs(argv) {
  if (argv.length === 0) {
    throw new Error('No command provided');
  }

  // Handle: opdl fields [fieldSetName]
  if (argv[0] === 'fields') {
    return {
      command: 'fields',
      id: argv[1], // field set name is optional
      options: parseOptions(argv.slice(1)),
    };
  }

  // Handle: opdl sketch <subcommand> <id> [options]
  if (argv[0] === 'sketch') {
    const subcommand = argv[1];
    const id = argv[2];
    return {
      command: 'sketch',
      subcommand,
      id,
      options: parseOptions(argv.slice(3)),
    };
  }

  // Handle: opdl user <subcommand> <id> [options]
  // or: opdl user <id> [options] (for user info)
  if (argv[0] === 'user') {
    // Check if argv[1] is a subcommand or an ID
    const possibleSubcommands = ['sketches', 'followers', 'following'];
    let subcommand = null;
    let id = null;
    let optionsStart = null;

    if (possibleSubcommands.includes(argv[1])) {
      subcommand = argv[1];
      id = argv[2];
      optionsStart = 3;
    } else {
      // argv[1] is the user ID
      id = argv[1];
      optionsStart = 2;
    }

    return {
      command: 'user',
      subcommand,
      id,
      options: parseOptions(argv.slice(optionsStart)),
    };
  }

  // Handle: opdl curation <subcommand> <id> [options]
  // or: opdl curation <id> [options] (for curation info)
  if (argv[0] === 'curation') {
    const possibleSubcommands = ['sketches'];
    let subcommand = null;
    let id = null;
    let optionsStart = 1;

    if (possibleSubcommands.includes(argv[1])) {
      subcommand = argv[1];
      id = argv[2];
      optionsStart = 3;
    } else {
      id = argv[1];
      optionsStart = 2;
    }

    return {
      command: 'curation',
      subcommand,
      id,
      options: parseOptions(argv.slice(optionsStart)),
    };
  }

  // Handle shortcut: opdl <id> [options]
  // Assumes first arg is sketch ID if numeric
  if (!isNaN(Number(argv[0]))) {
    const hasInfoFlag = argv.some((a) => a.startsWith('--info'));
    return {
      command: 'sketch',
      subcommand: hasInfoFlag ? 'info' : 'download',
      id: argv[0],
      options: parseOptions(argv.slice(1)),
    };
  }

  throw new Error(`Unknown command: ${argv[0]}`);
}

/**
 * Parse option flags
 * @param {string[]} args - Arguments to parse
 * @returns {ParsedCommand['options']} Parsed options
 */
function parseOptions(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Skip if this looks like a positional argument (field set name, etc.)
    if (!arg.startsWith('--') && !arg.startsWith('-')) {
      continue;
    }

    // Boolean flags
    if (arg === '--json') options.json = true;
    else if (arg === '--quiet') options.quiet = true;
    else if (arg === '--downloadThumbnail') options.downloadThumbnail = true;
    else if (arg === '--saveMetadata') options.saveMetadata = true;
    else if (arg === '--downloadAssets') options.downloadAssets = true;
    else if (arg === '--skipAssets') options.downloadAssets = false;
    else if (arg === '--addSourceComments') options.addSourceComments = true;
    else if (arg === '--skipComments') options.addSourceComments = false;
    else if (arg === '--createLicenseFile') options.createLicenseFile = true;
    else if (arg === '--skipLicense') options.createLicenseFile = false;
    else if (arg === '--createOpMetadata') options.createOpMetadata = true;
    else if (arg === '--skipOpMetadata') options.createOpMetadata = false;
    else if (arg === '--vite') options.vite = true;
    // Value flags with = syntax
    else if (arg.startsWith('--info=')) {
      options.info = arg.split('=')[1];
    } else if (arg.startsWith('--outputDir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--offset=')) {
      options.offset = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--sort=')) {
      options.sort = arg.split('=')[1];
    }
    // Value flags with space syntax
    else if (arg === '--info') {
      options.info = args[++i];
    } else if (arg === '--outputDir') {
      options.outputDir = args[++i];
    } else if (arg === '--limit') {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--offset') {
      options.offset = parseInt(args[++i], 10);
    } else if (arg === '--sort') {
      options.sort = args[++i];
    }
  }

  return options;
}

module.exports = { parseArgs, parseOptions };
