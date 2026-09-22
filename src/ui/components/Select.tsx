import type { JSX } from 'preact';
import { ChevronDown } from '~/ui/icons';
import { cn } from '~/lib/cn';

interface Props extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  inline?: boolean;
  options: readonly { value: string; label: string }[];
}

export function Select({ label, hint, inline, options, class: cls, className, ...rest }: Props) {
  return (
    <label class={inline ? 'ap-setting-row' : 'block'}>
      {label && (
        <span class={inline ? 'text-sm text-ap-fg' : 'mb-1.5 block text-xs font-medium text-ap-muted'}>{label}</span>
      )}
      <div class="relative">
        <select
          class={cn(
            'w-full h-8 rounded-md border border-ap-border bg-ap-surface pl-2.5 pr-8 text-sm text-ap-fg',
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
        <ChevronDown
          size={14}
          class="absolute right-2 top-1/2 -translate-y-1/2 text-ap-fg pointer-events-none"
        />
      </div>
      {hint && <span class="col-span-full block text-xs leading-relaxed text-ap-muted">{hint}</span>}
    </label>
  );
}
