import { describe, it, expect, vi, afterEach } from 'vitest';

// theme.css?inline is a Vite-only import; stub it so the module loads in jsdom.
vi.mock('~/ui/theme.css?inline', () => ({ default: '' }));

import { createShadowMount } from './mount';

afterEach(() => {
  document.getElementById('browsertranslate-host')?.remove();
});

describe('createShadowMount host', () => {
  it('anchors the host to the DOCUMENT (position:absolute), not the viewport', () => {
    // The icon/card coordinates (computeIconPosition, card clamps) are computed
    // in document space — they add window.scrollX/scrollY. For those coordinates
    // to land correctly, the host that contains them must scroll WITH the page.
    // position:fixed anchors to the viewport, so on a scrolled page every child
    // renders `scrollY` px too low and disappears off-screen. Must be absolute.
    const mount = createShadowMount();
    const host = mount.root.host as HTMLElement;
    expect(host.style.position).toBe('absolute');
  });
});

describe('createShadowMount setTheme', () => {
  it('toggles .dark and injects the theme vars on the in-shadow container', async () => {
    const { BUILT_IN_THEMES } = await import('~/core/theme/themes');
    const cobalt = BUILT_IN_THEMES[0]!;
    const mount = createShadowMount();
    const container = mount.root.querySelector('#bt-root') as HTMLElement;

    mount.setTheme(cobalt, true);
    expect(container.classList.contains('dark')).toBe(true);
    expect(container.style.getPropertyValue('--ap-bg')).toBe('10 10 10');

    mount.setTheme(cobalt, false);
    expect(container.classList.contains('dark')).toBe(false);
    expect(container.style.getPropertyValue('--ap-bg')).toBe('252 252 250');
    expect(container.style.getPropertyValue('--ap-font-sans')).toContain('Geist');
  });
});
