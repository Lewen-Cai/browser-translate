import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { useT } from '~/i18n';

const COLORS = ['#FFFFFF', '#FACC15', '#67E8F9', '#86EFAC', '#FDA4AF', '#C4B5FD', '#FB923C', '#A3A3A3', '#2563EB', '#000000'];
function parseColor(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}
interface Props {
  label: string;
  value: string;
  onPreview: (value: string) => void;
  onCommit: (value: string) => void;
}

/** Small palette + exact HEX entry, not the platform's large native color dialog. */
export function ColorControl({ label, value, onPreview, onCommit }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [text, setText] = useState(value.toUpperCase());
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => { setText(value.toUpperCase()); setError(false); }, [value]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function commit(raw: string) {
    const color = parseColor(raw);
    setError(!color);
    if (color) { setText(color); onCommit(color); }
  }
  return (
    <div ref={root} class="relative min-w-0" onKeyDown={(e) => {
      if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    }} onBlur={(e) => {
      if (e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) setOpen(false);
    }}>
      <div class="ap-color-control">
        <button ref={trigger} type="button" aria-label={label} title={label} aria-expanded={open}
          aria-controls={open ? `${id}-palette` : undefined} onClick={() => {
            setAbove(window.innerHeight - (root.current?.getBoundingClientRect().bottom ?? 0) < 110);
            setOpen((v) => !v);
          }}>
          <span style={{ background: value }} />
        </button>
        <input aria-label={`${label} HEX`} aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined}
          value={text} maxLength={7} spellcheck={false} class="font-mono"
          onInput={(e) => {
            const raw = e.currentTarget.value;
            setText(raw); setError(false);
            const color = parseColor(raw);
            if (color) onPreview(color);
          }} onBlur={(e) => commit(e.currentTarget.value)} onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              e.currentTarget.value = value.toUpperCase(); setText(value.toUpperCase()); setError(false); e.currentTarget.blur();
            }
          }} />
      </div>
      {error && <p id={`${id}-error`} role="alert" class="mt-1 text-xs text-ap-danger">{t('subtitleInvalidColor')}</p>}
      {open && <div id={`${id}-palette`} role="group" aria-label={label}
        class={`absolute right-0 z-20 grid w-44 grid-cols-5 gap-2 rounded-lg border border-ap-border-strong bg-ap-surface p-3 shadow-lg ${above ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
        {COLORS.map((color) => <button key={color} type="button" title={color} aria-label={color} aria-pressed={value.toUpperCase() === color}
          class="h-6 w-6 rounded-full border border-ap-border-strong hover:ring-2 hover:ring-ap-brand focus-visible:ring-2 focus-visible:ring-ap-brand"
          style={{ background: color }} onClick={() => {
            setText(color); setError(false); onCommit(color); setOpen(false); trigger.current?.focus();
          }} />)}
      </div>}
    </div>
  );
}
