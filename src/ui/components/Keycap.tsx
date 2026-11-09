import type { ComponentChildren } from 'preact';

/** One key, drawn as a keycap. */
export function Keycap({ children }: { children: ComponentChildren }) {
  return (
    <kbd class="rounded-md border border-b-2 border-ap-border-strong bg-ap-surface px-1.5 py-0.5 font-mono text-[10px] leading-none text-ap-fg shadow-sm">
      {children}
    </kbd>
  );
}

/** A shortcut like "Alt+T", as a row of keycaps. */
export function Shortcut({ combo }: { combo: string }) {
  return (
    <span class="inline-flex items-center gap-1">
      {combo.split('+').map((k) => <Keycap key={k}>{k}</Keycap>)}
    </span>
  );
}
