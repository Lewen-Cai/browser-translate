import { cn } from '~/lib/cn';

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} class="inline-flex min-w-0 flex-wrap gap-0.5 rounded-lg bg-ap-fg/5 p-1">
      {options.map((option) => <button key={option.value} type="button" aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        class={cn('min-w-0 rounded-md px-3 py-1.5 text-xs transition-colors', option.value === value
          ? 'bg-ap-surface font-medium text-ap-fg shadow-sm' : 'text-ap-muted hover:text-ap-fg')}>
        {option.label}
      </button>)}
    </div>
  );
}
