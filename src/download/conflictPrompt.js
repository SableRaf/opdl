const prompts = require('prompts');

const CONFLICT_CHOICES = [
  { title: 'Skip this sketch', value: 'skip' },
  { title: 'Overwrite this sketch', value: 'overwrite' },
  { title: 'Skip all remaining existing sketches', value: 'skip-all' },
  { title: 'Overwrite all remaining existing sketches', value: 'overwrite-all' },
  { title: 'Cancel', value: 'cancel' },
];

const SINGLE_CONFLICT_CHOICES = [
  { title: 'Replace it (delete the existing folder)', value: 'replace' },
  { title: 'Merge into it (keep files not in this download)', value: 'merge' },
  { title: 'Cancel', value: 'cancel' },
];

/**
 * Ask what to do when a sketch directory already exists.
 * Non-interactive sessions (no TTY, or --quiet) default to skipping all
 * existing sketches (batch mode) or merging (single mode) so unattended runs
 * never destroy local edits.
 * @param {Object} params
 * @param {string} params.title - Sketch title shown in the prompt (batch mode only)
 * @param {string} [params.outputDir] - Output directory path (single mode only)
 * @param {boolean} [params.single] - Single-sketch mode (use different defaults and messages)
 * @param {boolean} [params.quiet] - Suppress output and skip prompting
 * @param {boolean} [params.isInteractive] - Override TTY detection (for tests)
 * @param {Function} [params.promptFn] - Prompt implementation (for tests)
 * @returns {Promise<'skip'|'overwrite'|'skip-all'|'overwrite-all'|'replace'|'merge'|'cancel'>}
 */
async function promptConflictAction({
  title,
  outputDir,
  single = false,
  quiet = false,
  isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
  promptFn = prompts,
} = {}) {
  if (quiet || !isInteractive) {
    if (!quiet && !single) {
      console.log(`opdl: Sketch "${title}" already exists. Skipping existing sketches (non-interactive session).`);
    }
    return single ? 'merge' : 'skip-all';
  }
  if (single) {
    console.log(`${outputDir} already exists.`);
  } else {
    console.log(`Sketch "${title}" already exists.`);
  }
  const response = await promptFn({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: single ? SINGLE_CONFLICT_CHOICES : CONFLICT_CHOICES,
    initial: 0,
  });
  // prompts resolves with no answer when the user aborts (Ctrl+C/Esc)
  return response?.action || 'cancel';
}

module.exports = { promptConflictAction, CONFLICT_CHOICES, SINGLE_CONFLICT_CHOICES };
