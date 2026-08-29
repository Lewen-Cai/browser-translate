import { describe, it, expect, afterEach } from 'vitest';
import {
  clampCardPosition,
  computeCardBasePosition,
  computeCardVerticalLayout,
} from './cardLayout';

/** The size the tests below reason about; the real one comes from settings. */
const CARD_HEIGHT = 300;
const SIZE = { width: 360, height: CARD_HEIGHT };

function rect(top: number, right: number): DOMRect {
  return { top, right, left: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} } as DOMRect;
}

function setViewport({ scrollY = 0, innerHeight = 800, innerWidth = 1024 }: { scrollY?: number; innerHeight?: number; innerWidth?: number }) {
  Object.defineProperty(window, 'scrollX', { value: 0, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true });
}

const WIDTH = 360;

afterEach(() => setViewport({}));

describe('computeCardVerticalLayout', () => {
  it('drops below the icon for a mid-page selection, at the one height', () => {
    setViewport({ innerHeight: 800 });
    const { top, height } = computeCardVerticalLayout(rect(200, 400), CARD_HEIGHT);
    expect(top).toBe(198); // iconBottom(196) + 2
    expect(height).toBe(CARD_HEIGHT);
  });

  it('goes above the selection when the card would not fit below it', () => {
    // The card used to be squeezed into whatever was left down there, which is
    // how the same word came out a different size at the foot of a page.
    setViewport({ innerHeight: 800 });
    const { top, height } = computeCardVerticalLayout(rect(770, 400), CARD_HEIGHT);
    expect(height).toBe(CARD_HEIGHT);
    expect(top + height).toBeLessThanOrEqual(800 - 8);
    expect(top).toBeLessThan(770);
  });

  it('is the same height wherever on the page the selection was', () => {
    setViewport({ innerHeight: 800 });
    const heights = [40, 200, 400, 600, 770, 799].map(
      (y) => computeCardVerticalLayout(rect(y, 400), CARD_HEIGHT).height,
    );
    expect(new Set(heights)).toEqual(new Set([CARD_HEIGHT]));
  });

  it('keeps the card inside the window at every one of those positions', () => {
    setViewport({ innerHeight: 800 });
    for (const y of [0, 40, 200, 400, 600, 770, 799]) {
      const { top, height } = computeCardVerticalLayout(rect(y, 400), CARD_HEIGHT);
      expect(top).toBeGreaterThanOrEqual(8);
      expect(top + height).toBeLessThanOrEqual(800 - 8);
    }
  });

  it('gives up height only to a window too short to hold the card', () => {
    setViewport({ innerHeight: 260 });
    const { top, height } = computeCardVerticalLayout(rect(100, 400), CARD_HEIGHT);
    expect(height).toBe(260 - 16);
    expect(top).toBe(8);
  });

  it('returns a DOCUMENT-space top (scroll included), with height unaffected', () => {
    setViewport({ innerHeight: 800, scrollY: 1000 });
    const { top, height } = computeCardVerticalLayout(rect(200, 400), CARD_HEIGHT);
    expect(top).toBe(1198); // 198 viewport + 1000 scroll
    expect(height).toBe(CARD_HEIGHT);
  });
});

describe('clampCardPosition', () => {

  it('leaves a position that is already on screen alone', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    expect(clampCardPosition(200, 300, WIDTH)).toEqual({ left: 200, top: 300 });
  });

  it('pulls a card dragged past the right edge back inside', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    expect(clampCardPosition(5000, 300, WIDTH).left).toBe(1024 - WIDTH - 4);
  });

  it('pulls a card dragged past the left or top edge back inside', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    expect(clampCardPosition(-500, -500, WIDTH)).toEqual({ left: 4, top: 4 });
  });

  it('keeps a grabbable strip on screen when dragged past the bottom', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    expect(clampCardPosition(200, 5000, WIDTH).top).toBe(800 - 48);
  });

  it('works in document space, so scrolling does not drag the card away', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800, scrollY: 1000 });
    expect(clampCardPosition(200, 1300, WIDTH)).toEqual({ left: 200, top: 1300 });
    expect(clampCardPosition(200, 0, WIDTH).top).toBe(1004);
  });

  it('pins the card to the left edge when the window is narrower than the card', () => {
    setViewport({ innerWidth: 200, innerHeight: 800 });
    expect(clampCardPosition(50, 100, WIDTH).left).toBe(4);
  });
});

describe('clampCardPosition origin', () => {
  it('measures the box from the screen corner when told the origin is zero', () => {
    // A pinned card is positioned against the viewport, so its coordinates start
    // at the screen's corner no matter how far the page has scrolled.
    setViewport({ innerWidth: 1024, innerHeight: 800, scrollY: 5000 });
    expect(clampCardPosition(200, 300, WIDTH, { x: 0, y: 0 })).toEqual({ left: 200, top: 300 });
    expect(clampCardPosition(200, 5000, WIDTH, { x: 0, y: 0 }).top).toBe(800 - 48);
  });
});

describe('computeCardBasePosition', () => {
  it('right-aligns the card with the trigger icon', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    const base = computeCardBasePosition(rect(200, 700), SIZE);
    expect(base.left + WIDTH).toBeGreaterThan(600);
    expect(base.left).toBeGreaterThanOrEqual(4);
  });

  it('keeps the card on screen for a selection at the right edge', () => {
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    const base = computeCardBasePosition(rect(200, 1020), SIZE);
    expect(base.left).toBeLessThanOrEqual(1024 - WIDTH - 4);
  });

  it('answers in document space, which is what makes it safe to freeze', () => {
    // The viewport clamp inside means the answer moves with the scroll — the
    // reason the caller computes this once and holds it rather than per render.
    setViewport({ innerWidth: 1024, innerHeight: 800 });
    const atTop = computeCardBasePosition(rect(200, 400), SIZE);
    setViewport({ innerWidth: 1024, innerHeight: 800, scrollY: 4000 });
    const scrolled = computeCardBasePosition(rect(200, 400), SIZE);
    expect(scrolled.top).not.toBe(atTop.top);
  });
});
