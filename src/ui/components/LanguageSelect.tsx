import { useId, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'preact/hooks';
import { Check, ChevronDown, Languages, Search } from '~/ui/icons';
import { filterLanguages, languageChoices } from '~/core/language/search';
import { cn } from '~/lib/cn';
import { useT, useLocale } from '~/i18n';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** A bounded, searchable picker shared by the toolbar popup and settings page. */
export function LanguageSelect({ value, onChange }: Props) {
  const t = useT();
  const locale = useLocale();
  const choices = useMemo(() => languageChoices(locale), [locale]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 320, transform: 'none' });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const shown = useMemo(() => filterLanguages(choices, query), [choices, query]);
  const current = choices.find((l) => l.code === value);
  const selectedIndex = choices.findIndex((l) => l.code === value);
  const subtitle = (l: (typeof choices)[number]) => l.localized !== l.endonym
    ? l.localized : l.english !== l.endonym ? l.english : l.code;

  function show() {
    setQuery('');
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  }

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function select(code: string) {
    onChange(code);
    close(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function measure() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const flip = below < 180 && above > below;
      const maxHeight = Math.max(80, Math.min(320, flip ? above : below));
      const width = Math.min(rect.width, window.innerWidth - 16);
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: flip ? rect.top - 6 : rect.bottom + 6,
        transform: flip ? 'translateY(-100%)' : 'none',
        width,
        maxHeight,
      });
    }
    measure();
    input.current?.focus();
    window.addEventListener('resize', measure);
    // Capture scrolling ancestors too, but not the list's own scrolling.
    const onScroll = (event: Event) => { if (!root.current?.contains(event.target as Node)) measure(); };
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useLayoutEffect(() => {
    const item = list.current?.querySelector<HTMLElement>('[data-active="true"]');
    const scroll = list.current;
    if (!item || !scroll) return;
    // Scroll only the list, never the settings page or popup document.
    if (item.offsetTop < scroll.scrollTop) scroll.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > scroll.scrollTop + scroll.clientHeight) {
      scroll.scrollTop = item.offsetTop + item.offsetHeight - scroll.clientHeight;
    }
  }, [active, open, query, position.maxHeight]);

  function onKey(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') close();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((n) => Math.max(0, Math.min(shown.length - 1, n + (e.key === 'ArrowDown' ? 1 : -1))));
    } else if (!query && (e.key === 'Home' || e.key === 'End')) {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : Math.max(0, shown.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const language = shown[active];
      if (language) select(language.code);
    }
  }

  return (
    <div ref={root} class="relative" onBlur={(e) => {
      if (e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) close();
    }}>
      <span id={`${id}-label`} class="mb-2 block text-xs font-medium text-ap-muted">{t('targetLanguage')}</span>
      <button ref={trigger} type="button" class="ap-language-trigger" aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
        onClick={() => open ? close() : show()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show(); }
        }}>
        <span class="ap-language-icon" aria-hidden="true"><Languages size={17} /></span>
        <span class="min-w-0 flex-1 text-left">
          <span id={`${id}-value`} class="block truncate text-sm"><bdi>{current?.endonym ?? value}</bdi></span>
          {current && <span class="block truncate text-2xs text-ap-muted"><bdi>{subtitle(current)}</bdi></span>}
        </span>
        <ChevronDown size={14} class={cn('shrink-0 text-ap-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div class="ap-language-menu" style={position}>
        <div class="ap-language-search">
          <Search size={15} class="shrink-0 text-ap-muted" aria-hidden="true" />
          <input ref={input} role="combobox" aria-expanded="true" aria-autocomplete="list"
            aria-label={t('cardSearchLanguages')} aria-controls={`${id}-list`}
            aria-activedescendant={shown[active] ? `${id}-option-${shown[active]!.code}` : undefined}
            placeholder={t('cardSearchLanguages')} value={query} spellcheck={false}
            class="min-w-0 flex-1 bg-transparent text-xs text-ap-fg outline-none placeholder:text-ap-muted"
            onKeyDown={onKey} onInput={(e) => { setQuery(e.currentTarget.value); setActive(0); }} />
          <span class="text-2xs text-ap-muted" aria-hidden="true">{shown.length}</span>
        </div>
        <div ref={list} id={`${id}-list`} class="ap-language-list" role="listbox" aria-labelledby={`${id}-label`}>
          {shown.map((language, index) => <div key={language.code} id={`${id}-option-${language.code}`}
            role="option" aria-selected={language.code === value} data-active={index === active}
            class="ap-language-option" onPointerMove={() => setActive(index)}
            onMouseDown={(e) => e.preventDefault()} onClick={() => select(language.code)}>
            <span class="min-w-0 flex-1">
              <span class="block text-xs"><bdi lang={language.code}>{language.endonym}</bdi></span>
              <span class="mt-0.5 block text-2xs text-ap-muted"><bdi>{subtitle(language)}</bdi></span>
            </span>
            {language.code === value && <Check size={14} class="shrink-0 text-ap-brand" aria-hidden="true" />}
          </div>)}
          {shown.length === 0 && <div class="px-3 py-6 text-center text-xs text-ap-muted">{t('noMatches')}</div>}
        </div>
      </div>}
    </div>
  );
}
