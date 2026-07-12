const prompts = require('prompts');

const CONFLICT_CHOICES = [
  { title: 'Skip this sketch', value: 'skip' },
  { title: 'Overwrite this sketch', value: 'overwrite' },
  { title: 'Skip all remaining existing sketches', value: 'skip-all' },
  { title: 'Overwrite all remaining existing sketches', value: 'overwrite-all' },
  { title: 'Cancel', value: 'cancel' },
];

/**
 * Ask what to do when a sketch directory already exists.
 * Non-interactive sessions (no TTY, or --quiet) default to skipping all
 * existing sketches so unattended runs never destroy local edits.
 * @param {Object} params
 * @param {string} params.title - Sketch title shown in the prompt
 * @param {boolean} [params.quiet] - Suppress output and skip prompting
 * @param {boolean} [params.isInteractive] - Override TTY detection (for tests)
 * @param {Function} [params.promptFn] - Prompt implementation (for tests)
 * @returns {Promise<'skip'|'overwrite'|'skip-all'|'overwrite-all'|'cancel'>}
 */
async function promptConflictAction({
  title,
  quiet = false,
  isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
  promptFn = prompts,
} = {}) {
  if (quiet || !isInteractive) {
    if (!quiet) {
      console.log(`opdl: Sketch "${title}" already exists. Skipping existing sketches (non-interactive session).`);
    }
    return 'skip-all';
  }
  console.log(`Sketch "${title}" already exists.`);
  const response = await promptFn({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: CONFLICT_CHOICES,
    initial: 0,
  });
  // prompts resolves with no answer when the user aborts (Ctrl+C/Esc)
  return response?.action || 'cancel';
}

module.exports = { promptConflictAction, CONFLICT_CHOICES };
