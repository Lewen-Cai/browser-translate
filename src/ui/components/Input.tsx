import type { JSX } from 'preact';
import { cn } from '~/lib/cn';

interface Props extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  inline?: boolean;
}

export function Input({ label, error, hint, mono, inline, class: cls, className, ...rest }: Props) {
  return (
    <label class={inline ? 'ap-setting-row' : 'block'}>
      {label && (
        <span class={inline ? 'text-sm text-ap-fg' : 'mb-1.5 block text-xs font-medium text-ap-muted'}>{label}</span>
      )}
      <input
        class={cn(
          'w-full h-8 rounded-md border border-ap-border bg-ap-surface px-2.5 text-sm text-ap-fg',
          'placeholder:text-ap-subtle',
          'focus:border-ap-brand focus:outline-none transition-colors',
          error && 'border-ap-danger',
          'disabled:bg-ap-bg disabled:text-ap-muted disabled:cursor-not-allowed',
          mono && 'font-mono',
          cls as string, className as string,
        )}
        {...rest}
      />
      {error && <span class="block text-2xs text-ap-danger mt-1">{error}</span>}
      {!error && hint && <span class="block text-2xs text-ap-muted mt-1">{hint}</span>}
    </label>
  );
}
