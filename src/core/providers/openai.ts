import {
  type TranslateOptions,
  type TranslationChunk,
  type TranslationProvider,
  TranslationProviderError,
} from './types';

export interface OpenAIProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  customHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider implements TranslationProvider {
  readonly id = 'openai-compatible';
  private readonly endpoint: string;

  constructor(private readonly cfg: OpenAIProviderConfig) {
    this.endpoint = cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions';
  }

  async *translate(opts: TranslateOptions): AsyncIterable<TranslationChunk> {
    const body = {
      model: this.cfg.model,
      stream: opts.stream,
      ...(opts.temperature !== undefined && { temperature: opts.temperature }),
      ...(opts.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userPrompt },
      ],
    };

    let response: Response;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.cfg.customHeaders,
      };
      if (this.cfg.apiKey) {
        headers['Authorization'] = `Bearer ${this.cfg.apiKey}`;
      }
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: opts.signal,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        throw new TranslationProviderError({ kind: 'aborted', message: 'Request aborted', retryable: false });
      }
      throw new TranslationProviderError({ kind: 'network', message: (e as Error).message, retryable: true });
    }

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    if (opts.stream) {
      yield* parseStream(response);
    } else {
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text: string = json?.choices?.[0]?.message?.content ?? '';
      yield { delta: text, done: true };
    }
  }
}

async function parseErrorResponse(response: Response): Promise<TranslationProviderError> {
  let message = `HTTP ${response.status}`;
  try {
    const json = await response.json() as { error?: { message?: unknown } };
    if (json?.error?.message) message = String(json.error.message).slice(0, 200);
  } catch {
    // body not JSON
  }
  const kind = response.status === 401 || response.status === 403 ? 'auth'
    : response.status === 429 ? 'rate-limit'
    : response.status >= 500 ? 'server'
    : 'unknown';
  const retryable = kind === 'rate-limit' || kind === 'server';
  return new TranslationProviderError({ kind, message, retryable, status: response.status });
}

async function* parseStream(response: Response): AsyncIterable<TranslationChunk> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new TranslationProviderError({ kind: 'parse', message: 'No response body', retryable: false });
  }
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          yield { delta: '', done: true };
          return;
        }
        try {
          const json = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
          const delta: string = json?.choices?.[0]?.delta?.content ?? '';
          if (delta) yield { delta, done: false };
        } catch {
          // ignore unparseable line (some providers send keepalives)
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  // stream ended without [DONE]
  yield { delta: '', done: true };
}
