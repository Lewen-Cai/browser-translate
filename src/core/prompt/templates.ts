import { DEFAULT_STYLE_PROMPT } from './style';

export interface BasePromptTemplate {
  id: string;
  name: string;
  body: string;
}

/** Separate from the removed pre-v0.1.8 promptTemplates schema. */
export interface PromptSettings {
  activeId: string;
  templates: BasePromptTemplate[];
}

export const DEFAULT_PROMPT_ID = 'default';
export const MAX_PROMPT_TEMPLATES = 20;
export const MAX_PROMPT_LENGTH = 12000;
export const MAX_PROMPT_NAME = 80;

export function defaultPromptSettings(): PromptSettings {
  return { activeId: DEFAULT_PROMPT_ID, templates: [] };
}

/** Repair untrusted imports, preserving identity to avoid storage/write loops. */
export function normalizePromptSettings(value: unknown): PromptSettings {
  if (!value || typeof value !== 'object') return defaultPromptSettings();
  const input = value as Partial<PromptSettings>;
  const templates: BasePromptTemplate[] = [];
  const ids = new Set([DEFAULT_PROMPT_ID]);
  if (Array.isArray(input.templates)) {
    for (const row of input.templates) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' ||
          !row.id || row.id.length > 100 || ids.has(row.id) ||
          typeof row.name !== 'string' || !row.name.trim() || row.name.length > MAX_PROMPT_NAME ||
          typeof row.body !== 'string' || !row.body.trim() || row.body.length > MAX_PROMPT_LENGTH) continue;
      ids.add(row.id);
      templates.push({ id: row.id, name: row.name, body: row.body });
      if (templates.length === MAX_PROMPT_TEMPLATES) break;
    }
  }
  const activeId = typeof input.activeId === 'string' && ids.has(input.activeId)
    ? input.activeId : DEFAULT_PROMPT_ID;
  const normalized = { activeId, templates };
  return JSON.stringify(value) === JSON.stringify(normalized) ? value as PromptSettings : normalized;
}

/** Custom text REPLACES the base, not the internal output protocol. No interpolation. */
export function resolveBasePrompt(settings: PromptSettings): string {
  return settings.templates.find((p) => p.id === settings.activeId)?.body ?? DEFAULT_STYLE_PROMPT;
}
