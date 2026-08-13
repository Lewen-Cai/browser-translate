import { useEffect, useMemo, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Input } from '~/ui/components/Input';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { Button } from '~/ui/components/Button';
import { Settings, Eye, EyeOff } from '~/ui/icons';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';
import { CLOUD_PRESETS, supportsThinkingToggle, type CloudProvider } from '~/core/providers/presets';
import { activeSlot, applySlot, rememberActive } from '~/core/providers/providerSlots';
import { thinkingOptions } from '~/ui/thinkingOptions';
import type { ApiSettings, ThinkingSetting } from '~/storage/schema';

const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

function apiEqual(a: ApiSettings, b: ApiSettings): boolean {
  return (
    a.baseUrl === b.baseUrl &&
    a.apiKey === b.apiKey &&
    a.model === b.model &&
    a.providerType === b.providerType &&
    a.cloudProvider === b.cloudProvider &&
    (a.thinking ?? 'off') === (b.thinking ?? 'off') &&
    JSON.stringify(a.savedConfigs ?? {}) === JSON.stringify(b.savedConfigs ?? {})
  );
}

export function App() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);
  const api = useAppStore((s) => s.data.api);
  const settings = useAppStore((s) => s.data.settings);
  const updateApi = useAppStore((s) => s.updateApi);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const t = useT();
  useApplyTheme();

  const [showKey, setShowKey] = useState(false);
  const [draft, setDraft] = useState<ApiSettings>(api);
  const [pingNonce, setPingNonce] = useState(0);
  const [pageOn, setPageOn] = useState(false);

  // Initial load
  useEffect(() => { void load(); }, [load]);

  // Query the active tab's current page-translation state to label the toggle.
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs[0]?.id;
      if (id === undefined) return;
      chrome.tabs.sendMessage(id, { type: 'page:query' }, (resp?: { translated: boolean }) => {
        if (chrome.runtime.lastError) return; // no content script on this page
        if (resp) setPageOn(resp.translated);
      });
    });
  }, []);

  // Sync draft whenever the underlying api object changes (e.g. on first load).
  useEffect(() => {
    setDraft(api);
  }, [api]);

  function openOptions() { chrome.runtime.openOptionsPage(); window.close(); }

  function togglePage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs[0]?.id;
      if (id === undefined) return;
      chrome.tabs.sendMessage(id, { type: 'page:toggle' }, (resp?: { translated: boolean }) => {
        if (chrome.runtime.lastError) return;
        if (resp) setPageOn(resp.translated);
      });
    });
  }

  if (!loaded) {
    return <div class="p-4 text-2xs font-mono text-ap-subtle">{t('loading').toUpperCase()}</div>;
  }

  const dirty = !apiEqual(draft, api);
  const cloudProvider = draft.cloudProvider;
  const isCloud = draft.providerType === 'cloud';
  const baseUrlLocked = isCloud && cloudProvider !== 'custom';

  function setDraftField<K extends keyof ApiSettings>(key: K, value: ApiSettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onProviderTypeChange(next: 'cloud' | 'local') {
    // Stash current (even unsaved) edits, then restore the target slot.
    setDraft((d) => applySlot(rememberActive(d), next === 'local' ? 'local' : d.cloudProvider));
  }

  function onCloudProviderChange(next: CloudProvider) {
    setDraft((d) => applySlot(rememberActive(d), next));
  }

  async function onApply() {
    await updateApi(rememberActive(draft));
    setPingNonce((n) => n + 1);
  }

  // The status indicator should not waste a ping during initial load — only
  // ping once the saved api state has the required fields. The indicator
  // itself handles further triggering via pingNonce.
  const initiallySkip = useMemo(() => pingNonce === 0 && !apiHasRequired(api), [pingNonce, api]);

  return (
    <div class="bg-ap-bg text-ap-fg">
      {/* Hero header */}
      <header class="relative">
        <div class="ap-grid-bg absolute inset-0 opacity-50 pointer-events-none" />
        <div class="relative flex items-stretch">
          <div class="w-1 bg-ap-brand" />
          <div class="flex-1 px-4 py-3 flex items-center justify-between">
            <div>
              <div class="font-mono text-2xs text-ap-subtle tracking-wider">BROWSERTRANSLATE</div>
              <div class="font-semibold text-sm">v{chrome.runtime.getManifest().version}</div>
            </div>
            <button
              onClick={openOptions}
              class="text-ap-muted hover:text-ap-fg transition-colors"
              title={t('openFullSettings')}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
        <div class="border-t border-ap-border" />
      </header>

      {/* Status strip */}
      <div class="px-4 py-2 flex items-center gap-2 border-b border-ap-border bg-ap-surface">
        <ApiStatusIndicator pingNonce={pingNonce} skip={initiallySkip} />
        {api.model && (
          <span class="ml-auto text-2xs font-mono text-ap-subtle truncate max-w-[160px]">
            {api.model}
          </span>
        )}
      </div>

      {/* 01 Translation */}
      <section class="px-4 pt-3 pb-3 border-b border-ap-border">
        <SectionHeader number="01" label={t('sectionTranslation').toUpperCase()} />
        <div class="space-y-2.5">
          <Select
            label={t('targetLanguage')}
            value={settings.targetLanguage}
            options={LANGUAGES}
            onChange={(e) => updateSettings({ targetLanguage: (e.target as HTMLSelectElement).value })}
          />
          <Select
            label={t('triggerMode')}
            value={settings.triggerMode}
            options={[
              { value: 'icon', label: t('iconAfterSelection') },
              { value: 'hotkey', label: t('hotkeyOnly') },
            ]}
            onChange={(e) => updateSettings({ triggerMode: (e.target as HTMLSelectElement).value as 'icon' | 'hotkey' })}
          />
          <div class="pt-1">
            <Button variant="primary" size="sm" onClick={togglePage}>
              {pageOn ? t('showOriginal') : t('translatePage')}
            </Button>
          </div>
        </div>
      </section>

      {/* 02 API */}
      <section class="px-4 pt-3 pb-4">
        <SectionHeader number="02" label={t('sectionApi').toUpperCase()} />
        <div class="space-y-2.5">
          <SegmentedControl<'cloud' | 'local'>
            label={t('providerType')}
            value={draft.providerType}
            fullWidth
            options={[
              { value: 'cloud', label: t('providerTypeCloud') },
              { value: 'local', label: t('providerTypeLocal') },
            ]}
            onChange={onProviderTypeChange}
          />

          {isCloud && (
            <Select
              label={t('cloudProvider')}
              value={draft.cloudProvider}
              options={(Object.keys(CLOUD_PRESETS) as CloudProvider[]).map((k) => ({
                value: k,
                label: k === 'custom' ? t('cloudProviderCustom') : CLOUD_PRESETS[k].label,
              }))}
              onChange={(e) => onCloudProviderChange((e.target as HTMLSelectElement).value as CloudProvider)}
            />
          )}

          {isCloud && CLOUD_PRESETS[cloudProvider].endpoints.length > 1 && (
            <Select
              label={t('cloudEndpoint')}
              value={draft.baseUrl}
              options={CLOUD_PRESETS[cloudProvider].endpoints.map((ep) => ({
                value: ep.baseUrl,
                label: ep.label,
              }))}
              onChange={(e) => setDraftField('baseUrl', (e.target as HTMLSelectElement).value)}
            />
          )}

          <Input
            label={t('baseUrl')}
            value={draft.baseUrl}
            disabled={baseUrlLocked}
            mono
            onInput={(e) => setDraftField('baseUrl', (e.target as HTMLInputElement).value)}
          />

          {isCloud && (
            <div class="flex gap-2 items-end">
              <div class="flex-1">
                <Input
                  label={t('apiKey')}
                  type={showKey ? 'text' : 'password'}
                  value={draft.apiKey}
                  mono
                  onInput={(e) => setDraftField('apiKey', (e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                onClick={() => setShowKey((s) => !s)}
                class="h-8 w-8 flex items-center justify-center rounded-md border border-ap-border bg-ap-surface text-ap-muted hover:text-ap-fg hover:border-ap-border-strong transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          )}

          <Input
            label={t('model')}
            value={draft.model}
            mono
            onInput={(e) => setDraftField('model', (e.target as HTMLInputElement).value)}
          />

          {supportsThinkingToggle(activeSlot(draft)) && (
            <Select
              label={t('thinkingLabel')}
              value={draft.thinking ?? 'off'}
              options={thinkingOptions(t('thinkingOff'))}
              onChange={(e) =>
                setDraftField('thinking', (e.target as HTMLSelectElement).value as ThinkingSetting)
              }
            />
          )}

          <div class="pt-1">
            <Button variant="primary" size="sm" onClick={onApply} disabled={!dirty}>
              {t('applyConfig')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function apiHasRequired(api: ApiSettings): boolean {
  if (!api.baseUrl || !api.model) return false;
  if (api.providerType === 'cloud' && !api.apiKey) return false;
  return true;
}
