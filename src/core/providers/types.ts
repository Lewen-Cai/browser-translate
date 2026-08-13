export interface TranslateOptions {
  systemPrompt: string;
  userPrompt: string;          // the complete, final user message — sent verbatim
  temperature?: number;        // omit → provider uses its own default
  maxTokens?: number;
  stream: boolean;
  signal?: AbortSignal;
}

export interface TranslationChunk {
  delta: string;                   // incremental text
  done: boolean;                   // true on the final chunk
}

export interface ProviderError {
  kind: 'auth' | 'network' | 'rate-limit' | 'server' | 'aborted' | 'parse' | 'unknown';
  message: string;
  retryable: boolean;
  status?: number;
}

export interface TranslationProvider {
  readonly id: string;
  translate(opts: TranslateOptions): AsyncIterable<TranslationChunk>;
}

export class TranslationProviderError extends Error {
  constructor(public readonly info: ProviderError) {
    super(info.message);
    this.name = 'TranslationProviderError';
  }
}
