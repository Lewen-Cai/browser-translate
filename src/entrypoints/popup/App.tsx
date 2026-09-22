import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { Switch } from '~/ui/components/Switch';
import { Settings, Languages } from '~/ui/icons';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';
import { useApplyLocale } from '~/ui/useApplyLocale';
import { EngineRoutingPicker } from '~/ui/components/EngineRoutingPicker';
import { LanguageSelect } from '~/ui/components/LanguageSelect';
import type { PageStateResponse } from '~/messaging/types';

type Availability = 'loading' | 'ready' | 'unsupported' | 'refresh';

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
  const [availability, setAvailability] = useState<Availability>('loading');
  const [tabId, setTabId] = useState<number>();
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!live) return;
        if (tab?.id === undefined || (tab.url && !/^(https?|file):/i.test(tab.url))) {
          setAvailability('unsupported');
          return;
        }
        setTabId(tab.id);
        const reply = await chrome.tabs.sendMessage(tab.id, { type: 'page:query' }) as PageStateResponse | undefined;
        if (!live) return;
        if (typeof reply?.translated !== 'boolean') { setAvailability('refresh'); return; }
        setPageOn(reply.translated);
        setAvailability('ready');
      } catch {
        if (live) setAvailability('refresh');
      }
    })();
    return () => { live = false; };
  }, []);

  async function togglePage() {
    if (busy || availability !== 'ready' || tabId === undefined) return;
    setBusy(true);
    try {
      const reply = await chrome.tabs.sendMessage(tabId, { type: 'page:toggle' }) as PageStateResponse | undefined;
      if (typeof reply?.translated === 'boolean') setPageOn(reply.translated);
      else setAvailability('refresh');
    } catch {
      setAvailability('refresh');
    } finally { setBusy(false); }
  }

  if (!loaded) return <div class="p-5 text-sm text-ap-muted">{t('loading')}</div>;
  const pageHint = availability === 'loading' || busy ? t('loading')
    : availability === 'unsupported' ? t('pageUnsupported')
    : availability === 'refresh' ? t('pageRefresh') : undefined;

  return (
    <div class="bg-ap-bg text-ap-fg">
      <header class="flex items-center gap-2.5 border-b border-ap-border px-5 py-4">
        <span class="grid h-8 w-8 place-items-center rounded-lg bg-ap-brand/10 text-ap-brand"><Languages size={18} /></span>
        <span class="text-sm font-semibold">BrowserTranslate</span>
        <button type="button" class="ml-auto rounded-md p-1.5 text-ap-muted hover:bg-ap-fg/5 hover:text-ap-fg"
          aria-label={t('openFullSettings')} title={t('openFullSettings')}
          onClick={() => { void chrome.runtime.openOptionsPage(); window.close(); }}>
          <Settings size={17} />
        </button>
      </header>
      <div class="space-y-5 px-5 py-4">
        <LanguageSelect value={settings.targetLanguage} onChange={(value) => updateSettings({ targetLanguage: value })} />
        <section class="rounded-xl border border-ap-border bg-ap-surface px-3.5 py-2.5">
          <p class="mb-1 text-xs text-ap-muted">{t('currentPage')}</p>
          <Switch checked={pageOn} onChange={() => void togglePage()} label={t('pageBilingual')}
            disabled={availability !== 'ready' || busy} />
          {pageHint && <p role="status" class="mt-1 text-xs leading-relaxed text-ap-muted">{pageHint}</p>}
        </section>
        <section>
          <SectionHeader label={t('sectionRouting')} />
          <EngineRoutingPicker engines={settings.engines} providers={providers}
            onChange={(next) => updateSettings({ engines: next })} compact />
        </section>
      </div>
    </div>
  );
}
