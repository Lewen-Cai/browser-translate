import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountSubsButton } from './button';

const YT_BUTTON = {
  container: '.ytp-right-controls',
  className: 'ytp-button',
  place: 'start' as const,
  idleColor: '#fff',
  activeColor: '#3ea6ff',
  width: '48px',
};

beforeEach(() => { document.body.innerHTML = ''; });

describe('mountSubsButton', () => {
  it('inserts a button into the right-controls and toggles on click', () => {
    document.body.innerHTML = '<div class="ytp-right-controls"></div>';
    const onToggle = vi.fn();
    const handle = mountSubsButton(YT_BUTTON, {
      titleOff: 'Translate subtitles',
      titleOn: 'Turn off',
      onToggle,
    });
    const btn = document.querySelector<HTMLButtonElement>('.bt-subs-button');
    expect(btn).not.toBeNull();
    btn!.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
    handle.setActive(true);
    expect(btn!.title).toBe('Turn off');
    expect(btn!.getAttribute('aria-pressed')).toBe('true');
  });

  it('does nothing and reports false when controls are absent', () => {
    const handle = mountSubsButton(YT_BUTTON, { titleOff: 'x', titleOn: 'y', onToggle: vi.fn() });
    expect(handle.mounted).toBe(false);
  });

  it('rebinds onToggle when remounted on the same persisted button', () => {
    document.body.innerHTML = '<div class="ytp-right-controls"></div>';
    const first = vi.fn();
    const second = vi.fn();
    mountSubsButton(YT_BUTTON, { titleOff: 'a', titleOn: 'b', onToggle: first });
    // Remount (e.g. SPA nav) with a different handler; button element persists.
    mountSubsButton(YT_BUTTON, { titleOff: 'a', titleOn: 'b', onToggle: second });
    const btns = document.querySelectorAll('.bt-subs-button');
    expect(btns).toHaveLength(1); // still idempotent, no duplicate
    (btns[0] as HTMLButtonElement).click();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('the corner fallback', () => {
  const GENERIC = {
    container: '.vjs-control-bar',
    fallback: 'player-corner' as const,
    place: 'end' as const,
    width: '40px',
  };

  it('sits in the corner of the picture when there is no control bar to join', () => {
    // Without this there is no way into the menu at all on a player we do not
    // recognise, which is most of them.
    document.body.innerHTML = '<div class="player"><video></video></div>';
    const handle = mountSubsButton(GENERIC, { titleOff: 'x', titleOn: 'y', onToggle: vi.fn() }, '.player');
    expect(handle.mounted).toBe(true);
    const btn = document.querySelector<HTMLElement>('.player > .bt-subs-button');
    expect(btn).not.toBeNull();
    expect(btn!.style.position).toBe('absolute');
    // Over the picture it must carry its own background, or a white glyph on a
    // white frame is invisible.
    expect(btn!.style.background).not.toBe('');
  });

  it('still prefers a real control bar when the page has one', () => {
    document.body.innerHTML = '<div class="player"><div class="vjs-control-bar"></div></div>';
    mountSubsButton(GENERIC, { titleOff: 'x', titleOn: 'y', onToggle: vi.fn() }, '.player');
    expect(document.querySelector('.vjs-control-bar > .bt-subs-button')).not.toBeNull();
    expect(document.querySelector('.player > .bt-subs-button')).toBeNull();
  });

  it('reports false when neither the bar nor the player is there', () => {
    expect(mountSubsButton(GENERIC, { titleOff: 'x', titleOn: 'y', onToggle: vi.fn() }, '.player').mounted)
      .toBe(false);
  });
});
