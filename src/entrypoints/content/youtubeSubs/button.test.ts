import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountSubsButton } from './button';

beforeEach(() => { document.body.innerHTML = ''; });

describe('mountSubsButton', () => {
  it('inserts a button into the right-controls and toggles on click', () => {
    document.body.innerHTML = '<div class="ytp-right-controls"></div>';
    const onToggle = vi.fn();
    const handle = mountSubsButton({
      titleOff: 'Translate subtitles',
      titleOn: 'Turn off',
      onToggle,
    });
    const btn = document.querySelector<HTMLButtonElement>('.bt-yt-subs-button');
    expect(btn).not.toBeNull();
    btn!.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
    handle.setActive(true);
    expect(btn!.title).toBe('Turn off');
    expect(btn!.getAttribute('aria-pressed')).toBe('true');
  });

  it('does nothing and reports false when controls are absent', () => {
    const handle = mountSubsButton({ titleOff: 'x', titleOn: 'y', onToggle: vi.fn() });
    expect(handle.mounted).toBe(false);
  });

  it('rebinds onToggle when remounted on the same persisted button', () => {
    document.body.innerHTML = '<div class="ytp-right-controls"></div>';
    const first = vi.fn();
    const second = vi.fn();
    mountSubsButton({ titleOff: 'a', titleOn: 'b', onToggle: first });
    // Remount (e.g. SPA nav) with a different handler; button element persists.
    mountSubsButton({ titleOff: 'a', titleOn: 'b', onToggle: second });
    const btns = document.querySelectorAll('.bt-yt-subs-button');
    expect(btns).toHaveLength(1); // still idempotent, no duplicate
    (btns[0] as HTMLButtonElement).click();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
