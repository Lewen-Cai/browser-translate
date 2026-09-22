import { useEffect, useState } from 'preact/hooks';
import { Button } from '~/ui/components/Button';
import { checkForUpdate } from '~/messaging/client';
import { RELEASES_PAGE } from '~/core/update/github';
import { isUpdateAvailable } from '~/core/update/version';
import { StorageClient } from '~/storage/client';
import { Download } from '~/ui/icons';
import { useT } from '~/i18n';

type Outcome =
  | { kind: 'available'; tag: string; url: string; downloadUrl: string | null }
  | { kind: 'current' }
  | { kind: 'error'; message: string };

/**
 * Which version is installed, and whether a newer one exists.
 *
 * In the header rather than among the settings, because it is not a setting:
 * nothing here changes how the extension behaves, and a section of its own down
 * the page implied a choice to make. It is the version label the page already
 * wanted, with a button beside it.
 *
 * Only when asked. Chrome cannot update an extension it did not install, so a
 * check ends at a file and an instruction — and a check that ran on its own
 * would buy nothing that pressing the button does not, at the cost of being the
 * one request this extension makes unbidden.
 */
export function UpdateCheck() {
  const t = useT();
  const version = chrome.runtime.getManifest().version;
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  // What the last check found, so the header does not read as though nothing
  // has ever been checked. Runs once, deliberately: a later check replaces this
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

  return (
    <div class="ml-auto flex shrink-0 flex-col items-end gap-2">
      <span class="text-xs text-ap-muted">v{version}</span>
      <Button variant="secondary" size="sm" disabled={checking} onClick={() => void check()}>
        {checking ? t('checkingForUpdate') : t('checkForUpdate')}
      </Button>

      {outcome?.kind === 'current' && (
        <p class="text-2xs text-ap-success">{t('updateUpToDate')}</p>
      )}
      {outcome?.kind === 'error' && (
        <p class="max-w-[15rem] text-right text-2xs leading-relaxed text-ap-danger">
          {t('updateCheckFailed')} {outcome.message}
        </p>
      )}
      {outcome?.kind === 'available' && (
        <div class="w-64 rounded-md border border-ap-brand/30 bg-ap-brand/5 p-2.5 text-left">
          <p class="text-xs text-ap-fg">
            {t('updateAvailable').replace('{version}', outcome.tag)}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
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
          </div>
          {/* Downloading is the easy half. Saying what to do with the file is
              the half Chrome will not do for us. */}
          <p class="mt-2 text-2xs leading-relaxed text-ap-muted">{t('updateManualNote')}</p>
        </div>
      )}
    </div>
  );
}
