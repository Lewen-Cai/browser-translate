import { useState, useRef } from 'preact/hooks';
import { cn } from '~/lib/cn';
import { formatHotkey } from './hotkeyFormat';

interface Props {
  label?: string;
  value: string;
  hint?: string;
  disabled?: boolean;
  inline?: boolean;
  /** Localized "Press shortcut…" text shown while recording. */
  recordingLabel: string;
  onChange: (combo: string) => void;
}

/**
 * A press-to-record hotkey field. Click to enter recording mode, then press a
 * modifier + key combo; it captures the first valid combo via formatHotkey.
 * Escape (or blur) cancels. Renders like Input; greys out when disabled.
 */
export function HotkeyInput({ label, value, hint, disabled, inline, recordingLabel, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  function onKeyDown(e: KeyboardEvent) {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      setRecording(false);
      ref.current?.blur();
      return;
    }
    const combo = formatHotkey(e);
    if (combo) {
      onChange(combo);
      setRecording(false);
      ref.current?.blur();
    }
    // else: only modifiers held so far — keep waiting
  }

  return (
    <label class={inline ? 'ap-setting-row' : 'block'}>
      {label && (
        <span class={inline ? 'text-sm text-ap-fg' : 'mb-1.5 block text-xs font-medium text-ap-muted'}>{label}</span>
      )}
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={() => {
          if (!disabled) setRecording(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setRecording(false)}
        class={cn(
          'w-full h-8 rounded-md border border-ap-border bg-ap-surface px-2.5 text-sm text-left font-mono text-ap-fg',
          'focus:border-ap-brand focus:outline-none transition-colors',
          'disabled:bg-ap-bg disabled:text-ap-muted disabled:cursor-not-allowed',
          recording && 'border-ap-brand text-ap-muted',
        )}
      >
        {recording ? recordingLabel : value || '—'}
      </button>
      {hint && <span class="block text-2xs text-ap-muted mt-1">{hint}</span>}
    </label>
  );
}
