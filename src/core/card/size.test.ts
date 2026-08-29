import { describe, it, expect } from 'vitest';
import {
  CARD_HEIGHT_CHOICES,
  CARD_WIDTH_CHOICES,
  DEFAULT_CARD_SIZE,
  MAX_CARD_HEIGHT,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MIN_CARD_WIDTH,
  normalizeCardSize,
} from './size';

describe('normalizeCardSize', () => {
  it('returns the same object when the stored size is already sound', () => {
    // Identity matters: fillSettingsDefaults decides whether to write the store
    // back by comparing references, so a fresh object here is a write on every
    // single load.
    const stored = { width: 420, height: 300 };
    expect(normalizeCardSize(stored)).toBe(stored);
  });

  it('pulls a size outside the workable range back to its edge', () => {
    expect(normalizeCardSize({ width: 40, height: 40 })).toEqual({
      width: MIN_CARD_WIDTH,
      height: MIN_CARD_HEIGHT,
    });
    expect(normalizeCardSize({ width: 5000, height: 5000 })).toEqual({
      width: MAX_CARD_WIDTH,
      height: MAX_CARD_HEIGHT,
    });
  });

  it('falls back to the default for anything that is not a number', () => {
    for (const junk of [undefined, null, 'big', {}, { width: '420', height: null }, []]) {
      expect(normalizeCardSize(junk), JSON.stringify(junk)).toEqual(DEFAULT_CARD_SIZE);
    }
  });

  it('keeps a sound dimension when only the other one is broken', () => {
    expect(normalizeCardSize({ width: 560, height: NaN })).toEqual({
      width: 560,
      height: DEFAULT_CARD_SIZE.height,
    });
  });

  it('rounds, because a fractional pixel is not a size anybody chose', () => {
    expect(normalizeCardSize({ width: 420.6, height: 300.4 })).toEqual({
      width: 421,
      height: 300,
    });
  });
});

describe('the sizes offered', () => {
  it('offers only sizes that survive normalising, so the picker cannot lie', () => {
    for (const width of CARD_WIDTH_CHOICES) {
      expect(normalizeCardSize({ width, height: 300 }).width).toBe(width);
    }
    for (const height of CARD_HEIGHT_CHOICES) {
      expect(normalizeCardSize({ width: 420, height }).height).toBe(height);
    }
  });

  it('includes the default, or it could not be shown as selected', () => {
    expect(CARD_WIDTH_CHOICES).toContain(DEFAULT_CARD_SIZE.width);
    expect(CARD_HEIGHT_CHOICES).toContain(DEFAULT_CARD_SIZE.height);
  });

  it('spans the full range it allows', () => {
    expect(Math.min(...CARD_WIDTH_CHOICES)).toBe(MIN_CARD_WIDTH);
    expect(Math.max(...CARD_WIDTH_CHOICES)).toBe(MAX_CARD_WIDTH);
    expect(Math.min(...CARD_HEIGHT_CHOICES)).toBe(MIN_CARD_HEIGHT);
    expect(Math.max(...CARD_HEIGHT_CHOICES)).toBe(MAX_CARD_HEIGHT);
  });
});
