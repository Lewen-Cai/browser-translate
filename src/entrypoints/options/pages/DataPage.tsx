import { useRef, useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { Switch } from '~/ui/components/Switch';
import { Button } from '~/ui/components/Button';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { ResultBanner } from '~/ui/components/ResultBanner';
import { useT } from '~/i18n';
import { exportAppData, importAppData } from '~/storage/transfer';

/** Taking every setting out to a file, and putting one back. */
export function DataPage() {
  const data = useAppStore((s) => s.data);
  const replaceAll = useAppStore((s) => s.replaceAll);
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

  return (
    <div class="max-w-lg space-y-8">
      <div>
        <SectionHeader number="01" label={t('sectionData').toUpperCase()} />
        <p class="text-sm text-ap-muted mb-4">{t('dataSectionDesc')}</p>
        <div class="space-y-4">
          <Switch
            checked={includeKeys}
            onChange={setIncludeKeys}
            label={t('includeApiKeys')}
            description={includeKeys ? t('includeApiKeysWarning') : undefined}
          />
          <div class="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>{t('exportSettings')}</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              {t('importSettings')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            class="hidden"
            onChange={handleImportFile}
          />
          {importMsg && <ResultBanner ok={importMsg.ok} text={importMsg.text} />}
        </div>
      </div>
    </div>
  );
}
