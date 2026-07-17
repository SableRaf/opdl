const prompts = require('prompts');

const CONFLICT_CHOICES = [
  { title: 'Keep both (rename the uploaded file)', value: 'keep-both' },
  { title: 'Keep the code object (skip the uploaded file)', value: 'skip-upload' },
  { title: 'Overwrite the code object with the uploaded file', value: 'overwrite-code' },
];

// During a curation download the same collision can recur across many
// sketches. These "…for all remaining" variants let the user answer once and
// have that decision applied to the rest of the run (mirrors conflictPrompt's
// skip-all / overwrite-all).
const BATCH_CONFLICT_CHOICES = [
  { title: 'Keep both (rename the uploaded file)', value: 'keep-both' },
  { title: 'Keep the code object (skip the uploaded file)', value: 'skip-upload' },
  { title: 'Overwrite the code object with the uploaded file', value: 'overwrite-code' },
  { title: 'Keep both for all remaining collisions', value: 'keep-both-all' },
  { title: 'Keep the code object for all remaining collisions', value: 'skip-upload-all' },
  { title: 'Overwrite the code object for all remaining collisions', value: 'overwrite-code-all' },
];

/**
 * Ask what to do when an uploaded file shares a name with a code object.
 *
 * A sketch's uploaded files can include a leftover (e.g. an old index.html)
 * that collides with the authoritative code-object file of the same name.
 * Writing it blindly clobbers the code object; skipping it silently hides the
 * conflict. So we surface it and let the user decide.
 *
 * Non-interactive sessions (no TTY, or --quiet — which is how curation batch
 * downloads always run) default to 'keep-both': nothing is lost and the
 * code object keeps its canonical name.
 *
 * @param {Object} params
 * @param {string} params.filename - The colliding filename (e.g. 'index.html')
 * @param {boolean} [params.quiet] - Suppress prompting (unattended runs)
 * @param {boolean} [params.batch] - Offer "…for all remaining" choices too
 *   (used by curation downloads so the user can decide the policy once)
 * @param {boolean} [params.isInteractive] - Override TTY detection (for tests)
 * @param {Function} [params.promptFn] - Prompt implementation (for tests)
 * @returns {Promise<'keep-both'|'skip-upload'|'overwrite-code'|
 *   'keep-both-all'|'skip-upload-all'|'overwrite-code-all'>}
 */
async function promptFilenameConflictAction({
  filename,
  quiet = false,
  batch = false,
  isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY),
  promptFn = prompts,
} = {}) {
  if (quiet || !isInteractive) {
    if (!quiet) {
      console.warn(
        `opdl: WARNING — "${filename}" exists as both a code object and an uploaded file. ` +
          'Keeping the code object; the uploaded file will be saved under a different name.'
      );
    }
    return batch ? 'keep-both-all' : 'keep-both';
  }
  console.warn(
    `opdl: WARNING — "${filename}" exists as both a code object and an uploaded file.`
  );
  const response = await promptFn({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: batch ? BATCH_CONFLICT_CHOICES : CONFLICT_CHOICES,
    initial: 0,
  });
  // prompts resolves with no answer when the user aborts (Ctrl+C/Esc);
  // fall back to the safe default that loses nothing.
  return response?.action || 'keep-both';
}

module.exports = { promptFilenameConflictAction, CONFLICT_CHOICES, BATCH_CONFLICT_CHOICES };
