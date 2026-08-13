import { cn } from '~/lib/cn';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: Props) {
  return (
    <label class={cn('flex items-center justify-between gap-3 py-1.5', disabled && 'opacity-50')}>
      <div class="flex-1 min-w-0">
        {label && <div class="text-sm text-ap-fg">{label}</div>}
        {description && <div class="text-2xs text-ap-muted mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        class={cn(
          'relative h-[18px] w-[34px] rounded-full border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ap-brand/60 focus-visible:ring-offset-1',
          checked
            ? 'bg-ap-brand border-ap-brand'
            : 'bg-ap-border-strong/70 border-ap-border-strong',
        )}
      >
        <span
          class={cn(
            'absolute top-[1px] left-[1px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-[16px]',
          )}
        />
      </button>
    </label>
  );
}
