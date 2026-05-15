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
const c = require(path.join(__dirname, '..', 'src', 'cli', 'colors.js'));

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
    console.warn(c.yellow('[opdl] Running local linked build (npm link). To unlink, run: $ npm unlink -g opdl'));
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
  const bin = c.green;
  const cmd = (s) => c.bold(s);
  const flag = c.cyan;
  const arg = c.yellow;
  const h = (s) => c.bold(s);
  const sub = (s) => c.bold(s);
  const dim = c.dim;

  console.log(`
${c.bold('opdl')} - OpenProcessing Downloader CLI

${h('USAGE:')}
  ${bin('opdl')} ${arg('<command>')} ${arg('[options]')}
  ${bin('opdl')} ${flag('--version')}                        Display version number
  ${bin('opdl')} ${flag('--help')}                           Display this help message

${h('COMMANDS:')}

  ${sub('Authentication:')}
    ${bin('opdl')} ${cmd('auth')} ${flag('--token')} ${arg('<token>')}             Save API token to ~/.opdlrc
    ${bin('opdl')} ${cmd('auth')} ${flag('--clear')}                     Remove saved token
    ${bin('opdl')} ${cmd('auth')}                             Show token status

  ${sub('Field Discovery:')}
    ${bin('opdl')} ${cmd('fields')}                           List all available field sets
    ${bin('opdl')} ${cmd('fields')} ${arg('<fieldSet>')}                Show fields for a specific field set

  ${sub('Sketch Commands:')}
    ${bin('opdl')} ${arg('<sketchId>')} ${arg('[options]')}             Download sketch (shortcut)
    ${bin('opdl')} ${cmd('sketch download')} ${arg('<id>')} ${arg('[options]')}   Download sketch files
    ${bin('opdl')} ${cmd('sketch info')} ${arg('<id>')} ${arg('[options]')}       Display sketch metadata
    ${bin('opdl')} ${arg('<sketchId>')} ${flag('--info')} ${arg('<fields>')}       Display selected sketch fields

  ${sub('User Commands:')}
    ${dim('Users can be identified by @username (preferred) or numeric userID (deprecated).')}
    ${bin('opdl')} ${cmd('user')} ${arg('<user>')} ${arg('[options]')}            Display user information
    ${bin('opdl')} ${cmd('user sketches')} ${arg('<user>')} ${arg('[options]')}   List user's sketches
    ${bin('opdl')} ${cmd('user followers')} ${arg('<user>')} ${arg('[opts]')}     List user's followers
    ${bin('opdl')} ${cmd('user following')} ${arg('<user>')} ${arg('[opts]')}     List users being followed

  ${sub('Curation Commands:')}
    ${bin('opdl')} ${cmd('curation')} ${arg('<id>')} ${arg('[options]')}          Display curation information
    ${bin('opdl')} ${cmd('curation sketches')} ${arg('<id>')} ${arg('[options]')} List sketches in curation

${h('OPTIONS:')}

  ${sub('Output Control:')}
    ${flag('--info')} ${arg('<fields|all>')}    Select specific fields to display (comma-separated)
    ${flag('--json')}                 Output in JSON format
    ${flag('--quiet')}                Suppress output messages

  ${sub('List Options (for list commands):')}
    ${flag('--limit')} ${arg('<n>')}            Limit number of results
    ${flag('--offset')} ${arg('<n>')}           Skip first n results
    ${flag('--sort')} ${arg('<asc|desc>')}      Sort order

  ${sub('Authentication:')}
    ${flag('--token')} ${arg('<value>')}        API bearer token (overrides OP_API_KEY and ~/.opdlrc)

  ${sub('Download Options (for sketch download):')}
    ${flag('--outputDir')} ${arg('<path>')}     Output directory for files
    ${flag('--downloadThumbnail')}    Download thumbnail image
    ${flag('--saveMetadata')}         Save metadata JSON file
    ${flag('--skipAssets')}           Skip downloading asset files
    ${flag('--vite')}                 Set up Vite project structure
    ${flag('--run')}                  Automatically run dev server after download

${h('EXAMPLES:')}

  ${dim('# Field discovery')}
  ${dim('opdl fields')}
  ${dim('opdl fields sketch')}
  ${dim('opdl fields user.sketches')}

  ${dim('# Sketch operations')}
  ${dim('opdl 1142958 --info title,license,libraries')}
  ${dim('opdl sketch download 1142958 --outputDir=./projects')}
  ${dim('opdl 1142958 --outputDir=./projects --downloadThumbnail')}
  ${dim('opdl 1142958 --vite')}
  ${dim('opdl 1142958 --vite --run')}
  ${dim('opdl 1142958 --run')}

  ${dim('# User operations')}
  ${dim('opdl user @Sableraph --info fullname,website,createdOn')}
  ${dim('opdl user sketches @Sableraph --limit 10 --info visualID,title')}
  ${dim('opdl user followers @Sableraph --json')}

  ${dim('# Curation operations')}
  ${dim('opdl curation 12 --info title,description')}
  ${dim('opdl curation sketches 12 --limit 20 --sort desc')}

${h('ENVIRONMENT:')}
  ${arg('OP_API_KEY')}    OpenProcessing API bearer token

${h('TOKEN RESOLUTION')} ${dim('(highest to lowest priority)')}:
  1. ${flag('--token')} ${arg('<value>')} flag
  2. ${arg('OP_API_KEY')} environment variable
  3. ${arg('token')} field in ~/.opdlrc (set via: ${bin('opdl')} ${cmd('auth')} ${flag('--token')} ${arg('<value>')})

For more information, visit: https://github.com/SableRaf/opdl
`);
}

// Run the CLI
main();
