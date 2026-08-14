import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { X, AlertCircle, Loader2, Pin, ChevronDown, ChevronUp } from '~/ui/icons';
import { streamTranslate, abortTranslate } from '~/messaging/client';
import { clampCardPosition, computeCardBasePosition } from './cardLayout';
import { looksLikeDictionary } from '~/core/dictionary/discriminate';
import { advanceReveal } from './reveal';
import { parseDictionaryEntry } from '~/core/dictionary/parse';
import { DictionaryView } from './DictionaryView';
import { ProviderIcon } from '~/ui/ProviderIcon';
import { t } from '~/i18n';
import type { TranslationAttribution } from '~/ui/attribution';
import type { Locale } from '~/i18n/strings';

interface Props {
  text: string;
  rect: DOMRect;
  locale: Locale;
  onClose: () => void;
  notice?: string;
  /** Which model or service is doing the work, shown as a credit line. */
  attribution: TranslationAttribution;
  /** Pinning is enforced outside the card — the content script owns the
   *  outside-click and new-selection handling that pinning suppresses. */
  onPinChange?: (pinned: boolean) => void;
}

const CARD_WIDTH = 360;
let requestSeq = 0;

function friendlyError(raw: string, locale: Locale): string {
  if (/context invalidated|extension context/i.test(raw)) {
    return t('cardRefreshNeeded', locale);
  }
  return raw;
}

export function TranslationCard({
  text, rect, locale, onClose, notice, attribution, onPinChange,
}: Props) {
  const [pinned, setPinned] = useState(false);
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
  const cancelled = useRef(false);
  const receivedRef = useRef('');
  const displayedLenRef = useRef(0);
  const doneRef = useRef(false);

  // Fixed for as long as the card is showing this selection. See
  // computeCardBasePosition: it reads the scroll position, so recomputing it per
  // render would slide the card whenever a chunk arrived mid-scroll.
  const base = useMemo(() => computeCardBasePosition(rect, CARD_WIDTH), [rect]);

  useEffect(() => {
    const animId = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(animId);
  }, []);

  // Keyed on the selection: a pinned card stays mounted while the reader picks
  // new text, and must translate that text rather than keep showing the old
  // result. Position, pin state and the reveal machinery survive the change.
  useEffect(() => {
    if (notice) return;
    cancelled.current = false;
    setSourceExpanded(false);

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
      if (!cancelled.current && !(doneRef.current && caughtUp)) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    void run();

    return () => {
      cancelled.current = true;
      window.cancelAnimationFrame(raf);
      if (currentReqId.current) abortTranslate(currentReqId.current);
    };
  }, [text, notice]);

  async function run() {
    setReceived('');
    setDisplayed('');
    setError(null);
    setStreaming(true);
    receivedRef.current = '';
    displayedLenRef.current = 0;
    doneRef.current = false;
    const reqId = `req-${Date.now()}-${++requestSeq}`;
    currentReqId.current = reqId;
    try {
      let full = '';
      for await (const msg of streamTranslate({
        type: 'translate',
        requestId: reqId,
        text,
      })) {
        if (cancelled.current) return;
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
      if (cancelled.current) return;
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

  return (
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
              onClick={togglePin}
              class="bt-card-close"
              aria-pressed={pinned}
              title={t(pinned ? 'cardUnpin' : 'cardPin', locale)}
              aria-label={t(pinned ? 'cardUnpin' : 'cardPin', locale)}
            >
              <Pin size={12} />
            </button>
            <button onClick={onClose} class="bt-card-close" aria-label="Close">
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
      <div class="bt-card-body">
        {notice ? (
          <div class="bt-card-notice">{notice}</div>
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
                  {sourceExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}
            {error ? (
              <div class="bt-card-error">
                <AlertCircle size={12} class="bt-card-error-icon" />
                <span>{error}</span>
              </div>
            ) : isDict && streaming ? (
              <span class="bt-card-loading">
                <Loader2 size={11} class="animate-spin" /> {t('loading', locale)}
              </span>
            ) : dictEntry ? (
              <DictionaryView entry={dictEntry} locale={locale} />
            ) : (
              <div class="bt-card-text">
                {displayed || (streaming && (
                  <span class="bt-card-loading">
                    <Loader2 size={11} class="animate-spin" /> {t('loading', locale)}
                  </span>
                ))}
                {/* A caret while more is still arriving, so a pause in the
                    stream doesn't read as a finished translation. */}
                {displayed && streaming && <span class="bt-card-caret" aria-hidden="true" />}
              </div>
            )}
          </>
        )}
      </div>
      {!notice && attribution.label && (
        <div class="bt-card-footer">
          <ProviderIcon id={attribution.iconId} size={12} />
          <span class="bt-card-footer-label">{attribution.label}</span>
        </div>
      )}
    </div>
  );
}
