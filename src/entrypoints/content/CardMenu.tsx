import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Check, Search } from '~/ui/icons';
import { ProviderIcon } from '~/ui/ProviderIcon';
import type { ProviderId } from '~/core/providers/registry';

export interface CardMenuItem {
  value: string;
  label: string;
  /** Second line — a model name, a language's English name. */
  hint?: string;
  /** Draw this vendor's mark beside the label. */
  iconId?: ProviderId;
  /** Heading the item sits under. Consecutive items sharing one share a heading. */
  group?: string;
}

/** Where the menu hangs from, in viewport coordinates. */
export interface MenuAnchor {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Props {
  anchor: MenuAnchor;
  /**
   * True while the card is pinned. The card switches between document and
   * viewport coordinates when it is pinned, and the menu has to follow it, or
   * scrolling slides one out from under the other.
   */
  fixed: boolean;
  items: CardMenuItem[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** Which edge of the anchor the menu lines up with. */
  align?: 'left' | 'right';
  /** Which side of the anchor it opens on. */
  placement?: 'below' | 'above';
  width?: number;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

/** Above this many entries a list is worth filtering rather than scrolling. */
const SEARCH_THRESHOLD = 8;
/** Clearance between the menu and its trigger, and from the viewport edges. */
const GAP = 6;
const EDGE = 8;
/** How tall the menu opens given the room, and the least it will settle for. */
const PREFERRED = 264;
const USABLE = 168;

/**
 * A dropdown for the translation card.
 *
 * It is a sibling of the card rather than a child of it: the card clips its own
 * overflow so a rounded corner never shows a square edge under it, and a menu
 * inside that would be cut off at the border it is supposed to escape. Hanging
 * it off a measured anchor instead costs one rect and keeps both.
 */
export function CardMenu({
  anchor, fixed, items, value, onSelect, onClose,
  align = 'left', placement = 'below', width = 224,
  searchPlaceholder, emptyLabel = '—',
}: Props) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchable = items.length > SEARCH_THRESHOLD;

  useEffect(() => {
    if (searchable) searchRef.current?.focus();
  }, [searchable]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.hint?.toLowerCase().includes(q) ||
        i.value.toLowerCase().includes(q),
    );
  }, [items, query]);

  // The card positions itself the same two ways, so the menu reads the same
  // scroll offset it does and the two stay locked together.
  const dx = fixed ? 0 : window.scrollX;
  const dy = fixed ? 0 : window.scrollY;

  // The card can be anywhere on the screen, including hard against the top,
  // where a menu asked to open upward has nowhere to go. Take the side that was
  // asked for while it can hold a usable list, and give the menu the room that
  // side actually has rather than the room it would like.
  const spaceAbove = anchor.top - GAP;
  const spaceBelow = window.innerHeight - anchor.bottom - GAP;
  const above = placement === 'above'
    ? spaceAbove >= USABLE || spaceAbove >= spaceBelow
    : spaceBelow < USABLE && spaceAbove > spaceBelow;
  const maxHeight = Math.max(USABLE, Math.min(PREFERRED, above ? spaceAbove : spaceBelow));

  // Kept clear of both side edges, so a control near one does not push half the
  // menu off the screen.
  const wanted = align === 'right' ? anchor.right - width : anchor.left;
  const left = Math.max(EDGE, Math.min(wanted, window.innerWidth - width - EDGE)) + dx;
  const top = (above ? anchor.top - GAP : anchor.bottom + GAP) + dy;

  let lastGroup: string | undefined;

  return (
    <>
      {/* Presses anywhere else close the menu. It lives inside our shadow root,
          so the content script's outside-click handler sees its own UI in the
          composed path and leaves the card alone. */}
      <div
        class="bt-menu-backdrop"
        onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
      />
      <div
        class="bt-menu"
        role="listbox"
        style={{
          position: fixed ? 'fixed' : 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          maxHeight: `${maxHeight}px`,
          // A percentage translation, so opening upward costs no measurement of
          // how tall the list turned out to be.
          ...(above && { transform: 'translateY(-100%)' }),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {searchable && (
          <div class="bt-menu-search">
            <Search size={14} class="bt-menu-search-icon" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder={searchPlaceholder}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          </div>
        )}
        <div class="bt-menu-list">
          {shown.flatMap((item) => {
            const heading = item.group && item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return [
              heading && (
                <div key={`g:${heading}`} class="bt-menu-group">{heading}</div>
              ),
              <button
                key={item.value}
                class="bt-menu-item"
                role="option"
                aria-selected={item.value === value}
                onClick={() => onSelect(item.value)}
              >
                {item.iconId && <ProviderIcon id={item.iconId} size={17} />}
                <span class="bt-menu-item-text">
                  <span class="bt-menu-item-label">{item.label}</span>
                  {item.hint && <span class="bt-menu-item-hint">{item.hint}</span>}
                </span>
                {item.value === value && <Check size={14} class="bt-menu-check" />}
              </button>,
            ];
          })}
          {shown.length === 0 && <div class="bt-menu-empty">{emptyLabel}</div>}
        </div>
      </div>
    </>
  );
}
