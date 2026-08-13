import { describe, it, expect } from 'vitest';
import type { ApiSettings } from '~/storage/schema';
import { activeSlot, defaultConfigForSlot, applySlot, rememberActive, providerConfigFromApi } from './providerSlots';

function baseApi(overrides: Partial<ApiSettings> = {}): ApiSettings {
  return {
    baseUrl: '',
    apiKey: '',
    model: '',
    providerType: 'cloud',
    cloudProvider: 'custom',
    ...overrides,
  };
}

describe('activeSlot', () => {
  it('returns the cloud provider when cloud', () => {
    expect(activeSlot(baseApi({ providerType: 'cloud', cloudProvider: 'openai' }))).toBe('openai');
  });
  it("returns 'local' when local", () => {
    expect(activeSlot(baseApi({ providerType: 'local' }))).toBe('local');
  });
});

describe('defaultConfigForSlot', () => {
  it('uses the preset baseUrl for openai/deepseek', () => {
    expect(defaultConfigForSlot('openai')).toEqual({ baseUrl: 'https://api.openai.com/v1', apiKey: '', model: '' });
    expect(defaultConfigForSlot('deepseek')).toEqual({ baseUrl: 'https://api.deepseek.com/v1', apiKey: '', model: '' });
  });
  it('is blank for custom and local', () => {
    expect(defaultConfigForSlot('custom')).toEqual({ baseUrl: '', apiKey: '', model: '' });
    expect(defaultConfigForSlot('local')).toEqual({ baseUrl: '', apiKey: '', model: '' });
  });
  it('uses the first endpoint (China) for a multi-endpoint provider', () => {
    expect(defaultConfigForSlot('moonshot')).toEqual({ baseUrl: 'https://api.moonshot.cn/v1', apiKey: '', model: '' });
  });
});

describe('applySlot', () => {
  it('restores a saved config for the target slot', () => {
    const api = baseApi({
      providerType: 'cloud',
      cloudProvider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-openai',
      model: 'gpt-4o',
      savedConfigs: { deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-deep', model: 'deepseek-chat' } },
    });
    const next = applySlot(api, 'deepseek');
    expect(next.providerType).toBe('cloud');
    expect(next.cloudProvider).toBe('deepseek');
    expect(next.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(next.apiKey).toBe('sk-deep');
    expect(next.model).toBe('deepseek-chat');
  });
  it('falls back to defaults for an unseen slot', () => {
    const api = baseApi({ providerType: 'cloud', cloudProvider: 'openai', apiKey: 'sk-openai' });
    const next = applySlot(api, 'deepseek');
    expect(next.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(next.apiKey).toBe('');
    expect(next.model).toBe('');
  });
  it('preserves cloudProvider when switching to local', () => {
    const next = applySlot(baseApi({ providerType: 'cloud', cloudProvider: 'deepseek' }), 'local');
    expect(next.providerType).toBe('local');
    expect(next.cloudProvider).toBe('deepseek');
  });
  it("never leaks another slot's key (cross-send invariant)", () => {
    const api = baseApi({
      providerType: 'cloud',
      cloudProvider: 'openai',
      apiKey: 'sk-openai',
      savedConfigs: {
        openai: { baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-openai', model: 'gpt-4o' },
        deepseek: { baseUrl: 'https://api.deepseek.com/v1', apiKey: 'sk-deep', model: 'deepseek-chat' },
      },
    });
    const next = applySlot(api, 'deepseek');
    expect(next.apiKey).toBe('sk-deep');
    expect(next.apiKey).not.toBe('sk-openai');
  });
});

describe('rememberActive', () => {
  it('stamps the active fields into the active slot', () => {
    const api = baseApi({ providerType: 'cloud', cloudProvider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-openai', model: 'gpt-4o' });
    expect(rememberActive(api).savedConfigs?.openai).toEqual({ baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-openai', model: 'gpt-4o' });
  });
  it('leaves other slots untouched', () => {
    const api = baseApi({
      providerType: 'cloud',
      cloudProvider: 'openai',
      apiKey: 'sk-openai',
      savedConfigs: { deepseek: { baseUrl: 'x', apiKey: 'sk-deep', model: 'm' } },
    });
    expect(rememberActive(api).savedConfigs?.deepseek).toEqual({ baseUrl: 'x', apiKey: 'sk-deep', model: 'm' });
  });
  it('round-trips: openai -> deepseek -> openai restores openai', () => {
    let api = baseApi({ providerType: 'cloud', cloudProvider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-openai', model: 'gpt-4o' });
    api = rememberActive(api);
    api = applySlot(api, 'deepseek');
    api = rememberActive(api);
    api = applySlot(api, 'openai');
    expect(api.apiKey).toBe('sk-openai');
    expect(api.model).toBe('gpt-4o');
  });

  it('remembers thinking per slot and restores it on switch-back', () => {
    let api = baseApi({ providerType: 'cloud', cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'm', thinking: 'high' });
    api = rememberActive(api);
    api = applySlot(api, 'openai');
    expect(api.thinking).toBeUndefined();     // openai slot never set it
    api = applySlot(api, 'deepseek');
    expect(api.thinking).toBe('high');
  });
});

describe('providerConfigFromApi', () => {
  it('injects the disable patch when thinking is off (default) on a supported slot', () => {
    const api = baseApi({ providerType: 'cloud', cloudProvider: 'deepseek', baseUrl: 'b', apiKey: 'k', model: 'deepseek-v4-flash' });
    const cfg = providerConfigFromApi(api);
    expect(cfg.extraBody).toEqual({ thinking: { type: 'disabled' } });
    expect(cfg.baseUrl).toBe('b');
    expect(cfg.model).toBe('deepseek-v4-flash');
  });

  it('treats an explicit off the same as the undefined default', () => {
    const api = baseApi({ providerType: 'cloud', cloudProvider: 'deepseek', thinking: 'off' });
    expect(providerConfigFromApi(api).extraBody).toEqual({ thinking: { type: 'disabled' } });
  });

  it('sends the mapped effort param when a tier is chosen', () => {
    const api = baseApi({ providerType: 'cloud', cloudProvider: 'deepseek', thinking: 'max' });
    expect(providerConfigFromApi(api).extraBody).toEqual({ reasoning_effort: 'max' });
  });

  it('sends nothing for a slot without a safe param, at off and at a tier', () => {
    expect(providerConfigFromApi(baseApi({ providerType: 'cloud', cloudProvider: 'openai', thinking: 'off' })).extraBody).toBeUndefined();
    expect(providerConfigFromApi(baseApi({ providerType: 'cloud', cloudProvider: 'openai', thinking: 'max' })).extraBody).toBeUndefined();
  });

  it('sends nothing for the local slot', () => {
    const api = baseApi({ providerType: 'local' });
    expect(providerConfigFromApi(api).extraBody).toBeUndefined();
  });

  it('passes customHeaders through', () => {
    const api = baseApi({ customHeaders: { 'X-Test': '1' } });
    expect(providerConfigFromApi(api).customHeaders).toEqual({ 'X-Test': '1' });
  });
});
