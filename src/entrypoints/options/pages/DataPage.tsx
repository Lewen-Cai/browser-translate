import { useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Switch } from '~/ui/components/Switch';
import { SegmentedControl } from '~/ui/components/SegmentedControl';
import { Archive, Download, Upload, Zap } from '~/ui/icons';
import { cn } from '~/lib/cn';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { ResultBanner } from '~/ui/components/ResultBanner';
import { useT } from '~/i18n';
import { exportAppData, importAppData } from '~/storage/transfer';

/** Taking every setting out to a file, and putting one back. */
export function DataPage() {
  const data = useAppStore((s) => s.data);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const update = useAppStore((s) => s.updateSettings);
  const t = useT();
  const [includeKeys, setIncludeKeys] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const file = exportAppData(data, { includeKeys }, Date.now());
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'browsertranslate-settings.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    try {
      const parsed: unknown = JSON.parse(await f.text());
      const next = importAppData(parsed);
      await replaceAll(next);
      setImportMsg({ ok: true, text: t('importSuccess') });
      setTimeout(() => setImportMsg(null), 4000);
    } catch (err) {
      setImportMsg({ ok: false, text: `${t('importFailed')}: ${(err as Error).message}` });
    } finally {
      input.value = ''; // allow re-importing the same file
    }
  }

  const ttl = data.settings.cacheTTLDays;
  // A stored value off the presets (an older build allowed any number) stays
  // selectable rather than showing nothing chosen.
  const ttlChoices = [...new Set([1, 3, 7, 14, 30, ttl])].sort((a, b) => a - b);

  return (
    <div class="space-y-5">
      <section class="ap-settings-panel">
        <SectionHeader icon={Zap} label={t('sectionCache')} />
        <Switch checked={data.settings.cacheEnabled}
          onChange={(cacheEnabled) => update({ cacheEnabled })}
          label={t('cacheTranslations')} description={t('cacheDesc')} />
        <div class={cn('ap-size-row', !data.settings.cacheEnabled && 'pointer-events-none opacity-50')}>
          <span class="text-sm text-ap-fg">{t('cacheTtl')}</span>
          <SegmentedControl label={t('cacheTtl')} value={String(ttl)}
            options={ttlChoices.map((d) => ({ value: String(d), label: String(d) }))}
            onChange={(v) => update({ cacheTTLDays: Number(v) })} />
        </div>
      </section>

      <section class="ap-settings-panel">
        <SectionHeader icon={Archive} label={t('sectionData')} description={t('dataSectionDesc')} />
        <div class="grid gap-3 sm:grid-cols-2">
          <ActionTile icon={Download} title={t('exportSettings')} description={t('exportDesc')} onClick={handleExport} />
          <ActionTile icon={Upload} title={t('importSettings')} description={t('importDesc')}
            onClick={() => fileRef.current?.click()} />
        </div>
        <div class="mt-3">
          <Switch
            checked={includeKeys}
            onChange={setIncludeKeys}
            label={t('includeApiKeys')}
            description={includeKeys ? t('includeApiKeysWarning') : undefined}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          class="hidden"
          onChange={handleImportFile}
        />
        {importMsg && <div class="mt-3"><ResultBanner ok={importMsg.ok} text={importMsg.text} /></div>}
      </section>
    </div>
  );
}

function ActionTile({ icon: Icon, title, description, onClick }: {
  icon: typeof Download; title: string; description: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      class="flex items-start gap-3 rounded-xl border border-ap-border bg-ap-surface p-4 text-left transition-colors hover:border-ap-brand hover:bg-ap-brand/[0.03]">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ap-fg/5 text-ap-fg">
        <Icon size={17} />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-medium text-ap-fg">{title}</span>
        <span class="mt-0.5 block text-2xs leading-relaxed text-ap-muted">{description}</span>
      </span>
    </button>
  );
}
