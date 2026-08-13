import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatibleProvider } from './openai';
import { TranslationProviderError } from './types';

const prompts = {
  systemPrompt: 'You are a translator.',
  userPrompt: 'Translate the following text to zh-CN:\n\nhello',
};

function makeProvider() {
  return new OpenAICompatibleProvider({
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'test-key',
    model: 'test-model',
  });
}

async function collect(iter: AsyncIterable<{ delta: string; done: boolean }>) {
  let full = '';
  let chunks = 0;
  let sawDone = false;
  for await (const c of iter) {
    full += c.delta;
    chunks++;
    if (c.done) sawDone = true;
  }
  return { full, chunks, sawDone };
}

describe('OpenAICompatibleProvider (non-streaming)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends POST to /chat/completions with bearer auth and verbatim messages', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '你好' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const p = makeProvider();
    await collect(p.translate({ ...prompts, temperature: 0.3, stream: false }));
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[0]).toBe('https://api.example.com/v1/chat/completions');
    expect(call[1]!.method).toBe('POST');
    expect(call[1]!.headers['Authorization']).toBe('Bearer test-key');
    expect(call[1]!.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(call[1]!.body) as { model: string; stream: boolean; messages: Array<{ role: string; content: string }> };
    expect(body.model).toBe('test-model');
    expect(body.stream).toBe(false);
    expect(body.messages[0]).toEqual({ role: 'system', content: prompts.systemPrompt });
    expect(body.messages[1]).toEqual({ role: 'user', content: prompts.userPrompt });
  });

  it('sends the user prompt untouched, including literal {{...}} sequences', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }),
    );
    const p = makeProvider();
    const userPrompt = 'Translate: use {{name}} as a placeholder';
    await collect(p.translate({ systemPrompt: 's', userPrompt, stream: false }));
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]!.body) as { messages: Array<{ content: string }> };
    expect(body.messages[1]!.content).toBe(userPrompt);
  });

  it('returns single chunk with full text', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '你好世界' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const p = makeProvider();
    const result = await collect(p.translate({ ...prompts, temperature: 0.3, stream: false }));
    expect(result.full).toBe('你好世界');
    expect(result.sawDone).toBe(true);
  });

  it('includes custom headers if provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }),
    );
    const p = new OpenAICompatibleProvider({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'k',
      model: 'm',
      customHeaders: { 'HTTP-Referer': 'https://browsertranslate.dev' },
    });
    await collect(p.translate({ ...prompts, temperature: 0.3, stream: false }));
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[1]!.headers['HTTP-Referer']).toBe('https://browsertranslate.dev');
  });

  it('throws TranslationProviderError on 401 with auth kind', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 }),
    );
    const p = makeProvider();
    await expect(collect(p.translate({ ...prompts, temperature: 0.3, stream: false })))
      .rejects.toBeInstanceOf(TranslationProviderError);
  });

  it('marks 429 as retryable rate-limit', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 }),
    );
    const p = makeProvider();
    try {
      await collect(p.translate({ ...prompts, temperature: 0.3, stream: false }));
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TranslationProviderError);
      expect((e as TranslationProviderError).info.kind).toBe('rate-limit');
      expect((e as TranslationProviderError).info.retryable).toBe(true);
    }
  });

  it('spreads extraBody into the request body at the top level', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }),
    );
    const p = new OpenAICompatibleProvider({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'k', model: 'm',
      extraBody: { thinking: { type: 'disabled' } },
    });
    await collect(p.translate({ ...prompts, stream: false }));
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]!.body) as Record<string, unknown>;
    expect(body.thinking).toEqual({ type: 'disabled' });
  });

  it('extraBody can never override model, stream, or messages', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }),
    );
    const p = new OpenAICompatibleProvider({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'k', model: 'real-model',
      extraBody: { model: 'evil-model', stream: true, messages: [] },
    });
    await collect(p.translate({ ...prompts, stream: false }));
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]!.body) as { model: string; stream: boolean; messages: unknown[] };
    expect(body.model).toBe('real-model');
    expect(body.stream).toBe(false);
    expect(body.messages).toHaveLength(2);
  });

  it('strips trailing slash from baseUrl', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 }),
    );
    const p = new OpenAICompatibleProvider({
      baseUrl: 'https://api.example.com/v1/',  // trailing slash
      apiKey: 'k', model: 'm',
    });
    await collect(p.translate({ ...prompts, temperature: 0.3, stream: false }));
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0])
      .toBe('https://api.example.com/v1/chat/completions');
  });
});

describe('OpenAICompatibleProvider (streaming)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function sseResponse(events: string[]): Response {
    const body = events.join('') + 'data: [DONE]\n\n';
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  }

  it('emits one chunk per delta', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"你"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"好"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"世界"}}]}\n\n',
      ]),
    );
    const p = makeProvider();
    const result = await collect(p.translate({ ...prompts, temperature: 0.3, stream: true }));
    expect(result.full).toBe('你好世界');
    expect(result.chunks).toBeGreaterThanOrEqual(3);
    expect(result.sawDone).toBe(true);
  });

  it('skips empty deltas', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
      ]),
    );
    const p = makeProvider();
    const result = await collect(p.translate({ ...prompts, temperature: 0.3, stream: true }));
    expect(result.full).toBe('x');
  });

  it('handles SSE lines split across chunks (buffering)', async () => {
    // Simulate a chunked stream where one JSON line is split.
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"co'));
        controller.enqueue(encoder.encode('ntent":"AB"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(readable, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
    );
    const p = makeProvider();
    const result = await collect(p.translate({ ...prompts, temperature: 0.3, stream: true }));
    expect(result.full).toBe('AB');
  });

  it('stops at [DONE] marker', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
      ]),
    );
    const p = makeProvider();
    const result = await collect(p.translate({ ...prompts, temperature: 0.3, stream: true }));
    expect(result.sawDone).toBe(true);
  });
});
