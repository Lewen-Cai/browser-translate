import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import {
  X, AlertCircle, Loader2, Pin, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Languages,
} from '~/ui/icons';
import { streamTranslate, abortTranslate } from '~/messaging/client';
import { clampCardPosition, computeCardBasePosition } from './cardLayout';
import { looksLikeDictionary } from '~/core/dictionary/discriminate';
import { advanceReveal } from './reveal';
import { parseDictionaryEntry } from '~/core/dictionary/parse';
import { DictionaryView } from './DictionaryView';
import { CardMenu, type CardMenuItem, type MenuAnchor } from './CardMenu';
import { writeClipboard } from './clipboard';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { engineOptions } from '~/ui/engineOptions';
import { translationAttribution } from '~/ui/attribution';
import { TARGET_LANGUAGES, languageEndonym } from '~/core/language/targets';
import { PROVIDERS, type ProviderId } from '~/core/providers/registry';
import { t } from '~/i18n';
import type { ProvidersConfig } from '~/storage/schema';
import type { Locale } from '~/i18n/strings';

interface Props {
  text: string;
  rect: DOMRect;
  locale: Locale;
  onClose: () => void;
  notice?: string;
  /** Every provider row, so the card can offer the ones switched on. */
  providers: ProvidersConfig;
  /** Who routing picked for the selection surface — the card's starting point. */
  defaultProvider: ProviderId;
  /** The configured target language — likewise a starting point, not a rule. */
  defaultTargetLang: string;
  /** Pinning is enforced outside the card — the content script owns the
   *  outside-click and new-selection handling that pinning suppresses. */
  onPinChange?: (pinned: boolean) => void;
}

const CARD_WIDTH = 460;
let requestSeq = 0;

function friendlyError(raw: string, locale: Locale): string {
  if (/context invalidated|extension context/i.test(raw)) {
    return t('cardRefreshNeeded', locale);
  }
  return raw;
}

export function TranslationCard({
  text, rect, locale, onClose, notice,
  providers, defaultProvider, defaultTargetLang, onPinChange,
}: Props) {
  const [pinned, setPinned] = useState(false);
  /**
   * Both overrides live and die with this card. A reader trying another
   * provider on one paragraph, or reading one line in a third language, is
   * answering a question about that paragraph — not changing their mind about
   * how the extension should work — so neither is written back to settings.
   */
  const [providerOverride, setProviderOverride] = useState<ProviderId | null>(null);
  const [langOverride, setLangOverride] = useState<string | null>(null);
  const [menu, setMenu] = useState<'provider' | 'lang' | null>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const refreshNext = useRef(false);
  // Viewport-space position frozen at the moment of pinning; non-null means the
  // card is positioned against the screen rather than the document.
  const [pin, setPin] = useState<{ left: number; top: number } | null>(null);
  const [received, setReceived] = useState('');   // full text received so far
  const [displayed, setDisplayed] = useState(''); // progressively revealed slice
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);   // drives open animation
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const dragStart = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);
  const currentReqId = useRef<string>('');
  /**
   * Which run owns the card. A number rather than a cancelled flag: a flag is
   * shared between runs, so the run that supersedes another would clear the very
   * mark that tells the old one to stop, and its remaining chunks would land on
   * top of the new answer. Switching provider or language makes that easy to do
   * on purpose — press twice quickly and both are in flight.
   */
  const runToken = useRef(0);
  const receivedRef = useRef('');
  const displayedLenRef = useRef(0);
  const doneRef = useRef(false);

  // Fixed for as long as the card is showing this selection. See
  // computeCardBasePosition: it reads the scroll position, so recomputing it per
  // render would slide the card whenever a chunk arrived mid-scroll.
  const base = useMemo(() => computeCardBasePosition(rect, CARD_WIDTH), [rect]);

  const provider = providerOverride ?? defaultProvider;
  const targetLang = langOverride ?? defaultTargetLang;
  const attribution = translationAttribution(provider, providers[provider]);
  // The notice says this selection is already in the target language, which the
  // content script worked out against the configured one. Asking for a third
  // language makes that verdict stale, so the card goes and translates instead.
  const activeNotice = langOverride ? undefined : notice;

  useEffect(() => {
    const animId = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(animId);
  }, []);

  // Only a new selection is a new original to read; changing provider or
  // language re-answers the same one, and collapsing it under the reader would
  // be the card taking back something they opened.
  useEffect(() => { setSourceExpanded(false); }, [text]);

  // Keyed on the selection: a pinned card stays mounted while the reader picks
  // new text, and must translate that text rather than keep showing the old
  // result. Position, pin state and the reveal machinery survive the change.
  useEffect(() => {
    if (activeNotice) return;
    const token = ++runToken.current;

    // Typewriter reveal loop: advance `displayed` toward `received` each frame,
    // decoupled from how fast chunks arrive. Reveals all content uniformly; the
    // dictionary branch ignores `displayed` (it renders the parsed view), so this
    // only visibly affects translations.
    let raf = 0;
    const tick = () => {
      const target = receivedRef.current.length;
      if (displayedLenRef.current < target) {
        displayedLenRef.current = advanceReveal(displayedLenRef.current, target);
        setDisplayed(receivedRef.current.slice(0, displayedLenRef.current));
      }
      const caughtUp = displayedLenRef.current >= receivedRef.current.length;
      if (runToken.current === token && !(doneRef.current && caughtUp)) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    void run(token);

    return () => {
      // Retiring the token here as well as on the way in covers unmount, where
      // no next run arrives to retire it.
      runToken.current++;
      window.cancelAnimationFrame(raf);
      if (currentReqId.current) abortTranslate(currentReqId.current);
    };
  }, [text, activeNotice, provider, targetLang, attempt]);

  async function run(token: number) {
    setReceived('');
    setDisplayed('');
    setError(null);
    setStreaming(true);
    receivedRef.current = '';
    displayedLenRef.current = 0;
    doneRef.current = false;
    const reqId = `req-${Date.now()}-${++requestSeq}`;
    currentReqId.current = reqId;
    // Consumed here rather than held in state: it belongs to this one attempt,
    // and a later change of language must not inherit it.
    const refresh = refreshNext.current;
    refreshNext.current = false;
    try {
      let full = '';
      for await (const msg of streamTranslate({
        type: 'translate',
        requestId: reqId,
        text,
        provider,
        targetLang,
        ...(refresh && { refresh: true }),
      })) {
        if (runToken.current !== token) return;
        if (msg.type === 'translate:chunk') {
          full += msg.delta;
          receivedRef.current = full;
          setReceived(full);
        } else if (msg.type === 'translate:error') {
          setError(friendlyError(msg.message, locale));
          setStreaming(false);
          doneRef.current = true;
          return;
        } else {
          full = msg.full;
          receivedRef.current = full;
          setReceived(full);
          setStreaming(false);
          doneRef.current = true;
        }
      }
    } catch (e) {
      if (runToken.current !== token) return;
      setError(friendlyError((e as Error).message, locale));
      setStreaming(false);
      doneRef.current = true;
    }
  }

  /**
   * Pinning holds the card to the screen, not to the page. The shadow host is
   * anchored to the document so the card scrolls away with the text it came
   * from — which is right until the reader pins it precisely so they can go
   * looking somewhere else. Switching to fixed positioning at the scroll offset
   * it was pinned at leaves the card exactly where it already was and keeps it
   * there; unpinning re-anchors it to the document at the spot it now occupies,
   * so it doesn't jump either way.
   */
  function togglePin(): void {
    const next = !pinned;
    if (next) {
      // Freeze where it already is, in screen coordinates. Drag offsets then
      // count from there, so the switch of positioning scheme is invisible.
      setPin({ left: left - window.scrollX, top: top - window.scrollY });
      setOffset({ x: 0, y: 0 });
    } else if (pin) {
      // Re-anchor to the document at the spot it currently occupies.
      setOffset({
        x: pin.left + offset.x + window.scrollX - base.left,
        y: pin.top + offset.y + window.scrollY - base.top,
      });
      setPin(null);
    }
    setPinned(next);
    onPinChange?.(next);
  }

  function onGripPointerDown(e: PointerEvent): void {
    dragStart.current = { x: e.clientX, y: e.clientY, baseX: offset.x, baseY: offset.y };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onGripPointerMove(e: PointerEvent): void {
    const start = dragStart.current;
    if (!start) return;
    setOffset({
      x: start.baseX + (e.clientX - start.x),
      y: start.baseY + (e.clientY - start.y),
    });
  }

  function endDrag(e: PointerEvent): void {
    if (!dragStart.current) return;
    dragStart.current = null;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  /**
   * Menus hang off a measured rect rather than off the DOM, because the card
   * clips its own overflow — see CardMenu. The measurement is taken here, at the
   * press, so it is the position the reader is actually looking at.
   */
  function toggleMenu(kind: 'provider' | 'lang', e: MouseEvent): void {
    if (menu === kind) { setMenu(null); return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAnchor({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    setMenu(kind);
  }

  function retranslate(): void {
    refreshNext.current = true;
    setAttempt((n) => n + 1);
  }

  async function copyResult(): Promise<void> {
    if (!copyText) return;
    if (await writeClipboard(copyText)) setCopied(true);
  }

  // A tick that stayed would stop being feedback and start being a label.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  // The card is placed relative to the selection, which is often not where the
  // reader wants it — it can land on the very text being translated. Dragging
  // the grip nudges it, clamped so it can't be thrown off screen.
  const held = pinned && pin !== null;
  const { left, top } = held
    ? clampCardPosition(pin.left + offset.x, pin.top + offset.y, CARD_WIDTH, { x: 0, y: 0 })
    : clampCardPosition(base.left + offset.x, base.top + offset.y, CARD_WIDTH);

  // Discriminate on the full received text. Dictionary (JSON, starts with '{')
  // renders only once complete; translations show the typewriter-revealed slice.
  const isDict = looksLikeDictionary(received);
  const dictEntry = isDict && !streaming && !error ? parseDictionaryEntry(received) : null;

  // What the copy button puts on the clipboard: the answer, not the card. A
  // dictionary entry's answer is its formal translation, falling back to the
  // senses — copying the raw JSON would be copying our own plumbing.
  const copyText = error
    ? ''
    : dictEntry
      ? dictEntry.translation || dictEntry.senses.join('; ')
      : isDict ? '' : received;

  const providerItems: CardMenuItem[] = engineOptions(
    providers,
    { services: t('engineGroupServices', locale), models: t('engineGroupModel', locale) },
    { keep: provider },
  ).map((o) => ({
    value: o.value,
    label: o.label,
    iconId: o.iconId,
    group: o.group,
    // The model is what distinguishes two rows of the same vendor, and it is
    // what the credit line will show once the choice is made.
    hint: PROVIDERS[o.value as ProviderId].kind === 'llm'
      ? providers[o.value as ProviderId]?.model
      : undefined,
  }));

  const langItems: CardMenuItem[] = TARGET_LANGUAGES.map((l) => ({
    value: l.code,
    label: l.endonym,
    hint: l.endonym === l.english ? undefined : l.english,
  }));

  return (
    <>
    <div
      class="bt-card"
      style={{
        position: held ? 'fixed' : 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${CARD_WIDTH}px`,
        maxHeight: `${base.maxHeight}px`,
        transformOrigin: 'top right',
        transform: visible ? 'scale(1)' : 'scale(0.88)',
        opacity: visible ? 1 : 0,
        // The open animation must not apply to dragging, or the card trails the
        // pointer instead of following it.
        transition: dragging
          ? 'none'
          : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease-out',
        willChange: 'transform, opacity',
      }}
    >
      <div
        class="bt-card-grip"
        data-dragging={dragging ? 'true' : 'false'}
        title={t('cardDrag', locale)}
        onPointerDown={onGripPointerDown}
        onPointerMove={onGripPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span class="bt-card-grip-bar" />
      </div>
      <div class="bt-card-header">
        <div class="bt-card-strip" />
        <div class="bt-card-header-content">
          <div class="bt-card-title-row">
            <span class="bt-card-brand-mark">BrowserTranslate</span>
          </div>
          <div class="bt-card-actions">
            <button
              onClick={retranslate}
              class="bt-card-close"
              disabled={Boolean(activeNotice)}
              title={t('cardRetranslate', locale)}
              aria-label={t('cardRetranslate', locale)}
            >
              <RefreshCw size={16} class={streaming ? 'animate-spin' : undefined} />
            </button>
            <button
              onClick={togglePin}
              class="bt-card-close"
              aria-pressed={pinned}
              title={t(pinned ? 'cardUnpin' : 'cardPin', locale)}
              aria-label={t(pinned ? 'cardUnpin' : 'cardPin', locale)}
            >
              <Pin size={16} />
            </button>
            <button onClick={onClose} class="bt-card-close" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
      <div class="bt-card-body">
        {activeNotice ? (
          <div class="bt-card-notice">{activeNotice}</div>
        ) : (
          <>
            {/* The source sits above the translation so the two can be read
                against each other. A dictionary entry already leads with the
                headword, so repeating it there would be noise. */}
            {!error && !dictEntry && (
              <div class="bt-card-source-row">
                <div class={`bt-card-source${sourceExpanded ? ' bt-card-source-open' : ''}`}>
                  {text}
                </div>
                <button
                  class="bt-card-close bt-card-source-toggle"
                  onClick={() => setSourceExpanded((v) => !v)}
                  title={t(sourceExpanded ? 'cardCollapseSource' : 'cardExpandSource', locale)}
                  aria-label={t(sourceExpanded ? 'cardCollapseSource' : 'cardExpandSource', locale)}
                  aria-expanded={sourceExpanded}
                >
                  {sourceExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            )}
            {/* Copy sits against the result it copies, in the column the source
                row's chevron already established — a control in a far corner
                would leave the reader working out what it acts on. */}
            <div class="bt-card-result-row">
              <div class="bt-card-result">
                {error ? (
                  <div class="bt-card-error">
                    <AlertCircle size={15} class="bt-card-error-icon" />
                    <span>{error}</span>
                  </div>
                ) : isDict && streaming ? (
                  <span class="bt-card-loading">
                    <Loader2 size={13} class="animate-spin" /> {t('loading', locale)}
                  </span>
                ) : dictEntry ? (
                  <DictionaryView entry={dictEntry} locale={locale} />
                ) : (
                  <div class="bt-card-text">
                    {displayed || (streaming && (
                      <span class="bt-card-loading">
                        <Loader2 size={13} class="animate-spin" /> {t('loading', locale)}
                      </span>
                    ))}
                    {/* A caret while more is still arriving, so a pause in the
                        stream doesn't read as a finished translation. */}
                    {displayed && streaming && <span class="bt-card-caret" aria-hidden="true" />}
                  </div>
                )}
              </div>
              {copyText && (
                <button
                  class="bt-card-close bt-card-source-toggle"
                  onClick={() => void copyResult()}
                  title={t(copied ? 'cardCopied' : 'cardCopy', locale)}
                  aria-label={t(copied ? 'cardCopied' : 'cardCopy', locale)}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <div class="bt-card-footer">
        {/* The credit line is also the switch. Who answered and who could
            answer instead are the same question, so they are one control
            rather than a label with a second control beside it. Under a notice
            nobody answered, so there is nothing to credit — but the language
            control stays, because it is what makes the notice recoverable:
            picking a third language is exactly the case the notice got wrong. */}
        {!activeNotice && (
          <button
            class="bt-card-foot-btn"
            onClick={(e) => toggleMenu('provider', e)}
            aria-expanded={menu === 'provider'}
            title={t('cardProvider', locale)}
          >
            <ProviderIcon id={attribution.iconId} size={16} />
            <span class="bt-card-footer-label">{attribution.label || PROVIDERS[provider].label}</span>
            <ChevronDown size={12} />
          </button>
        )}
        <button
          class="bt-card-foot-btn bt-card-foot-lang"
          onClick={(e) => toggleMenu('lang', e)}
          aria-expanded={menu === 'lang'}
          title={t('cardTargetLanguage', locale)}
        >
          <Languages size={16} />
          <span class="bt-card-footer-label">{languageEndonym(targetLang)}</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </div>

    {menu && anchor && (
      <CardMenu
        anchor={anchor}
        fixed={held}
        items={menu === 'lang' ? langItems : providerItems}
        value={menu === 'lang' ? targetLang : provider}
        align={menu === 'lang' ? 'right' : 'left'}
        // Downward, out past the foot of the card: opening upward would lay the
        // list over the translation the reader is choosing a provider for. It
        // flips only where there is genuinely no room below.
        placement="below"
        width={menu === 'lang' ? 224 : 232}
        searchPlaceholder={t(menu === 'lang' ? 'cardSearchLanguages' : 'searchProviders', locale)}
        emptyLabel={t('noMatches', locale)}
        onSelect={(v) => {
          setMenu(null);
          if (menu === 'lang') setLangOverride(v);
          else setProviderOverride(v as ProviderId);
        }}
        onClose={() => setMenu(null)}
      />
    )}
    </>
  );
}
