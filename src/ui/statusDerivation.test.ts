import { describe, it, expect } from 'vitest';
import { deriveStatus, type StatusState } from './statusDerivation';
import type { ApiSettings } from '~/storage/schema';
import type { PingResponse } from '~/messaging/types';

const cloudCustomFilled: ApiSettings = {
  baseUrl: 'https://x/v1', apiKey: 'k', model: 'm',
  providerType: 'cloud', cloudProvider: 'custom',
};
const cloudCustomEmpty: ApiSettings = {
  baseUrl: '', apiKey: '', model: '',
  providerType: 'cloud', cloudProvider: 'custom',
};
const localFilled: ApiSettings = {
  baseUrl: 'http://localhost:11434/v1', apiKey: '', model: 'qwen',
  providerType: 'local', cloudProvider: 'custom',
};
const localMissingModel: ApiSettings = {
  baseUrl: 'http://localhost:11434/v1', apiKey: '', model: '',
  providerType: 'local', cloudProvider: 'custom',
};

describe('deriveStatus', () => {
  it("returns 'not-configured' for cloud with empty fields", () => {
    expect(deriveStatus(cloudCustomEmpty, null)).toEqual<StatusState>({ kind: 'not-configured' });
  });

  it("returns 'not-configured' for local with missing model", () => {
    expect(deriveStatus(localMissingModel, null)).toEqual<StatusState>({ kind: 'not-configured' });
  });

  it("requires apiKey for cloud", () => {
    const cloudNoKey: ApiSettings = { ...cloudCustomFilled, apiKey: '' };
    expect(deriveStatus(cloudNoKey, null)).toEqual<StatusState>({ kind: 'not-configured' });
  });

  it("does NOT require apiKey for local", () => {
    expect(deriveStatus(localFilled, 'pending')).toEqual<StatusState>({ kind: 'checking' });
  });

  it("returns 'checking' when ping is pending and required fields present", () => {
    expect(deriveStatus(cloudCustomFilled, 'pending')).toEqual<StatusState>({ kind: 'checking' });
  });

  it("returns 'ready' when ping ok and modelInList is true", () => {
    const ping: PingResponse = {
      type: 'ping:ok', requestId: 'x',
      latencyMs: 120, availableModels: ['m'], modelInList: true, configuredModel: 'm',
    };
    expect(deriveStatus(cloudCustomFilled, ping)).toEqual<StatusState>({
      kind: 'ready', latencyMs: 120,
    });
  });

  it("returns 'ready' when ping ok and modelInList is null (couldn't determine)", () => {
    const ping: PingResponse = {
      type: 'ping:ok', requestId: 'x',
      latencyMs: 50, availableModels: [], modelInList: null, configuredModel: 'm',
    };
    expect(deriveStatus(cloudCustomFilled, ping)).toEqual<StatusState>({
      kind: 'ready', latencyMs: 50,
    });
  });

  it("returns 'model-missing' when ping ok but modelInList is false", () => {
    const ping: PingResponse = {
      type: 'ping:ok', requestId: 'x',
      latencyMs: 90, availableModels: ['a', 'b'], modelInList: false, configuredModel: 'm',
    };
    expect(deriveStatus(cloudCustomFilled, ping)).toEqual<StatusState>({
      kind: 'model-missing', availableModels: ['a', 'b'], configuredModel: 'm',
    });
  });

  it("returns 'offline' on ping error", () => {
    const ping: PingResponse = {
      type: 'ping:error', requestId: 'x', status: 401, message: 'Unauthorized',
    };
    expect(deriveStatus(cloudCustomFilled, ping)).toEqual<StatusState>({
      kind: 'offline', message: 'Unauthorized', status: 401,
    });
  });
});
