import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLE_STYLE,
  DEFAULT_SUBTITLE_TEXT_STYLE,
  MAX_SUBTITLE_POSITION_PCT,
  clampSubtitleBackgroundOpacity,
  clampSubtitleFontScale,
  clampSubtitleFontWeight,
  normalizeSubtitleColor,
  normalizeSubtitlePosition,
  normalizeSubtitleStyle,
  normalizeSubtitleTextStyle,
  showsOriginal,
  showsTranslation,
} from './style';

describe('clamps', () => {
  it('holds the font scale inside its range and rounds it', () => {
    expect(clampSubtitleFontScale(10)).toBe(50);
    expect(clampSubtitleFontScale(500)).toBe(200);
    expect(clampSubtitleFontScale(123.4)).toBe(123);
    expect(clampSubtitleFontScale('big')).toBe(100);
    expect(clampSubtitleFontScale(Number.NaN)).toBe(100);
  });

  it('snaps the font weight to the nearest hundred', () => {
    expect(clampSubtitleFontWeight(430)).toBe(400);
    expect(clampSubtitleFontWeight(460)).toBe(500);
    expect(clampSubtitleFontWeight(100)).toBe(300);
    expect(clampSubtitleFontWeight(900)).toBe(700);
  });

  it('holds the background opacity between 0 and 100', () => {
    expect(clampSubtitleBackgroundOpacity(-5)).toBe(0);
    expect(clampSubtitleBackgroundOpacity(140)).toBe(100);
    expect(clampSubtitleBackgroundOpacity(undefined)).toBe(78);
  });

  it('accepts six-digit hex colours only', () => {
    expect(normalizeSubtitleColor('#00ff88')).toBe('#00ff88');
    expect(normalizeSubtitleColor('#ABCDEF')).toBe('#ABCDEF');
    expect(normalizeSubtitleColor('#fff')).toBe('#FFFFFF');
    expect(normalizeSubtitleColor('red')).toBe('#FFFFFF');
    expect(normalizeSubtitleColor(null)).toBe('#FFFFFF');
  });
});

describe('normalizeSubtitleTextStyle', () => {
  it('fills every field from junk', () => {
    expect(normalizeSubtitleTextStyle(undefined)).toEqual(DEFAULT_SUBTITLE_TEXT_STYLE);
    expect(normalizeSubtitleTextStyle({ fontFamily: 'comic' }).fontFamily).toBe('youtube');
  });

  it('keeps a known font family', () => {
    expect(normalizeSubtitleTextStyle({ ...DEFAULT_SUBTITLE_TEXT_STYLE, fontFamily: 'serif' })
      .fontFamily).toBe('serif');
  });

  it('falls back when a family this version no longer offers is stored', () => {
    // 'kai' was an option before v0.1.9; a store that still names it must not
    // end up asking for a family that no longer exists.
    expect(normalizeSubtitleTextStyle({ ...DEFAULT_SUBTITLE_TEXT_STYLE, fontFamily: 'kai' })
      .fontFamily).toBe('youtube');
  });

  it('returns the same object when nothing needed fixing', () => {
    const clean = { ...DEFAULT_SUBTITLE_TEXT_STYLE };
    expect(normalizeSubtitleTextStyle(clean)).toBe(clean);
  });
});

describe('normalizeSubtitleStyle', () => {
  it('fills every field from junk', () => {
    expect(normalizeSubtitleStyle(null)).toEqual(DEFAULT_SUBTITLE_STYLE);
  });

  it('rejects an unknown display mode and translation position', () => {
    const fixed = normalizeSubtitleStyle({ displayMode: 'karaoke', translationPosition: 'left' });
    expect(fixed.displayMode).toBe('bilingual');
    expect(fixed.translationPosition).toBe('below');
  });

  it('returns the same object when nothing needed fixing', () => {
    const clean = {
      ...DEFAULT_SUBTITLE_STYLE,
      main: { ...DEFAULT_SUBTITLE_TEXT_STYLE },
      translation: { ...DEFAULT_SUBTITLE_TEXT_STYLE },
    };
    expect(normalizeSubtitleStyle(clean)).toBe(clean);
  });

  it('repairs only the broken half and keeps the rest', () => {
    const fixed = normalizeSubtitleStyle({
      displayMode: 'translationOnly',
      translationPosition: 'above',
      backgroundOpacity: 40,
      main: { fontScale: 9000, color: '#000000', fontFamily: 'serif', fontWeight: 700 },
      translation: DEFAULT_SUBTITLE_TEXT_STYLE,
    });
    expect(fixed.displayMode).toBe('translationOnly');
    expect(fixed.backgroundOpacity).toBe(40);
    expect(fixed.main.fontScale).toBe(200);
    expect(fixed.main.fontFamily).toBe('serif');
    expect(fixed.translation).toBe(DEFAULT_SUBTITLE_TEXT_STYLE);
  });
});

describe('normalizeSubtitlePosition', () => {
  it('defaults junk to the bottom edge', () => {
    expect(normalizeSubtitlePosition(undefined)).toEqual(DEFAULT_SUBTITLE_POSITION);
    expect(normalizeSubtitlePosition({ anchor: 'middle' }).anchor).toBe('bottom');
  });

  it('keeps a top anchor', () => {
    expect(normalizeSubtitlePosition({ percent: 12, anchor: 'top' }))
      .toEqual({ percent: 12, anchor: 'top' });
  });

  it('holds the percentage inside the player', () => {
    expect(normalizeSubtitlePosition({ percent: -20, anchor: 'bottom' }).percent).toBe(0);
    expect(normalizeSubtitlePosition({ percent: 300, anchor: 'top' }).percent)
      .toBe(MAX_SUBTITLE_POSITION_PCT);
  });

  it('returns the same object when nothing needed fixing', () => {
    const clean = { percent: 6, anchor: 'bottom' };
    expect(normalizeSubtitlePosition(clean)).toBe(clean);
  });
});

describe('display mode predicates', () => {
  it('says which lines a mode draws', () => {
    expect([showsOriginal('bilingual'), showsTranslation('bilingual')]).toEqual([true, true]);
    expect([showsOriginal('originalOnly'), showsTranslation('originalOnly')]).toEqual([true, false]);
    expect([showsOriginal('translationOnly'), showsTranslation('translationOnly')])
      .toEqual([false, true]);
  });
});
