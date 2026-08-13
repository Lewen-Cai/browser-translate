import { describe, it, expect } from 'vitest';
import { parseRgbTriple, recolorIconPixels } from './iconRecolor';

const COBALT: [number, number, number] = [37, 99, 235];
const TEAL: [number, number, number] = [13, 124, 128];

function px(r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  return new Uint8ClampedArray([r, g, b, a]);
}

describe('parseRgbTriple', () => {
  it('parses theme triples', () => {
    expect(parseRgbTriple('37 99 235')).toEqual([37, 99, 235]);
  });
  it('throws on malformed input', () => {
    expect(() => parseRgbTriple('#2563EB')).toThrow();
    expect(() => parseRgbTriple('37,99,235')).toThrow();
  });
});

describe('recolorIconPixels', () => {
  it('maps the old brand color exactly to the new brand color', () => {
    const data = px(...COBALT);
    recolorIconPixels(data, COBALT, TEAL);
    expect([data[0], data[1], data[2], data[3]]).toEqual([...TEAL, 255]);
  });

  it('keeps pure white (the glyph) white when no glyph color is given', () => {
    const data = px(255, 255, 255);
    recolorIconPixels(data, COBALT, TEAL);
    expect([data[0], data[1], data[2]]).toEqual([255, 255, 255]);
  });

  it('maps the white glyph to the new brand-fg (Graphite dark: light bg + DARK glyph)', () => {
    const graphiteDarkBrand: [number, number, number] = [229, 229, 229];
    const graphiteDarkFg: [number, number, number] = [23, 23, 23];
    const glyph = px(255, 255, 255);
    recolorIconPixels(glyph, COBALT, graphiteDarkBrand, graphiteDarkFg);
    expect([glyph[0], glyph[1], glyph[2]]).toEqual([...graphiteDarkFg]);

    const bg = px(...COBALT);
    recolorIconPixels(bg, COBALT, graphiteDarkBrand, graphiteDarkFg);
    expect([bg[0], bg[1], bg[2]]).toEqual([...graphiteDarkBrand]);
  });

  it('maps a 50% brand/white blend to a 50% blend of the new pair', () => {
    const half = COBALT.map((c) => Math.round(c + 0.5 * (255 - c))) as [number, number, number];
    const data = px(...half);
    recolorIconPixels(data, COBALT, TEAL);
    const expected = TEAL.map((c) => Math.round(c + 0.5 * (255 - c)));
    for (let c = 0; c < 3; c++) {
      expect(Math.abs(data[c]! - expected[c]!)).toBeLessThanOrEqual(2);
    }
  });

  it('leaves fully transparent pixels untouched and preserves alpha', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 0, ...COBALT, 128]);
    recolorIconPixels(data, COBALT, TEAL);
    expect([data[0], data[1], data[2], data[3]]).toEqual([10, 20, 30, 0]);
    expect(data[7]).toBe(128); // partial alpha preserved on recolored pixel
    expect([data[4], data[5], data[6]]).toEqual([...TEAL]);
  });

  it('processes multi-pixel buffers', () => {
    const data = new Uint8ClampedArray([...COBALT, 255, 255, 255, 255, 255]);
    recolorIconPixels(data, COBALT, TEAL);
    expect([data[0], data[1], data[2]]).toEqual([...TEAL]);
    expect([data[4], data[5], data[6]]).toEqual([255, 255, 255]);
  });
});
