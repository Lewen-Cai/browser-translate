import { useEffect, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { ApiSettingsPage } from './pages/ApiSettingsPage';
import { GeneralPage } from './pages/GeneralPage';
import { KeyRound, Settings } from '~/ui/icons';
import { cn } from '~/lib/cn';
import { useT } from '~/i18n';
import { useApplyTheme } from '~/ui/useApplyTheme';

type Tab = 'general' | 'api';

export function App() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);
  const [tab, setTab] = useState<Tab>('general');
  const t = useT();
  useApplyTheme();

  useEffect(() => { void load(); }, [load]);

  if (!loaded) return <div class="p-8 text-2xs font-mono text-ap-subtle">LOADING…</div>;

  const TABS: Array<{ id: Tab; num: string; label: string; icon: typeof KeyRound }> = [
    { id: 'general',   num: '01', label: t('navGeneral'),  icon: Settings },
    { id: 'api',       num: '02', label: t('navApi'),      icon: KeyRound },
  ];

  return (
    <div class="min-h-screen bg-ap-bg text-ap-fg">
      {/* Hero */}
      <div class="relative border-b border-ap-border">
        <div class="ap-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
        <div class="relative w-[920px] max-w-full mx-auto px-10 py-10 flex items-center gap-6">
          <div class="w-1 h-16 bg-ap-brand shrink-0" />
          <div>
            <div class="font-mono text-2xs uppercase tracking-wider text-ap-subtle">BROWSERTRANSLATE</div>
            <h1 class="text-3xl font-semibold mt-1">{t('settings')}</h1>
            <p class="text-xs text-ap-muted mt-2 font-mono">{t('privacyTagline')}</p>
          </div>
        </div>
      </div>

      <div class="w-[920px] max-w-full mx-auto px-10 py-10 flex gap-12">
        <nav class="w-40 shrink-0">
          <ul class="space-y-0.5 sticky top-8">
            {TABS.map((tabItem) => (
              <li key={tabItem.id}>
                <button
                  onClick={() => setTab(tabItem.id)}
                  class={cn(
                    'group w-full flex items-center gap-3 px-2 py-2 text-left transition-colors whitespace-nowrap',
                    tab === tabItem.id ? 'text-ap-fg' : 'text-ap-muted hover:text-ap-fg',
                  )}
                >
                  <span class={cn(
                    'font-mono text-2xs tracking-wider',
                    tab === tabItem.id ? 'text-ap-brand' : 'text-ap-subtle',
                  )}>{tabItem.num}</span>
                  <tabItem.icon size={14} class={cn('shrink-0', tab === tabItem.id ? 'text-ap-fg' : 'text-ap-subtle group-hover:text-ap-muted')} />
                  <span class="font-mono text-2xs uppercase tracking-wider">{tabItem.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main class="flex-1 min-w-0 max-w-[640px]">
          {tab === 'api' && <ApiSettingsPage />}
          {tab === 'general' && <GeneralPage />}
        </main>
      </div>
    </div>
  );
}
