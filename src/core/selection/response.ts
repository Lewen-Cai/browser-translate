import { parseDictionaryEntry } from '~/core/dictionary/parse';
import type { SelectionTask } from './route';

export type ResultFormat = 'text' | 'dictionary';
export interface SelectionResult { full: string; format: ResultFormat }

/** Bump when response acceptance rules change; old unchecked caches cannot bypass them. */
export function responseCachePrompt(systemPrompt: string): string {
  return `validated-output:v1\n${systemPrompt}`;
}

export class InvalidModelOutputError extends Error {
  constructor() { super('The model returned an invalid translation format.'); }
}

function structuredStart(text: string): boolean {
  return /^(?:[[{]|```)/u.test(text.trimStart());
}
function embeddedStructure(text: string): boolean {
  return /```|\[\s*["']|[{]\s*["'][^"'\r\n]+["']\s*:/u.test(text);
}
function dictionaryPayload(text: string): boolean {
  return /["']headword["']\s*:/i.test(text) && /["'](?:translation|phonetic|senses)["']\s*:/i.test(text);
}
function termIdentity(text: string): string {
  return text.normalize('NFKC').trim()
    .replace(/^["'“”‘’«»`]+|["'“”‘’«»`.,!?。！？]+$/gu, '')
    .replace(/\s+/gu, ' ').trim().toLowerCase();
}

/** Shape validation cannot judge translation quality. It can keep protocol objects
 * out of prose, reject a glossary entry for only a fragment, and retain literal
 * structured source content as text rather than treating it as our protocol. */
export function validateSelectionResult(raw: string, source: string, task: SelectionTask): SelectionResult | null {
  if (!raw.trim()) return null;
  const sourceStructured = structuredStart(source) || dictionaryPayload(source) || embeddedStructure(source);
  if (sourceStructured && task === 'translate') {
    if (dictionaryPayload(raw) && !dictionaryPayload(source)) return null;
    return { full: raw, format: 'text' };
  }
  if (structuredStart(raw) || dictionaryPayload(raw) || embeddedStructure(raw)) {
    if (task !== 'auto') return null;
    const entry = parseDictionaryEntry(raw);
    if (!entry || termIdentity(entry.headword) !== termIdentity(source)) return null;
    return { full: JSON.stringify(entry), format: 'dictionary' };
  }
  return { full: raw, format: 'text' };
}

/** Hold structured-looking streams until validated. Ordinary prose stays streaming.
 * A prefix is allowed to arrive one character at a time, including ``` fences. */
export class SelectionStreamGate {
  private state: 'pending' | 'text' | 'structured' = 'pending';
  private prefix = '';
  push(delta: string): string {
    if (this.state === 'structured') return '';
    if (this.state === 'text') {
      // A preamble before JSON is still invalid protocol output. Stop before
      // structural content, not after its keys have already reached the card.
      const marker = delta.search(/[[{`]/u);
      if (marker >= 0) { this.state = 'structured'; return delta.slice(0, marker); }
      return delta;
    }
    this.prefix += delta;
    const text = this.prefix.trimStart();
    if (!text || (text.length < 3 && /^`+$/u.test(text))) return '';
    if (structuredStart(text) || text.startsWith('"')) { this.state = 'structured'; this.prefix = ''; return ''; }
    this.state = 'text';
    const output = this.prefix;
    this.prefix = '';
    return this.push(output);
  }
}

/** At most one format correction, always with a text-only contract. Network retry
 * policy belongs to the transport, not to this output-repair budget. */
export async function runSelection(
  source: string,
  task: SelectionTask,
  generate: (task: SelectionTask, repair: boolean) => Promise<string>,
  signal?: AbortSignal,
): Promise<SelectionResult> {
  signal?.throwIfAborted();
  const first = validateSelectionResult(await generate(task, false), source, task);
  if (first) return first;
  signal?.throwIfAborted();
  const corrected = validateSelectionResult(await generate('translate', true), source, 'translate');
  if (corrected) return corrected;
  throw new InvalidModelOutputError();
}
