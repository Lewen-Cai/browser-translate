import { useEffect, useState } from 'preact/hooks';
import { Button } from '~/ui/components/Button';
import { checkForUpdate } from '~/messaging/client';
import { RELEASES_PAGE } from '~/core/update/github';
import { isUpdateAvailable } from '~/core/update/version';
import { StorageClient } from '~/storage/client';
import { cn } from '~/lib/cn';
import { Download } from '~/ui/icons';
import { useT } from '~/i18n';

export type UpdateOutcome =
  | { kind: 'available'; tag: string; url: string; downloadUrl: string | null }
  | { kind: 'current' }
  | { kind: 'error'; message: string };

/**
 * The state behind the version control and the notice it produces.
 *
 * Lifted out of the component that shows the version, because the two halves
 * belong in different places: the version and its button stay in the header,
 * while what a check finds belongs under it, where a sentence and a set of
 * instructions have the width of the page. One hook keeps them one feature —
 * the notice cannot disagree with the button that produced it.
 *
 * Only when asked. Chrome cannot update an extension it did not install, so a
 * check ends at a file and an instruction — and a check that ran on its own
 * would buy nothing that pressing the button does not, at the cost of being the
 * one request this extension makes unbidden.
 */
export function useUpdateCheck() {
  const version = chrome.runtime.getManifest().version;
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<UpdateOutcome | null>(null);

  // What the last check found, so the page does not read as though nothing has
  // ever been checked. Runs once, deliberately: a later check replaces this
  // through `outcome` directly.
  useEffect(() => {
    let live = true;
    void new StorageClient().loadUpdateState().then((state) => {
      if (!live || !state.latestTag) return;
      if (!isUpdateAvailable(state.latestTag, version)) return;
      setOutcome({
        kind: 'available',
        tag: state.latestTag,
        url: state.releaseUrl || RELEASES_PAGE,
        downloadUrl: state.downloadUrl,
      });
    });
    return () => {
      live = false;
    };
  }, [version]);

  async function check() {
    setChecking(true);
    setOutcome(null);
    const result = await checkForUpdate();
    setChecking(false);
    if (result.type === 'update:error') {
      setOutcome({ kind: 'error', message: result.message });
    } else if (result.updateAvailable) {
      setOutcome({
        kind: 'available',
        tag: result.latestTag,
        url: result.releaseUrl,
        downloadUrl: result.downloadUrl,
      });
    } else {
      setOutcome({ kind: 'current' });
    }
  }

  return { version, checking, outcome, check };
}

/**
 * Which version is installed, and the button that asks about a newer one.
 *
 * In the header rather than among the settings, because it is not a setting:
 * nothing here changes how the extension behaves, and a section of its own down
 * the page implied a choice to make. It is the version label the page already
 * wanted, with a button beside it.
 *
 * Nothing else. A result used to arrive here too, as a 256px card under the
 * button, which made the header's height depend on what the check found: it went
 * from 93px to 261px, pushing everything below it down the moment the button was
 * pressed, and long instructions wrapped into a column six lines tall. The
 * header now holds only these two, so it is the same height in every state and
 * every language; the result appears in the strip below it.
 */
export function UpdateCheck({ version, checking, onCheck }: {
  version: string;
  checking: boolean;
  onCheck: () => void;
}) {
  const t = useT();
  return (
    <div class="ml-auto flex shrink-0 flex-col items-end gap-2">
      <span class="text-xs text-ap-muted">v{version}</span>
      <Button variant="secondary" size="sm" disabled={checking} onClick={onCheck}>
        {checking ? t('checkingForUpdate') : t('checkForUpdate')}
      </Button>
    </div>
  );
}

const TONE = {
  available: 'border-ap-brand/30 bg-ap-brand/5',
  current: 'border-ap-success/30 bg-ap-success/5',
  error: 'border-ap-danger/30 bg-ap-danger/5',
} as const;

/**
 * What a check found, as a strip under the header.
 *
 * Out here rather than in the header for the room: the instruction Chrome will
 * not carry out for us is a sentence in any language, and it gets the width of
 * the page instead of a fixed 256px column, so the strip is the same height
 * whatever the interface language wraps to. It sits above the settings rather
 * than inside one tab because it describes the installation, not a setting, and
 * it appears whether or not the page that produced it is the one you are on.
 */
export function UpdateNotice({ outcome }: { outcome: UpdateOutcome | null }) {
  const t = useT();
  if (!outcome) return null;
  return (
    <div role="status" class={cn('border-b', TONE[outcome.kind])}>
      <div class="mx-auto flex max-w-[1040px] flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3">
        {outcome.kind === 'available' && (
          <>
            <span class="text-sm text-ap-fg">
              {t('updateAvailable').replace('{version}', outcome.tag)}
            </span>
            {/* A plain link, and the file arrives. GitHub serves its release
                assets as an attachment, so the browser downloads rather than
                navigates — which is why this needs no downloads permission and
                opens no tab. A release with nothing attached still has a page
                worth offering. */}
            {outcome.downloadUrl && (
              <a
                href={outcome.downloadUrl}
                download
                class="inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-ap-border-strong bg-ap-fg/5 px-2.5 text-xs font-medium text-ap-fg transition-colors hover:bg-ap-fg/10"
              >
                <Download size={12} />
                {t('downloadUpdate')}
              </a>
            )}
            <a
              href={outcome.url}
              target="_blank"
              rel="noreferrer noopener"
              class="text-xs text-ap-brand underline underline-offset-2"
            >
              {t('openReleasePage')}
            </a>
            {/* Downloading is the easy half. Saying what to do with the file is
                the half Chrome will not do for us. On its own line, because it
                is an instruction rather than part of the offer. */}
            <p class="basis-full text-2xs leading-relaxed text-ap-muted">{t('updateManualNote')}</p>
          </>
        )}
        {outcome.kind === 'current' && (
          <span class="text-sm text-ap-success">{t('updateUpToDate')}</span>
        )}
        {outcome.kind === 'error' && (
          <span class="text-sm text-ap-danger">{t('updateCheckFailed')} {outcome.message}</span>
        )}
      </div>
    </div>
  );
}
