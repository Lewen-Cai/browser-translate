import { Fragment } from 'preact';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown, Check } from '~/ui/icons';
import { ProviderIcon, type ProviderIconId } from '~/ui/ProviderIcon';
import { cn } from '~/lib/cn';

export interface ProviderOption {
  value: string;
  label: string;
  iconId: ProviderIconId;
  group?: string;
}
interface Props {
  label?: string;
  value: string;
  options: readonly ProviderOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  inline?: boolean;
}

/** A compact accessible listbox, viewport-bounded even at the foot of a popup. */
export function ProviderSelect({ label, value, options, onChange, disabled = false, inline }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 260, transform: 'none' });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((o) => o.value === value);

  function close(focus = false) {
    setOpen(false);
    if (focus) trigger.current?.focus();
  }
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const flip = below < 180 && above > below;
    const maxHeight = Math.max(80, Math.min(260, flip ? above : below));
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 16);
    setPosition({ left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      top: flip ? rect.top - 6 : rect.bottom + 6, width, maxHeight,
      transform: flip ? 'translateY(-100%)' : 'none' });
    list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
  }, [open]);
  useLayoutEffect(() => {
    if (!open || !list.current) return;
    const item = list.current.querySelector<HTMLElement>('[aria-selected="true"]');
    if (item) list.current.scrollTop = Math.max(0, item.offsetTop - list.current.clientHeight / 2);
  }, [open, position]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onScroll = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const resize = () => setOpen(false);
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    if (e.key === 'Tab') close();
    const nodes = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    const index = nodes.indexOf(e.target as HTMLButtonElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? nodes.length - 1
        : Math.max(0, Math.min(nodes.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1)));
      nodes[next]?.focus({ preventScroll: true });
      nodes[next]?.scrollIntoView?.({ block: 'nearest' });
    }
  }

  return (
    <div class={inline ? 'ap-route-row' : 'block'} ref={root} onBlur={(e) => {
      if (e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) close();
    }}>
      {label && <span id={`${id}-label`} class={inline ? 'text-sm text-ap-muted' : 'mb-1.5 block text-xs font-medium text-ap-muted'}>{label}</span>}
      <div class="relative min-w-0">
        <button ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open}
          aria-labelledby={label ? `${id}-label ${id}-value` : `${id}-value`}
          aria-controls={open ? `${id}-list` : undefined} disabled={disabled}
          onClick={() => setOpen((v) => !v)} onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); }
            if (e.key === 'Escape') close();
          }}
          class={cn('flex h-9 w-full items-center gap-2 rounded-lg border bg-ap-surface px-2.5 text-sm text-ap-fg transition-colors',
            disabled && 'opacity-50', open ? 'border-ap-brand' : 'border-ap-border hover:border-ap-border-strong')}>
          {selected && <ProviderIcon id={selected.iconId} size={16} />}
          <span id={`${id}-value`} class="min-w-0 flex-1 truncate text-left">{selected?.label ?? ''}</span>
          <ChevronDown size={13} class="shrink-0 text-ap-muted" />
        </button>
        {open && <div ref={list} id={`${id}-list`} role="listbox" aria-label={label}
          onKeyDown={onKey} style={position}
          class="fixed z-50 overflow-y-auto overscroll-contain rounded-lg border border-ap-border-strong bg-ap-surface p-1 shadow-lg">
          {options.map((option, i) => <Fragment key={option.value}>
            {option.group && option.group !== options[i - 1]?.group &&
              <div class="px-2 py-2 text-xs font-medium text-ap-muted">{option.group}</div>}
            <button type="button" role="option" aria-selected={option.value === value} tabIndex={-1}
              onClick={() => { onChange(option.value); close(true); }}
              class={cn('flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-ap-fg/5 focus:bg-ap-fg/5',
                option.value === value ? 'bg-ap-brand/10 text-ap-brand' : 'text-ap-fg')}>
              <ProviderIcon id={option.iconId} size={16} />
              <span class="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === value && <Check size={13} />}
            </button>
          </Fragment>)}
        </div>}
      </div>
    </div>
  );
}
