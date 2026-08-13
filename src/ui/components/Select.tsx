import type { JSX } from 'preact';
import { ChevronDown } from '~/ui/icons';
import { cn } from '~/lib/cn';

interface Props extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  /** Rendered inside the control, left of the value. A native <option> can't
   *  carry an icon, so the selected item's mark goes here instead. */
  leading?: JSX.Element;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, hint, leading, options, class: cls, className, ...rest }: Props) {
  return (
    <label class="block">
      {label && (
        <span class="block text-2xs font-mono uppercase tracking-wider text-ap-muted mb-1">{label}</span>
      )}
      <div class="relative">
        <select
          class={cn(
            'w-full h-8 rounded-md border border-ap-border bg-ap-surface pr-8 text-sm text-ap-fg',
            leading ? 'pl-8' : 'pl-2.5',
            'focus:border-ap-brand focus:outline-none transition-colors appearance-none cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            cls as string, className as string,
          )}
          {...rest}
        >
          {options.map((o) => (
            <option value={o.value}>{o.label}</option>
          ))}
        </select>
        {leading && (
          <span class="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">{leading}</span>
        )}
        <ChevronDown
          size={14}
          class="absolute right-2 top-1/2 -translate-y-1/2 text-ap-fg pointer-events-none"
        />
      </div>
      {hint && <span class="block text-2xs text-ap-subtle mt-1">{hint}</span>}
    </label>
  );
}
