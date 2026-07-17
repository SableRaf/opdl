import { describe, it, expect, vi } from 'vitest';
import { promptFilenameConflictAction, CONFLICT_CHOICES, BATCH_CONFLICT_CHOICES } from '../../src/download/filenameConflictPrompt.js';

describe('promptFilenameConflictAction', () => {
  it('shows a select prompt defaulting to keep-both and returns the chosen action', async () => {
    const promptFn = vi.fn().mockResolvedValue({ action: 'overwrite-code' });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const action = await promptFilenameConflictAction({ filename: 'index.html', isInteractive: true, promptFn });
      expect(action).toBe('overwrite-code');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"index.html"'));
      const question = promptFn.mock.calls[0][0];
      expect(question).toMatchObject({ type: 'select', name: 'action', initial: 0 });
      expect(question.choices).toBe(CONFLICT_CHOICES);
      expect(question.choices[0]).toMatchObject({ value: 'keep-both' });
      expect(question.choices.map((choice) => choice.value)).toEqual(['keep-both', 'skip-upload', 'overwrite-code']);
    } finally { warnSpy.mockRestore(); }
  });

  it('treats an aborted prompt (Ctrl+C) as keep-both', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const action = await promptFilenameConflictAction({ filename: 'index.html', isInteractive: true, promptFn: vi.fn().mockResolvedValue({}) });
      expect(action).toBe('keep-both');
    } finally { warnSpy.mockRestore(); }
  });

  it('offers the "…for all remaining" choices in batch mode', async () => {
    const promptFn = vi.fn().mockResolvedValue({ action: 'keep-both-all' });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const action = await promptFilenameConflictAction({ filename: 'index.html', batch: true, isInteractive: true, promptFn });
      expect(action).toBe('keep-both-all');
      const question = promptFn.mock.calls[0][0];
      expect(question.choices).toBe(BATCH_CONFLICT_CHOICES);
      expect(question.choices.map((choice) => choice.value)).toEqual([
        'keep-both', 'skip-upload', 'overwrite-code',
        'keep-both-all', 'skip-upload-all', 'overwrite-code-all',
      ]);
    } finally { warnSpy.mockRestore(); }
  });

  it('defaults to keep-both-all in batch mode when non-interactive', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await promptFilenameConflictAction({ filename: 'index.html', batch: true, isInteractive: false, promptFn: vi.fn() })).toBe('keep-both-all');
    } finally { warnSpy.mockRestore(); }
  });

  it('defaults to keep-both without prompting when the session is non-interactive', async () => {
    const promptFn = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await promptFilenameConflictAction({ filename: 'index.html', isInteractive: false, promptFn })).toBe('keep-both');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      // --quiet suppresses even the warning and does not prompt.
      expect(await promptFilenameConflictAction({ filename: 'index.html', quiet: true, isInteractive: true, promptFn })).toBe('keep-both');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(promptFn).not.toHaveBeenCalled();
    } finally { warnSpy.mockRestore(); }
  });
});
