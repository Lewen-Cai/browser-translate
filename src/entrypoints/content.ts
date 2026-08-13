import { h } from 'preact';
import { createShadowMount } from './content/mount';
import { createSelectionWatcher, getCurrentParagraphText, type SelectionInfo } from './content/selectionWatcher';
import { createHotkeyWatcher, type HotkeyWatcher } from './content/hotkeyWatcher';
import { TriggerIcon } from './content/TriggerIcon';
import { TranslationCard } from './content/TranslationCard';
import { createPageTranslator, type PageTranslator } from './content/pageTranslate';
import { createYouTubeSubTranslator, type YouTubeSubTranslator } from './content/youtubeSubs';
import { StorageClient } from '~/storage/client';
import { resolveEffectiveTheme } from '~/ui/themeResolver';
import { resolveThemeDefinition } from '~/core/theme/themes';
import type { ThemeDefinition } from '~/storage/schema';
import { isLikelyPassage } from '~/core/selection/isLikelyPassage';
import { isSameLanguageAsTarget } from '~/core/language/sameLanguage';
import { reportSystemDark } from '~/messaging/client';
import { resolveLocale, t } from '~/i18n';
import type { Locale } from '~/i18n/strings';
import type { GlobalSettings } from '~/storage/schema';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    const mount = createShadowMount();
    const client = new StorageClient();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    let themeSetting: GlobalSettings['theme'] = 'auto';
    let themeDefinition: ThemeDefinition = resolveThemeDefinition('cobalt', []);
    let locale: Locale = 'en';

    const applyTheme = () => {
      mount.setTheme(themeDefinition, resolveEffectiveTheme(themeSetting, mql.matches));
      // Keep the toolbar icon on the same variant the page resolves.
      reportSystemDark(mql.matches);
    };

    mql.addEventListener('change', applyTheme);

    let state: 'idle' | 'icon' | 'card' = 'idle';
    let selectionWatcher: { stop: () => void } | null = null;
    let hotkey: HotkeyWatcher | null = null;
    let pageTranslator: PageTranslator | null = null;
    let targetLanguage = 'zh-CN';
    let fullPageHotkey: HotkeyWatcher | null = null;
    let ytSubs: YouTubeSubTranslator | null = null;
    let ytNavHandler: (() => void) | null = null;

    const showIcon = (info: SelectionInfo) => {
      state = 'icon';
      mount.render(
        h(TriggerIcon, {
          rect: info.rect,
          onClick: () => showCard(info),
        }),
      );
    };

    const showCard = (info: SelectionInfo) => {
      state = 'card';
      const skip = isLikelyPassage(info.text) && isSameLanguageAsTarget(info.text, targetLanguage);
      mount.render(
        h(TranslationCard, {
          text: info.text,
          rect: info.rect,
          locale,
          notice: skip ? t('noTranslationNeeded', locale) : undefined,
          onClose: () => {
            state = 'idle';
            mount.unmount();
          },
        }),
      );
    };

    const hide = () => {
      state = 'idle';
      mount.unmount();
    };

    /** Tear down then re-create watchers based on the current settings. */
    async function reattach() {
      selectionWatcher?.stop();
      hotkey?.stop();
      fullPageHotkey?.stop();
      selectionWatcher = null;
      hotkey = null;
      fullPageHotkey = null;
      if (state !== 'idle') hide();

      const data = await client.loadAppData();
      themeSetting = data.settings.theme;
      themeDefinition = resolveThemeDefinition(data.settings.themeId, data.settings.customThemes ?? []);
      locale = resolveLocale(data.settings.uiLanguage, navigator.language);
      targetLanguage = data.settings.targetLanguage;
      applyTheme();

      if (data.settings.triggerMode === 'icon') {
        const w = createSelectionWatcher((info) => {
          if (info) {
            if (state !== 'card') showIcon(info);
          } else if (state === 'icon') {
            hide();
          }
        });
        w.start();
        selectionWatcher = w;
      }

      if (data.settings.triggerMode === 'hotkey') {
        const hk = createHotkeyWatcher(data.settings.hotkey, () => {
          const info = getSelectionInfo() ?? paragraphFallback();
          if (info) showCard(info);
        });
        hk.start();
        hotkey = hk;

        const fph = createHotkeyWatcher(data.settings.fullPageHotkey, () => {
          togglePageTranslation();
        });
        fph.start();
        fullPageHotkey = fph;
      }

      // Rebuild the translator so it reads the current target language / strings.
      const wasOn = pageTranslator?.isOn() ?? false;
      pageTranslator?.disable();
      pageTranslator = createPageTranslator({
        getTargetLang: () => targetLanguage,
        strings: { translateFailed: t('translateFailed', locale), retry: t('retry', locale) },
      });
      if (wasOn) pageTranslator.enable();

      // YouTube subtitle translator — only on watch pages.
      ytSubs?.disable();
      ytSubs = null;
      if (isYouTubeWatch()) {
        ytSubs = createYouTubeSubTranslator({
          getTargetLang: () => targetLanguage,
          // Cloud fans out across its fleet (4). Local uses 2 as a 1-deep pipeline:
          // one batch processing while the next is queued, so the model never idles
          // between batches. (A local MLX server queues rather than splitting, so
          // this doesn't slow individual batches.)
          concurrency: data.api.providerType === 'cloud' ? 4 : 2,
          strings: {
            titleOff: t('ytSubsButtonTitle', locale),
            titleOn: t('ytSubsButtonTitleOn', locale),
            noCaptions: t('ytSubsNoCaptions', locale),
            enableCc: t('ytSubsEnableCc', locale),
            noTranslationNeeded: t('ytSubsNoTranslationNeeded', locale),
            live: t('ytSubsLive', locale),
            failed: t('ytSubsFailed', locale),
            translating: t('ytSubsTranslating', locale),
            autoOnly: t('ytSubsAutoOnly', locale),
          },
          notify: (msg) => console.info('[BrowserTranslate]', msg),
        });
        attachYtButtonSoon(ytSubs);
      }
    }

    function togglePageTranslation() {
      if (!pageTranslator) return;
      if (pageTranslator.isOn()) pageTranslator.disable();
      else pageTranslator.enable();
    }

    await reattach();

    if (!ytNavHandler) {
      ytNavHandler = () => { void reattach(); };
      window.addEventListener('yt-navigate-finish', ytNavHandler);
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (!('app:data' in changes)) return;
      void reattach();
    });

    chrome.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
      if (msg?.type === 'page:toggle') {
        togglePageTranslation();
        sendResponse({ translated: pageTranslator?.isOn() ?? false });
        return false;
      }
      if (msg?.type === 'page:query') {
        sendResponse({ translated: pageTranslator?.isOn() ?? false });
        return false;
      }
      return false;
    });

    document.addEventListener('mousedown', (e) => {
      if (state === 'idle') return;
      const target = e.target as Node;
      if (mount.root.contains(target)) return;
      if (state === 'icon') return;
      hide();
    }, true);
  },
});

function isYouTubeWatch(): boolean {
  return location.hostname.endsWith('youtube.com') && location.pathname === '/watch';
}

function attachYtButtonSoon(subs: YouTubeSubTranslator, tries = 10): void {
  const attempt = (n: number) => {
    if (document.querySelector('.ytp-right-controls')) {
      void subs.attachButton();
      return;
    }
    if (n <= 0) return;
    setTimeout(() => attempt(n - 1), 400);
  };
  attempt(tries);
}

function getSelectionInfo(): SelectionInfo | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const text = sel.toString().trim();
  if (!text) return null;
  return { text, rect: sel.getRangeAt(0).getBoundingClientRect() };
}

function paragraphFallback(): SelectionInfo | null {
  return getCurrentParagraphText();
}
