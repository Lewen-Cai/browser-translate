/**
 * Minimal HTML-entity escape/decode for the free MT engines.
 *
 * Both services run their input through an HTML pipeline: a bare `<` is eaten
 * (Microsoft mangles "a < b and c > d" into "<B和C> d") and a bare `&` can start
 * a legacy entity. So we escape on the way out and decode on the way back — the
 * services return their output entity-encoded regardless.
 *
 * Written out rather than pulling in a dependency: the service output is plain
 * prose, so numeric references plus the punctuation entities below cover it.
 */

/** Escape the three characters an HTML text node must not contain literally. */
export function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', bull: '•', middot: '·', deg: '°', plusmn: '±',
  times: '×', divide: '÷', dagger: '†', permil: '‰', prime: '′', Prime: '″',
  euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', para: '¶',
  micro: 'µ', frac12: '½', frac14: '¼', frac34: '¾', sup2: '²', sup3: '³',
  ne: '≠', le: '≤', ge: '≥', larr: '←', rarr: '→', harr: '↔',
};

const ENTITY_RE = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]{1,31}));/g;

/** Decode numeric and common named references. Unknown references are left as-is. */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(ENTITY_RE, (match, dec: string | undefined, hex: string | undefined, name: string | undefined) => {
    if (dec !== undefined) return codePointToString(Number.parseInt(dec, 10)) ?? match;
    if (hex !== undefined) return codePointToString(Number.parseInt(hex, 16)) ?? match;
    return (name !== undefined ? NAMED_ENTITIES[name] : undefined) ?? match;
  });
}

function codePointToString(code: number): string | null {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return null;
  // Lone surrogates are not valid scalar values; leaving the reference intact
  // is better than emitting an unpaired code unit into the DOM.
  if (code >= 0xd800 && code <= 0xdfff) return null;
  return String.fromCodePoint(code);
}
