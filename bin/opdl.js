#!/usr/bin/env node

const path = require('path');
const { version } = require(path.join(__dirname, '..', 'package.json'));
const { parseArgs } = require(path.join(__dirname, '..', 'src', 'cli.js'));
const { handleFieldsCommand } = require(path.join(__dirname, '..', 'src', 'commands', 'fields.js'));
const { handleSketchCommand } = require(path.join(__dirname, '..', 'src', 'commands', 'sketch.js'));
const { handleUserCommand } = require(path.join(__dirname, '..', 'src', 'commands', 'user.js'));
const { handleCurationCommand } = require(path.join(__dirname, '..', 'src', 'commands', 'curation.js'));

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

  try {
    const parsed = parseArgs(argv);

    switch (parsed.command) {
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

  Field Discovery:
    opdl fields                           List all available field sets
    opdl fields <fieldSet>                Show fields for a specific field set

  Sketch Commands:
    opdl <sketchId> [options]             Download sketch (shortcut)
    opdl sketch download <id> [options]   Download sketch files
    opdl sketch info <id> [options]       Display sketch metadata
    opdl <sketchId> --info <fields>       Display selected sketch fields

  User Commands:
    opdl user <userId> [options]          Display user information
    opdl user sketches <userId> [options] List user's sketches
    opdl user followers <userId> [opts]   List user's followers
    opdl user following <userId> [opts]   List users being followed

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

  Download Options (for sketch download):
    --outputDir <path>     Output directory for files
    --downloadThumbnail    Download thumbnail image
    --saveMetadata         Save metadata JSON file
    --skipAssets           Skip downloading asset files
    --vite                 Set up Vite project structure

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

  # User operations
  opdl user 1 --info fullname,website,memberSince
  opdl user sketches 1 --limit 10 --info visualID,title
  opdl user followers 1 --json

  # Curation operations
  opdl curation 12 --info title,description
  opdl curation sketches 12 --limit 20 --sort desc

ENVIRONMENT:
  OP_API_KEY    OpenProcessing API key (if required)

For more information, visit: https://github.com/SableRaf/opdl
`);
}

// Run the CLI
main();
