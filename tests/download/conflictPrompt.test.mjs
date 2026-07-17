import { describe, it, expect, vi } from 'vitest';
import { promptConflictAction, CONFLICT_CHOICES } from '../../src/download/conflictPrompt.js';

describe('promptConflictAction', () => {
  it('shows a select prompt defaulting to skip and returns the chosen action', async () => {
    const promptFn = vi.fn().mockResolvedValue({ action: 'overwrite-all' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const action = await promptConflictAction({ title: 'example', isInteractive: true, promptFn });
      expect(action).toBe('overwrite-all');
      expect(logSpy).toHaveBeenCalledWith('Sketch "example" already exists.');
      const question = promptFn.mock.calls[0][0];
      expect(question).toMatchObject({ type: 'select', name: 'action', initial: 0 });
      expect(question.choices).toBe(CONFLICT_CHOICES);
      expect(question.choices[0]).toMatchObject({ title: 'Skip this sketch', value: 'skip' });
      expect(question.choices.map((choice) => choice.value)).toEqual(['skip', 'overwrite', 'skip-all', 'overwrite-all', 'cancel']);
    } finally { logSpy.mockRestore(); }
  });

  it('treats an aborted prompt (Ctrl+C) as cancel', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const action = await promptConflictAction({ title: 'example', isInteractive: true, promptFn: vi.fn().mockResolvedValue({}) });
      expect(action).toBe('cancel');
    } finally { logSpy.mockRestore(); }
  });

  it('defaults to skip-all without prompting when the session is non-interactive', async () => {
    const promptFn = vi.fn();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(await promptConflictAction({ title: 'example', isInteractive: false, promptFn })).toBe('skip-all');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(await promptConflictAction({ title: 'example', quiet: true, isInteractive: true, promptFn })).toBe('skip-all');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(promptFn).not.toHaveBeenCalled();
    } finally { logSpy.mockRestore(); }
  });
});
