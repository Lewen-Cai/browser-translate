import { describe, it, expect } from 'vitest';
import { deriveStatus, type StatusState } from './statusDerivation';
import type { ProviderConfig } from '~/storage/schema';
import type { PingResponse } from '~/messaging/types';

const row = (patch: Partial<ProviderConfig> = {}): ProviderConfig => ({
  baseUrl: 'https://x/v1',
  apiKey: 'k',
  model: 'm',
  enabled: true,
  ...patch,
});

const filled = row();

describe('deriveStatus', () => {
  it("returns 'not-configured' for a cloud model with empty fields", () => {
    expect(deriveStatus('custom', row({ baseUrl: '', apiKey: '', model: '' }))).toEqual<StatusState>(
      { kind: 'not-configured' },
    );
  });

  it("returns 'not-configured' for a self-hosted runtime with no model", () => {
    const local = row({ baseUrl: 'http://localhost:11434/v1', apiKey: '', model: '' });
    expect(deriveStatus('local', local)).toEqual<StatusState>({ kind: 'not-configured' });
  });

  it("returns 'not-configured' for a cloud model with no key", () => {
    expect(deriveStatus('custom', row({ apiKey: '' }))).toEqual<StatusState>({
      kind: 'not-configured',
    });
  });

  it('does not require a key from a self-hosted runtime', () => {
    const local = row({ baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'qwen' });
    expect(deriveStatus('local', local, 'pending')).toEqual<StatusState>({ kind: 'checking' });
  });

  it('never calls a free service not-configured — it has nothing to configure', () => {
    const blank = row({ baseUrl: '', apiKey: '', model: '' });
    expect(deriveStatus('microsoft', blank, 'pending')).toEqual<StatusState>({ kind: 'checking' });
    expect(deriveStatus('google', undefined, 'pending')).toEqual<StatusState>({ kind: 'checking' });
  });

  it("returns 'checking' while a ping is in flight", () => {
    expect(deriveStatus('custom', filled, 'pending')).toEqual<StatusState>({ kind: 'checking' });
    expect(deriveStatus('custom', filled, null)).toEqual<StatusState>({ kind: 'checking' });
  });

  it("returns 'ready' when ping ok and modelInList is true", () => {
    const ping: PingResponse = {
      type: 'ping:ok',
      requestId: 'x',
      latencyMs: 120,
      availableModels: ['m'],
      modelInList: true,
      configuredModel: 'm',
    };
    expect(deriveStatus('custom', filled, ping)).toEqual<StatusState>({
      kind: 'ready',
      latencyMs: 120,
    });
  });

  it("returns 'ready' when ping ok and modelInList is null (couldn't determine)", () => {
    const ping: PingResponse = {
      type: 'ping:ok',
      requestId: 'x',
      latencyMs: 50,
      availableModels: [],
      modelInList: null,
      configuredModel: 'm',
    };
    expect(deriveStatus('custom', filled, ping)).toEqual<StatusState>({
      kind: 'ready',
      latencyMs: 50,
    });
  });

  it("returns 'model-missing' when ping ok but modelInList is false", () => {
    const ping: PingResponse = {
      type: 'ping:ok',
      requestId: 'x',
      latencyMs: 90,
      availableModels: ['a', 'b'],
      modelInList: false,
      configuredModel: 'm',
    };
    expect(deriveStatus('custom', filled, ping)).toEqual<StatusState>({
      kind: 'model-missing',
      availableModels: ['a', 'b'],
      configuredModel: 'm',
    });
  });

  it("returns 'offline' on ping error", () => {
    const ping: PingResponse = {
      type: 'ping:error',
      requestId: 'x',
      status: 401,
      message: 'Unauthorized',
    };
    expect(deriveStatus('custom', filled, ping)).toEqual<StatusState>({
      kind: 'offline',
      message: 'Unauthorized',
      status: 401,
    });
  });
});
