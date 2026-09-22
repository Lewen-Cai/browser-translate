import { useEffect, useState } from 'preact/hooks';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  buttons?: boolean;
  onPreview: (value: number) => void;
  onCommit: (value: number) => void;
}

/** Keeps incomplete typing local; commits only a finite, clamped integer. */
export function NumberControl({ label, value, min, max, step = 5, suffix = '%', buttons = true, onPreview, onCommit }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
  function commit(raw: string) {
    const parsed = raw.trim() ? Number(raw) : NaN;
    const next = Number.isFinite(parsed) ? clamp(parsed) : value;
    setText(String(next));
    onCommit(next);
  }
  function increment(delta: number) {
    const next = clamp(value + delta);
    setText(String(next));
    onCommit(next);
  }
  return (
    <div class="ap-number-control">
      {buttons && <button type="button" aria-label={`${label} −`} disabled={value <= min} onClick={() => increment(-step)}>−</button>}
      <input aria-label={label} type="number" min={min} max={max} step="1" value={text}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          setText(raw);
          const number = raw.trim() ? Number(raw) : NaN;
          if (Number.isFinite(number) && number >= min && number <= max) onPreview(Math.round(number));
        }}
        onBlur={(e) => commit(e.currentTarget.value)} onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { e.currentTarget.value = String(value); setText(String(value)); e.currentTarget.blur(); }
        }} />
      <span aria-hidden="true" class="text-xs text-ap-muted">{suffix}</span>
      {buttons && <button type="button" aria-label={`${label} +`} disabled={value >= max} onClick={() => increment(step)}>+</button>}
    </div>
  );
}
