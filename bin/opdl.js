#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { version } = require(path.join(__dirname, '..', 'package.json'));
const { parseArgs } = require(path.join(__dirname, '..', 'src', 'cli', 'index.js'));
const { handleFieldsCommand } = require(path.join(__dirname, '..', 'src', 'cli', 'commands', 'fields.js'));
const { handleSketchCommand } = require(path.join(__dirname, '..', 'src', 'cli', 'commands', 'sketch.js'));
const { handleUserCommand } = require(path.join(__dirname, '..', 'src', 'cli', 'commands', 'user.js'));
const { handleCurationCommand } = require(path.join(__dirname, '..', 'src', 'cli', 'commands', 'curation.js'));
const { handleAuthCommand } = require(path.join(__dirname, '..', 'src', 'cli', 'commands', 'auth.js'));

function isLinkedLocalInstall() {
  try {
    const packageRoot = path.resolve(__dirname, '..');
    const globalNodeModulesRoot = execSync('npm root -g', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    if (!globalNodeModulesRoot) {
      return false;
    }

    const globalPackagePath = path.join(globalNodeModulesRoot, 'opdl');
    const stat = fs.lstatSync(globalPackagePath);
    if (!stat.isSymbolicLink()) {
      return false;
    }

    const linkedTarget = fs.realpathSync(globalPackagePath);
    return linkedTarget === packageRoot;
  } catch {
    return false;
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const argv = process.argv.slice(2);

  // Handle version flag
  if (argv.includes('--version') || argv.includes('-v')) {
    console.log(version);
    process.exit(0);
  }

  // Handle help flag
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (isLinkedLocalInstall()) {
    console.warn('\x1b[33m[opdl] Running local linked build (npm link). To unlink, run: $ npm unlink -g opdl\x1b[0m');
  }

  try {
    const parsed = parseArgs(argv);

    switch (parsed.command) {
      case 'auth':
        handleAuthCommand(parsed.options);
        break;

      case 'fields':
        await handleFieldsCommand({
          fieldSetName: parsed.id,
          json: parsed.options.json
        });
        break;

      case 'sketch':
        await handleSketchCommand({
          subcommand: parsed.subcommand,
          id: parsed.id,
          options: parsed.options
        });
        break;

      case 'user':
        await handleUserCommand({
          subcommand: parsed.subcommand,
          id: parsed.id,
          options: parsed.options
        });
        break;

      case 'curation':
        await handleCurationCommand({
          subcommand: parsed.subcommand,
          id: parsed.id,
          options: parsed.options
        });
        break;

      default:
        console.error(`Unknown command: ${parsed.command}`);
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
opdl - OpenProcessing Downloader CLI

USAGE:
  opdl <command> [options]
  opdl --version                        Display version number
  opdl --help                           Display this help message

COMMANDS:

  Authentication:
    opdl auth --token <token>             Save API token to ~/.opdlrc
    opdl auth --clear                     Remove saved token
    opdl auth                             Show token status

  Field Discovery:
    opdl fields                           List all available field sets
    opdl fields <fieldSet>                Show fields for a specific field set

  Sketch Commands:
    opdl <sketchId> [options]             Download sketch (shortcut)
    opdl sketch download <id> [options]   Download sketch files
    opdl sketch info <id> [options]       Display sketch metadata
    opdl <sketchId> --info <fields>       Display selected sketch fields

  User Commands:
    Users can be identified by @username (preferred) or numeric userID (deprecated).
    opdl user <user> [options]            Display user information
    opdl user sketches <user> [options]   List user's sketches
    opdl user followers <user> [opts]     List user's followers
    opdl user following <user> [opts]     List users being followed

  Curation Commands:
    opdl curation <id> [options]          Display curation information
    opdl curation sketches <id> [options] List sketches in curation

OPTIONS:

  Output Control:
    --info <fields|all>    Select specific fields to display (comma-separated)
    --json                 Output in JSON format
    --quiet                Suppress output messages

  List Options (for list commands):
    --limit <n>            Limit number of results
    --offset <n>           Skip first n results
    --sort <asc|desc>      Sort order

  Authentication:
    --token <value>        API bearer token (overrides OP_API_KEY and ~/.opdlrc)

  Download Options (for sketch download):
    --outputDir <path>     Output directory for files
    --downloadThumbnail    Download thumbnail image
    --saveMetadata         Save metadata JSON file
    --skipAssets           Skip downloading asset files
    --vite                 Set up Vite project structure
    --run                  Automatically run dev server after download

EXAMPLES:

  # Field discovery
  opdl fields
  opdl fields sketch
  opdl fields user.sketches

  # Sketch operations
  opdl 1142958 --info title,license,libraries
  opdl sketch download 1142958 --outputDir=./projects
  opdl 1142958 --outputDir=./projects --downloadThumbnail
  opdl 1142958 --vite
  opdl 1142958 --vite --run
  opdl 1142958 --run

  # User operations
  opdl user @Sableraph --info fullname,website,createdOn
  opdl user sketches @Sableraph --limit 10 --info visualID,title
  opdl user followers @Sableraph --json

  # Curation operations
  opdl curation 12 --info title,description
  opdl curation sketches 12 --limit 20 --sort desc

ENVIRONMENT:
  OP_API_KEY    OpenProcessing API bearer token

TOKEN RESOLUTION (highest to lowest priority):
  1. --token <value> flag
  2. OP_API_KEY environment variable
  3. token field in ~/.opdlrc (set via: opdl auth --token <value>)

For more information, visit: https://github.com/SableRaf/opdl
`);
}

// Run the CLI
main();
