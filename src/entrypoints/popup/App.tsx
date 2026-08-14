import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Select } from '~/ui/components/Select';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { ApiStatusIndicator } from '~/ui/components/ApiStatusIndicator';
import { Button } from '~/ui/components/Button';
import { Settings } from '~/ui/icons';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';
import { useApplyLocale } from '~/ui/useApplyLocale';
import { EngineRoutingPicker } from '~/ui/components/EngineRoutingPicker';
import { TARGET_LANGUAGE_OPTIONS } from '~/core/language/targets';
import { translationAttribution } from '~/ui/attribution';

export function App() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);
  const providers = useAppStore((s) => s.data.providers);
  const settings = useAppStore((s) => s.data.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const t = useT();
  useApplyTheme();
  useApplyLocale();

  const [pageOn, setPageOn] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

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

  function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

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

  // The status strip reports on whatever answers a selection — the surface the
  // popup itself is closest to.
  const probed = settings.engines.selection;
  const credit = translationAttribution(probed, providers[probed]);

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
        <ApiStatusIndicator provider={probed} />
        {credit.label && (
          <span class="ml-auto text-2xs font-mono text-ap-subtle truncate max-w-[160px]">
            {credit.label}
          </span>
        )}
      </div>

      {/* 01 Translation */}
      <section class="px-4 pt-3 pb-4 border-b border-ap-border">
        <SectionHeader number="01" label={t('sectionTranslation').toUpperCase()} />
        <div class="space-y-2.5">
          <Select
            label={t('targetLanguage')}
            value={settings.targetLanguage}
            options={TARGET_LANGUAGE_OPTIONS}
            onChange={(e) =>
              updateSettings({ targetLanguage: (e.target as HTMLSelectElement).value })
            }
          />
          <Select
            label={t('triggerMode')}
            value={settings.triggerMode}
            options={[
              { value: 'icon', label: t('iconAfterSelection') },
              { value: 'hotkey', label: t('hotkeyOnly') },
            ]}
            onChange={(e) =>
              updateSettings({
                triggerMode: (e.target as HTMLSelectElement).value as 'icon' | 'hotkey',
              })
            }
          />
          <div class="pt-1">
            <Button variant="primary" size="sm" onClick={togglePage}>
              {pageOn ? t('showOriginal') : t('translatePage')}
            </Button>
          </div>
        </div>
      </section>

      {/* 02 Routing. Setting a provider up is a page of its own now — fifteen
          of them will not fit in a popup — so this only chooses between the
          ones already switched on. The gear above is the way to the rest; a
          second link to the same page would only be clutter. */}
      <section class="px-4 pt-3 pb-4">
        <SectionHeader number="02" label={t('sectionRouting').toUpperCase()} />
        <EngineRoutingPicker
          engines={settings.engines}
          providers={providers}
          onChange={(next) => updateSettings({ engines: next })}
          compact
        />
      </section>
    </div>
  );
}
