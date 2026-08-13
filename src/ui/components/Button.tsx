import type { ComponentChildren, JSX } from 'preact';
import { cn } from '~/lib/cn';

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children?: ComponentChildren;
}

export function Button({ variant = 'primary', size = 'md', class: cls, className, children, ...rest }: Props) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-ap-brand text-ap-brand-fg hover:opacity-90',
    // A subtle fg-tinted fill so the button reads as a control even when
    // surface ≈ bg (light mode was white-on-white with only a hairline).
    secondary: 'bg-ap-fg/5 border border-ap-border-strong text-ap-fg hover:bg-ap-fg/10',
    ghost:     'text-ap-muted hover:text-ap-fg hover:bg-ap-bg',
    danger:    'bg-ap-danger text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-sm',
  };
  return (
    <button class={cn(base, variants[variant], sizes[size], cls as string, className as string)} {...rest}>
      {children}
    </button>
  );
}
