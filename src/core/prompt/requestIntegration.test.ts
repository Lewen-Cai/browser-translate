import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultAppData } from '~/storage/defaults';
import type { AppData } from '~/storage/schema';
import type { Request } from '~/messaging/types';
import { DEFAULT_STYLE_PROMPT } from '~/core/prompt/style';

type Reply = { type: string; requestId: string; cached?: boolean; translations?: string[]; full?: string; delta?: string; format?: string; message?: string };
type Listener = (msg: Request, sender: chrome.runtime.MessageSender, reply: (value: unknown) => void) => void;
interface Body { stream: boolean; messages: { role: string; content: string }[] }
let stored: Record<string, unknown>;
let listener: Listener;
let replies: Reply[];
let bodies: Body[];
let fetchMock: ReturnType<typeof vi.fn>;
let sequence = 0;

function data(): AppData { return stored['app:data'] as AppData; }
function streamResponse(text: string): Response {
  return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

beforeEach(async () => {
  vi.resetModules();
  const initial = createDefaultAppData();
  initial.providers.local = { baseUrl: 'https://test.invalid/v1', apiKey: '', model: 'fixture', enabled: true };
  initial.settings.engines = { selection: 'local', fullPage: 'local', subtitle: 'local' };
  initial.settings.targetLanguage = 'en-AU';
  initial.settings.prompts = { activeId: 'mine', templates: [{ id: 'mine', name: 'Mine', body: 'Use precise fixture terminology.' }] };
  stored = { 'app:data': initial };
  replies = [];
  bodies = [];
  vi.stubGlobal('defineBackground', (main: () => void) => main());
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: { addListener: (fn: Listener) => { listener = fn; } },
      sendMessage: vi.fn(async (message: Reply) => { replies.push(message); }),
    },
    alarms: { create: vi.fn(), onAlarm: { addListener: vi.fn() } },
    storage: { local: {
      get: vi.fn(async (key: string) => structuredClone({ [key]: stored[key] })),
      set: vi.fn(async (patch: Record<string, unknown>) => { Object.assign(stored, structuredClone(patch)); }),
    } },
  });
  fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string) as Body;
    bodies.push(body);
    if (body.stream) {
      const content = `data: ${JSON.stringify({ choices: [{ delta: { content: 'Fixture translation' } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(content, { headers: { 'Content-Type': 'text/event-stream' } });
    }
    const user = body.messages[1]!.content;
    const input = JSON.parse(user.slice(user.indexOf('\n\n') + 2)) as { id: number; text: string }[] | { text: string };
    const content = Array.isArray(input)
      ? JSON.stringify(input.map(({ id, text }) => ({ id, translation: `Translated: ${text}` })))
      : `Translated: ${input.text}`;
    return Response.json({ choices: [{ message: { content } }] });
  });
  vi.stubGlobal('fetch', fetchMock);
  // Kept outside entrypoints/: WXT treats a root-level background.test.ts as
  // a second background entrypoint rather than as a colocated test.
  await import('~/entrypoints/background');
});
afterEach(() => vi.unstubAllGlobals());

async function ask(request: Omit<Extract<Request, { type: 'translate' }>, 'requestId'> |
  Omit<Extract<Request, { type: 'translate:batch' }>, 'requestId'>, expectedError = false): Promise<Reply> {
  const requestId = `fixture-${++sequence}`;
  listener({ ...request, requestId } as Request, {}, () => {});
  await vi.waitFor(() => expect(replies.some((r) => r.requestId === requestId && /:(done|error)$/.test(r.type))).toBe(true));
  const reply = replies.find((r) => r.requestId === requestId && /:(done|error)$/.test(r.type))!;
  expect(reply.type.endsWith(':error')).toBe(expectedError);
  return reply;
}

describe('background prompt integration', () => {
  it('sends custom base + region + hidden protocol and invalidates selection cache by content, not name', async () => {
    const request = { type: 'translate' as const, text: 'This paragraph mixes 中文 and English.' };
    expect((await ask(request)).cached).toBe(false);
    const system = bodies[0]!.messages[0]!.content;
    expect(system).toContain('Use precise fixture terminology.');
    expect(system).toContain('Australian English');
    expect(system).not.toContain('DICTIONARY MODE');
    expect(system).not.toContain(DEFAULT_STYLE_PROMPT);
    expect((await ask(request)).cached).toBe(true);
    data().settings.prompts.templates[0]!.name = 'Renamed';
    expect((await ask(request)).cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    data().settings.prompts.templates[0]!.body = 'Use plain everyday wording.';
    expect((await ask(request)).cached).toBe(false);
    expect(bodies[1]!.messages[0]!.content).toContain('Use plain everyday wording.');
    data().settings.prompts.activeId = 'default';
    await ask(request);
    expect(bodies[2]!.messages[0]!.content).toContain(DEFAULT_STYLE_PROMPT);
  });

  it('uses the same custom base on batches, preserves alignment, and separates page/subtitle caches', async () => {
    const request = { type: 'translate:batch' as const, surface: 'fullPage' as const, segments: ['中文 with English', 'A\nB "quoted" {{literal}}'] };
    const reply = await ask(request);
    expect(reply.translations).toEqual(request.segments.map((s) => `Translated: ${s}`));
    await ask(request);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await ask({ ...request, surface: 'subtitle' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies[0]!.messages[0]!.content).toContain('web page');
    expect(bodies[1]!.messages[0]!.content).toContain('video subtitle');
    for (const body of bodies) {
      expect(body.messages[0]!.content).toContain('Use precise fixture terminology.');
      expect(body.messages[0]!.content).toContain('Australian English');
      expect(body.messages[0]!.content).toContain('JSON array');
    }
    data().settings.prompts.templates[0]!.body = 'Use a different style.';
    await ask(request);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('repairs a passage answered as a dictionary, never streaming or caching the protocol object', async () => {
    const invalid = JSON.stringify({ headword: 'rosemary', translation: '迷迭香' });
    const outputs = ['Here is the result:\n' + invalid, 'The whole passage, translated.'];
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(init.body as string));
      return streamResponse(outputs.shift()!);
    });
    const request = { type: 'translate' as const, text: '我在花园日志中记录了 soil moisture，并按照天气调整灌溉。rosemary 只是日志中的一种植物。' };
    const done = await ask(request);
    expect(done).toMatchObject({ format: 'text', full: 'The whole passage, translated.', cached: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies.every((b) => !b.messages[0]!.content.includes('DICTIONARY MODE'))).toBe(true);
    expect(bodies[1]!.messages[0]!.content).toContain('FORMAT CORRECTION');
    expect(replies.filter((r) => r.type === 'translate:reset')).toHaveLength(2);
    expect(replies.filter((r) => r.type === 'translate:chunk').every((r) => !r.delta?.includes('headword'))).toBe(true);
    expect((await ask(request)).cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(stored)).not.toContain('headword');
  });

  it('renders and caches a valid fenced whole-term dictionary with explicit metadata', async () => {
    const raw = '```json\n' + JSON.stringify({ headword: 'rosemary', senses: ['An aromatic herb.'] }) + '\n```';
    fetchMock.mockImplementation(async () => streamResponse(raw));
    const request = { type: 'translate' as const, text: 'rosemary' };
    const done = await ask(request);
    expect(done.format).toBe('dictionary');
    expect(done.full).not.toContain('```');
    expect(replies.filter((r) => r.type === 'translate:chunk')).toHaveLength(0);
    expect(await ask(request)).toMatchObject({ format: 'dictionary', cached: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports persistent format errors without a success event or cache entry', async () => {
    fetchMock.mockImplementation(async () => streamResponse('{"headword":"unrelated",'));
    const done = await ask({ type: 'translate', text: 'rosemary' }, true);
    expect(done.message).not.toContain('headword');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(replies.some((r) => r.type === 'translate:done')).toBe(false);
    expect(Object.keys(stored).some((key) => key.startsWith('cache:'))).toBe(false);
  });

  it('aligns reordered batch results using ids', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as Body;
      const user = body.messages[1]!.content;
      const input = JSON.parse(user.slice(user.indexOf('\n\n') + 2)) as { id: number; text: string }[];
      return Response.json({ choices: [{ message: { content: JSON.stringify(input.reverse().map(({ id, text }) => ({ id, translation: `T:${text}` }))) } }] });
    });
    expect((await ask({ type: 'translate:batch', surface: 'fullPage', segments: ['first', 'second'] })).translations).toEqual(['T:first', 'T:second']);
  });

  it('replaces an invalid batch with explicit validated text-only requests', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as Body;
      bodies.push(body);
      const user = body.messages[1]!.content;
      const input = JSON.parse(user.slice(user.indexOf('\n\n') + 2)) as { text: string }[] | { text: string };
      const content = Array.isArray(input) ? '[{"id":0,"translation":{}}]' : `Plain: ${input.text}`;
      return Response.json({ choices: [{ message: { content } }] });
    });
    const request = { type: 'translate:batch' as const, surface: 'subtitle' as const, segments: ['first', 'second'] };
    expect((await ask(request)).translations).toEqual(['Plain: first', 'Plain: second']);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(bodies[1]!.messages[0]!.content).toContain('without a batch envelope');
    await ask(request);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not cache or return a malformed single-item batch fallback', async () => {
    fetchMock.mockImplementation(async () => Response.json({ choices: [{ message: { content: '{"headword":"wrong","translation":"wrong"}' } }] }));
    await ask({ type: 'translate:batch', surface: 'subtitle', segments: ['A whole sentence.'] }, true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Object.keys(stored).some((key) => key.startsWith('cache:'))).toBe(false);
  });

  it('validates cached selection results instead of trusting stored strings', async () => {
    const request = { type: 'translate' as const, text: 'A whole paragraph with several sentences. It should not be a glossary entry.' };
    await ask(request);
    const key = Object.keys(stored).find((k) => k.startsWith('cache:') && k !== 'cache:index')!;
    stored[key] = { translated: '{"headword":"wrong","translation":"wrong"}' };
    expect((await ask(request)).cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not let the base prompt alter MT requests or invalidate their cache', async () => {
    data().settings.engines.selection = 'microsoft';
    fetchMock.mockImplementation(async () => Response.json([{ translations: [{ text: 'MT fixture', to: 'en' }] }]));
    const request = { type: 'translate' as const, text: '中文 with English' };
    await ask(request);
    expect(String(fetchMock.mock.calls[0]![0])).toContain('to=en&');
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual([request.text]);
    data().settings.prompts.templates[0]!.body = 'Different instructions for LLM only.';
    expect((await ask(request)).cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
