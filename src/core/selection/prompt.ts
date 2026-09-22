import { autoSystemPrompt } from '~/core/dictionary/prompt';
import { textSystemPrompt } from '~/core/prompt/style';
import type { SelectionTask } from './route';

export function selectionSystemPrompt(task: SelectionTask, target: string, base: string, repair = false): string {
  const system = task === 'auto' ? autoSystemPrompt(target, base) : textSystemPrompt(target, base);
  return repair ? system + '\nFORMAT CORRECTION: return plain text for the entire original source; no dictionary object or JSON wrapper.' : system;
}
