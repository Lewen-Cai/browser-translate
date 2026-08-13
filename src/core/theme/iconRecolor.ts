/**
 * Recolor helpers for the extension action icon. The shipped icon is exactly
 * two-tone — brand-color rounded square + white glyph (plus antialiased blend
 * pixels between the two and toward transparency) — so every opaque pixel can
 * be modeled as lerp(brand, white, t) and rebuilt as lerp(newBrand, white, t).
 */

/** Parse an 'R G B' theme triple into components. Throws on malformed input. */
export function parseRgbTriple(triple: string): [number, number, number] {
  const m = triple.match(/^(\d{1,3}) (\d{1,3}) (\d{1,3})$/);
  if (!m) throw new Error(`Not an RGB triple: "${triple}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * In-place remap of RGBA pixel data from the baked two-tone pair
 * (background `from` + WHITE glyph) to a new pair (`to` background +
 * `toGlyph` glyph — the theme's brand / brand-fg, i.e. exactly the colors
 * the in-page trigger icon renders with). For each non-transparent pixel,
 * estimate its white-mix factor t against `from` (averaged over channels
 * with usable headroom), then rebuild the pixel as lerp(to, toGlyph, t).
 * Alpha is preserved, so edge antialiasing toward transparency survives.
 */
export function recolorIconPixels(
  data: Uint8ClampedArray,
  from: [number, number, number],
  to: [number, number, number],
  toGlyph: [number, number, number] = [255, 255, 255],
): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // fully transparent

    let tSum = 0;
    let tCount = 0;
    for (let c = 0; c < 3; c++) {
      const headroom = 255 - from[c]!;
      if (headroom < 32) continue; // channel too close to white to measure
      tSum += ((data[i + c]! - from[c]!) / headroom);
      tCount++;
    }
    const t = tCount > 0 ? Math.min(1, Math.max(0, tSum / tCount)) : 1;

    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.round(to[c]! + t * (toGlyph[c]! - to[c]!));
    }
  }
}
