import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown, Check } from '~/ui/icons';
import { ProviderIcon, type ProviderIconId } from '~/ui/ProviderIcon';
import { cn } from '~/lib/cn';

export interface ProviderOption {
  value: string;
  label: string;
  iconId: ProviderIconId;
}

interface Props {
  label?: string;
  value: string;
  options: ProviderOption[];
  onChange: (value: string) => void;
}

/**
 * A provider picker that shows each vendor's mark beside its name.
 *
 * A native <select> can't do that — an <option> renders as text only — so this
 * is a listbox built from buttons. It stays keyboard- and screen-reader-usable
 * through the listbox roles, and closes on Escape or a click elsewhere.
 */
export function ProviderSelect({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div class="block" ref={rootRef}>
      {label && (
        <span class="block text-2xs font-mono uppercase tracking-wider text-ap-muted mb-1">
          {label}
        </span>
      )}
      <div class="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          class={cn(
            'flex h-8 w-full items-center gap-2 rounded-md border bg-ap-surface pl-2.5 pr-8 text-sm text-ap-fg',
            'transition-colors focus:outline-none',
            open ? 'border-ap-brand' : 'border-ap-border hover:border-ap-border-strong',
          )}
        >
          {selected && <ProviderIcon id={selected.iconId} size={16} />}
          <span class="flex-1 truncate text-left">{selected?.label ?? ''}</span>
        </button>
        <ChevronDown
          size={14}
          class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ap-fg"
        />

        {open && (
          <ul
            role="listbox"
            class={cn(
              'absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md',
              'border border-ap-border bg-ap-surface py-1 shadow-lg',
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    class={cn(
                      'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors',
                      isSelected ? 'text-ap-fg' : 'text-ap-muted hover:text-ap-fg',
                      'hover:bg-ap-fg/5',
                    )}
                  >
                    <ProviderIcon id={option.iconId} size={16} />
                    <span class="flex-1 truncate">{option.label}</span>
                    {isSelected && <Check size={12} class="text-ap-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
