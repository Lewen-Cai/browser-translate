import { h, Fragment, type ComponentChild } from 'preact';
import { createShadowMount } from './content/mount';
import { createSelectionWatcher, getCurrentParagraphText, type SelectionInfo } from './content/selectionWatcher';
import { createHotkeyWatcher, type HotkeyWatcher } from './content/hotkeyWatcher';
import { TriggerIcon } from './content/TriggerIcon';
import { TranslationCard } from './content/TranslationCard';
import { createPageTranslator, type PageTranslator } from './content/pageTranslate';
import { createYouTubeSubTranslator, type YouTubeSubTranslator } from './content/youtubeSubs';
import { StorageClient } from '~/storage/client';
import { resolveEffectiveTheme } from '~/ui/themeResolver';
import { isLikelyPassage } from '~/core/selection/isLikelyPassage';
import { isSameLanguageAsTarget } from '~/core/language/sameLanguage';
import {
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLE_STYLE,
  type SubtitlePosition,
  type SubtitleStyle,
} from '~/core/subtitles/style';
import { translationAttribution, type TranslationAttribution } from '~/ui/attribution';
import { resolveLocale, t } from '~/i18n';
import type { Locale } from '~/i18n/strings';
import type { AppData, GlobalSettings } from '~/storage/schema';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    const mount = createShadowMount();
    const client = new StorageClient();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    let themeSetting: GlobalSettings['theme'] = 'auto';
    let locale: Locale = 'en';

    const applyTheme = () => {
      mount.setDark(resolveEffectiveTheme(themeSetting, mql.matches));
    };

    mql.addEventListener('change', applyTheme);

    // The icon and the card are painted together rather than one replacing the
    // other: a pinned card stays put while the reader selects something else,
    // and the icon has to appear beside it to act on that new selection.
    let iconNode: ComponentChild = null;
    let cardNode: ComponentChild = null;
    let selectionWatcher: { stop: () => void } | null = null;
    let hotkey: HotkeyWatcher | null = null;
    let pageTranslator: PageTranslator | null = null;
    let targetLanguage = 'zh-CN';
    let subtitlePosition: SubtitlePosition = DEFAULT_SUBTITLE_POSITION;
    let subtitleStyle: SubtitleStyle = DEFAULT_SUBTITLE_STYLE;
    let fullPageHotkey: HotkeyWatcher | null = null;
    let ytSubs: YouTubeSubTranslator | null = null;
    let attribution: TranslationAttribution = { iconId: 'custom', label: '' };
    // A pinned card survives clicks elsewhere on the page, and keeps the spot
    // the reader dragged it to when they translate something else.
    let cardPinned = false;
    let pinnedRect: DOMRect | null = null;
    let ytNavHandler: (() => void) | null = null;

    const paint = () => {
      if (!iconNode && !cardNode) {
        mount.unmount();
        return;
      }
      mount.render(h(Fragment, null, iconNode, cardNode));
    };

    const showIcon = (info: SelectionInfo) => {
      iconNode = h(TriggerIcon, {
        rect: info.rect,
        onClick: () => showCard(info),
      });
      paint();
    };

    const clearIcon = () => {
      if (!iconNode) return;
      iconNode = null;
      paint();
    };

    const showCard = (info: SelectionInfo) => {
      // The icon has done its job the moment the card opens.
      iconNode = null;
      const skip = isLikelyPassage(info.text) && isSameLanguageAsTarget(info.text, targetLanguage);
      // While pinned the card must not jump back to the new selection.
      const rect = cardPinned && pinnedRect ? pinnedRect : info.rect;
      if (!cardPinned) pinnedRect = info.rect;
      // Same component in the same slot, so a pinned card keeps its pin state and
      // the spot it was dragged to while it translates the new text.
      cardNode = h(TranslationCard, {
        text: info.text,
        rect,
        locale,
        attribution,
        notice: skip ? t('noTranslationNeeded', locale) : undefined,
        onPinChange: (next: boolean) => {
          cardPinned = next;
          if (next) pinnedRect = rect;
        },
        onClose: hide,
      });
      paint();
    };

    const hide = () => {
      iconNode = null;
      cardNode = null;
      cardPinned = false;
      pinnedRect = null;
      paint();
    };

    /** Tear down then re-create watchers based on the current settings. */
    async function reattach() {
      selectionWatcher?.stop();
      hotkey?.stop();
      fullPageHotkey?.stop();
      selectionWatcher = null;
      hotkey = null;
      fullPageHotkey = null;
      hide();

      const data = await client.loadAppData();
      themeSetting = data.settings.theme;
      locale = resolveLocale(data.settings.uiLanguage, navigator.language);
      mount.setLang(locale);
      targetLanguage = data.settings.targetLanguage;
      subtitlePosition = data.settings.subtitlePosition;
      subtitleStyle = data.settings.subtitleStyle;
      attribution = translationAttribution(data.settings.engine, data.api);
      applyTheme();

      if (data.settings.triggerMode === 'icon') {
        const w = createSelectionWatcher((info) => {
          if (info) {
            // A pinned card is meant to stay while the reader works, so the icon
            // still offers to translate whatever they pick next.
            if (!cardNode || cardPinned) showIcon(info);
          } else {
            clearIcon();
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
      ytSubs?.teardown();
      ytSubs = null;
      if (isYouTubeWatch()) {
        ytSubs = createYouTubeSubTranslator({
          getTargetLang: () => targetLanguage,
          // A free MT service answers in well under a second and has no per-token
          // cost, so it takes the widest fan-out. Cloud LLMs fan out across their
          // fleet (4). Local uses 2 as a 1-deep pipeline: one batch processing
          // while the next is queued, so the model never idles between batches.
          // (A local MLX server queues rather than splitting, so this doesn't
          // slow individual batches.)
          concurrency: data.settings.engine !== 'llm' ? 6
            : data.api.providerType === 'cloud' ? 4
            : 2,
          getPosition: () => subtitlePosition,
          setPosition: (next) => {
            subtitlePosition = next;
            void client.patchSettings({ subtitlePosition: next });
          },
          getStyle: () => subtitleStyle,
          setStyle: (next) => {
            subtitleStyle = next;
            void client.patchSettings({ subtitleStyle: next });
          },
          strings: {
            titleOff: t('ytSubsButtonTitle', locale),
            titleOn: t('ytSubsButtonTitleOn', locale),
            noCaptions: t('ytSubsNoCaptions', locale),
            enableCc: t('ytSubsEnableCc', locale),
            noTranslationNeeded: t('ytSubsNoTranslationNeeded', locale),
            live: t('ytSubsLive', locale),
            failed: t('ytSubsFailed', locale),
            placeholder: t('ytSubsTranslating', locale),
            dragHint: t('ytSubsDragHint', locale),
            subtitlesToggle: t('ytSubsToggleLabel', locale),
            styleTitle: t('subtitleStyle', locale),
            general: t('subtitleGeneral', locale),
            displayMode: t('subtitleDisplayMode', locale),
            displayBilingual: t('subtitleDisplayBilingual', locale),
            displayOriginalOnly: t('subtitleDisplayOriginalOnly', locale),
            displayTranslationOnly: t('subtitleDisplayTranslationOnly', locale),
            translationPosition: t('subtitleTranslationPosition', locale),
            positionAbove: t('subtitlePositionAbove', locale),
            positionBelow: t('subtitlePositionBelow', locale),
            backgroundOpacity: t('subtitleBackgroundOpacity', locale),
            mainSubtitle: t('subtitleMainLine', locale),
            translationSubtitle: t('subtitleTranslationLine', locale),
            fontScale: t('subtitleFontScale', locale),
            color: t('subtitleColor', locale),
            fontFamily: t('subtitleFontFamily', locale),
            fontWeight: t('subtitleFontWeight', locale),
            reset: t('subtitleReset', locale),
            resetAll: t('subtitleResetAll', locale),
            back: t('back', locale),
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
      const change = changes['app:data'];
      if (!change) return;
      const next = change.newValue as AppData | undefined;
      // Moving or restyling the subtitles writes to storage, and this listener
      // fires on our own write. Rebuilding the watchers for it would take the
      // YouTube translator down mid-video — the drag would end with the
      // subtitles gone. These two are read live by the running UI, so applying
      // them here is the whole job.
      if (next && onlySubtitleAppearanceChanged(change.oldValue as AppData | undefined, next)) {
        subtitlePosition = next.settings.subtitlePosition;
        subtitleStyle = next.settings.subtitleStyle;
        return;
      }
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
      if (!cardNode) return; // an icon alone goes away with its selection
      // Our UI lives in a shadow root, so by the time the event reaches this
      // listener `e.target` has been retargeted to the host element — testing it
      // against the shadow root always says "outside", which closed the card on
      // every press of its own pin, grip and expand controls. The composed path
      // still carries the real chain, shadow tree included.
      if (e.composedPath().includes(mount.root)) return;
      if (cardPinned) return; // pinning exists precisely to survive this
      hide();
    }, true);
  },
});

/**
 * True when a stored-data change touched nothing but the subtitle position and
 * style. Both are read live by whatever is already running, so they need no
 * rebuild; everything else does.
 */
function onlySubtitleAppearanceChanged(
  before: AppData | undefined,
  after: AppData,
): boolean {
  if (!before) return false;
  const blank = { subtitlePosition: null, subtitleStyle: null };
  return JSON.stringify({ ...before, settings: { ...before.settings, ...blank } })
    === JSON.stringify({ ...after, settings: { ...after.settings, ...blank } });
}

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
