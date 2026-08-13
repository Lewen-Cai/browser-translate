import { useState, useEffect, useRef } from 'preact/hooks';
import { X, AlertCircle, Loader2 } from '~/ui/icons';
import { streamTranslate, abortTranslate } from '~/messaging/client';
import { computeIconPosition, ICON_SIZE } from './TriggerIcon';
import { computeCardVerticalLayout } from './cardLayout';
import { looksLikeDictionary } from '~/core/dictionary/discriminate';
import { advanceReveal } from './reveal';
import { parseDictionaryEntry } from '~/core/dictionary/parse';
import { DictionaryView } from './DictionaryView';
import { t } from '~/i18n';
import type { Locale } from '~/i18n/strings';

interface Props {
  text: string;
  rect: DOMRect;
  locale: Locale;
  onClose: () => void;
  notice?: string;
}

const CARD_WIDTH = 360;
let requestSeq = 0;

function friendlyError(raw: string, locale: Locale): string {
  if (/context invalidated|extension context/i.test(raw)) {
    return t('cardRefreshNeeded', locale);
  }
  return raw;
}

export function TranslationCard({ text, rect, locale, onClose, notice }: Props) {
  const [received, setReceived] = useState('');   // full text received so far
  const [displayed, setDisplayed] = useState(''); // progressively revealed slice
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);   // drives open animation
  const currentReqId = useRef<string>('');
  const cancelled = useRef(false);
  const receivedRef = useRef('');
  const displayedLenRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const animId = window.requestAnimationFrame(() => setVisible(true));
    if (!notice) void run();

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

    return () => {
      cancelled.current = true;
      window.cancelAnimationFrame(animId);
      window.cancelAnimationFrame(raf);
      if (currentReqId.current) abortTranslate(currentReqId.current);
    };
  }, []); // mount only

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

  const iconPos = computeIconPosition(rect);
  const iconRight = iconPos.left + ICON_SIZE;
  let cardLeft = iconRight - CARD_WIDTH;
  const minLeft = window.scrollX + 4;
  const maxLeft = window.scrollX + window.innerWidth - CARD_WIDTH - 4;
  if (cardLeft < minLeft) cardLeft = minLeft;
  if (cardLeft > maxLeft) cardLeft = maxLeft;
  const { top: cardTop, maxHeight } = computeCardVerticalLayout(rect);

  // Discriminate on the full received text. Dictionary (JSON, starts with '{')
  // renders only once complete; translations show the typewriter-revealed slice.
  const isDict = looksLikeDictionary(received);
  const dictEntry = isDict && !streaming && !error ? parseDictionaryEntry(received) : null;

  return (
    <div
      class="bt-card"
      style={{
        position: 'absolute',
        top: `${cardTop}px`,
        left: `${cardLeft}px`,
        width: `${CARD_WIDTH}px`,
        maxHeight: `${maxHeight}px`,
        transformOrigin: 'top right',
        transform: visible ? 'scale(1)' : 'scale(0.88)',
        opacity: visible ? 1 : 0,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease-out',
        willChange: 'transform, opacity',
      }}
    >
      <div class="bt-card-header">
        <div class="bt-card-strip" />
        <div class="bt-card-header-content">
          <div class="bt-card-title-row">
            <span class="bt-card-brand-mark">BrowserTranslate</span>
          </div>
          <button onClick={onClose} class="bt-card-close" aria-label="Close">
            <X size={12} />
          </button>
        </div>
      </div>
      <div class="bt-card-body">
        {notice ? (
          <div class="bt-card-notice">{notice}</div>
        ) : (
          <>
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
