import type { ComponentChildren } from 'preact';
import { Search, X } from '~/ui/icons';

interface Props {
  value: string;
  onInput: (value: string) => void;
  placeholder: string;
  /** Accessible name of the clear button. */
  clearLabel: string;
  /** Shown at the end of the row, e.g. a match count. */
  trailing?: ComponentChildren;
}

/**
 * A search row for the top of a bordered list. A plain text input with our own
 * clear button, rather than type="search": Chrome draws that one's clear
 * control as a bright blue cross that matches nothing else on the page.
 */
export function SearchField({ value, onInput, placeholder, clearLabel, trailing }: Props) {
  return (
    <div class="flex items-center gap-2 border-b border-ap-border px-3">
      <Search size={13} class="shrink-0 text-ap-subtle" />
      <input
        type="text"
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.stopPropagation(); onInput(''); } }}
        placeholder={placeholder}
        aria-label={placeholder}
        class="h-9 min-w-0 flex-1 bg-transparent text-sm text-ap-fg placeholder:text-ap-subtle focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onInput('')}
          aria-label={clearLabel}
          title={clearLabel}
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ap-subtle transition-colors hover:text-ap-fg"
        >
          <X size={13} />
        </button>
      )}
      {trailing}
    </div>
  );
}
