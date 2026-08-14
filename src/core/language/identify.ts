import { languageEndonym } from './targets';

/**
 * What language a selection is in, named well enough to show a reader.
 *
 * This is a different question from `detect.ts`, which answers "is this already
 * the target language, so should we skip it" and is deliberately coarse and
 * conservative — a wrong yes there means refusing to translate. Here a wrong
 * answer only mislabels a line the reader can see for themselves, so it can
 * afford to guess, and it is worth guessing at the two dozen languages the
 * target list can name rather than at four scripts.
 *
 * Nothing here asks a service. The pair has to be on the card before the
 * translation comes back, it has to work for a model that never reports a
 * detected language, and it costs nothing to run.
 */

/** A range of code points that identifies a script outright. */
interface ScriptRange {
  from: number;
  to: number;
  script: Script;
}

type Script =
  | 'latin' | 'han' | 'kana' | 'hangul' | 'cyrillic' | 'greek'
  | 'arabic' | 'hebrew' | 'devanagari' | 'thai' | 'bengali';

const RANGES: readonly ScriptRange[] = [
  { from: 0x0041, to: 0x005a, script: 'latin' },
  { from: 0x0061, to: 0x007a, script: 'latin' },
  { from: 0x00c0, to: 0x024f, script: 'latin' },   // Latin-1 Supplement + Extended-A/B
  { from: 0x1e00, to: 0x1eff, script: 'latin' },   // Latin Extended Additional (Vietnamese)
  { from: 0x0370, to: 0x03ff, script: 'greek' },
  { from: 0x0400, to: 0x04ff, script: 'cyrillic' },
  { from: 0x0590, to: 0x05ff, script: 'hebrew' },
  { from: 0x0600, to: 0x06ff, script: 'arabic' },
  { from: 0x0750, to: 0x077f, script: 'arabic' },
  { from: 0x0900, to: 0x097f, script: 'devanagari' },
  { from: 0x0980, to: 0x09ff, script: 'bengali' },
  { from: 0x0e00, to: 0x0e7f, script: 'thai' },
  { from: 0x3040, to: 0x30ff, script: 'kana' },
  { from: 0x4e00, to: 0x9fff, script: 'han' },
  { from: 0x3400, to: 0x4dbf, script: 'han' },
  { from: 0xf900, to: 0xfaff, script: 'han' },
  { from: 0xac00, to: 0xd7af, script: 'hangul' },
  { from: 0x1100, to: 0x11ff, script: 'hangul' },
];

function scriptOf(code: number): Script | null {
  for (const r of RANGES) {
    if (code >= r.from && code <= r.to) return r.script;
  }
  return null;
}

/**
 * Characters written only one way in each of the two Chinese scripts. A
 * sentence gives several; a single word may give none, and then the answer is
 * whichever appeared, defaulting to Simplified.
 */
const SIMPLIFIED_ONLY = '们个这来说时对国会学实发现点么样还过为语义电车轮书门问题华马长应识经开关议闻见';
const TRADITIONAL_ONLY = '們個這來說時對國會學實發現點麼樣還過為語義電車輪書門問題華馬長應識經開關議聞見';

/** Letters that belong to one language of a script and not its neighbours. */
const UKRAINIAN_ONLY = 'їієґЇІЄҐ';
const PERSIAN_ONLY = 'پچژگ';
const URDU_ONLY = 'ٹڈڑںےہھ';

/**
 * Latin-script markers. Diacritics first — a single ř settles Czech where a
 * dozen stopwords might not — then common words, which are what carry a
 * sentence with no accents in it at all.
 */
interface LatinProfile {
  code: string;
  /** Letters that all but settle it. Weighted heavily. */
  marks?: string;
  /** Everyday words. Weighted by how many distinct ones turn up. */
  words: readonly string[];
}

const LATIN: readonly LatinProfile[] = [
  { code: 'en', words: ['the', 'and', 'of', 'to', 'is', 'in', 'that', 'it', 'for', 'with', 'this', 'are', 'was', 'be', 'have'] },
  { code: 'es', marks: 'ñ¿¡', words: ['el', 'la', 'de', 'que', 'los', 'las', 'una', 'por', 'con', 'para', 'como', 'pero', 'más', 'este'] },
  { code: 'fr', marks: 'œàèêôû', words: ['le', 'la', 'les', 'des', 'une', 'que', 'qui', 'pour', 'dans', 'est', 'pas', 'sur', 'avec', 'plus'] },
  { code: 'de', marks: 'ß', words: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'mit', 'für', 'auch', 'sich', 'auf', 'von'] },
  { code: 'it', marks: 'ìòù', words: ['il', 'la', 'di', 'che', 'per', 'con', 'del', 'una', 'sono', 'più', 'anche', 'come', 'gli', 'nel'] },
  { code: 'pt', marks: 'ãõ', words: ['de', 'que', 'não', 'uma', 'com', 'para', 'como', 'mais', 'por', 'são', 'dos', 'está', 'você', 'isso'] },
  { code: 'nl', words: ['de', 'het', 'een', 'en', 'van', 'dat', 'is', 'niet', 'op', 'te', 'voor', 'met', 'zijn', 'aan'] },
  { code: 'pl', marks: 'ąćęłńśźż', words: ['nie', 'jest', 'się', 'oraz', 'przez', 'jako', 'tego', 'który'] },
  { code: 'cs', marks: 'řůě', words: ['je', 'na', 'se', 'ale', 'jako', 'nebo', 'který', 'této'] },
  { code: 'tr', marks: 'ığşı', words: ['bir', 'bu', 've', 'için', 'ile', 'daha', 'olarak', 'olan'] },
  { code: 'vi', marks: 'ơưđếộữấầằ', words: ['và', 'của', 'các', 'được', 'trong', 'không', 'một', 'này'] },
  { code: 'ro', marks: 'ășțî', words: ['și', 'este', 'pentru', 'care', 'din', 'sunt', 'mai'] },
  { code: 'hu', marks: 'őű', words: ['és', 'egy', 'nem', 'hogy', 'meg', 'volt', 'mint'] },
  { code: 'sv', marks: 'åäö', words: ['och', 'att', 'det', 'som', 'för', 'med', 'inte', 'den'] },
  { code: 'da', marks: 'æø', words: ['og', 'det', 'at', 'en', 'til', 'ikke', 'med', 'for'] },
  { code: 'nb', marks: 'æø', words: ['og', 'det', 'som', 'ikke', 'til', 'har', 'med', 'jeg'] },
  { code: 'fi', marks: 'äö', words: ['ja', 'on', 'ei', 'että', 'ovat', 'sekä', 'mutta', 'kuin'] },
  { code: 'id', words: ['yang', 'dan', 'dengan', 'untuk', 'tidak', 'dari', 'ini', 'adalah'] },
  { code: 'ms', words: ['yang', 'dan', 'dengan', 'untuk', 'tidak', 'daripada', 'ini', 'adalah'] },
];

/** Languages named only as a source — the target list splits these by region. */
const SOURCE_ONLY_ENDONYMS: Readonly<Record<string, string>> = {
  pt: 'Português',
};

/**
 * The language's own name, for the pair shown on the card. Falls back to the
 * target list, which already carries an endonym for everything else.
 */
export function sourceLanguageEndonym(code: string): string {
  return SOURCE_ONLY_ENDONYMS[code] ?? languageEndonym(code);
}

/**
 * Best guess at what language `text` is written in, as a language code, or null
 * when there is nothing to go on — an empty selection, a number, an emoji.
 */
export function identifyLanguage(text: string): string | null {
  if (!text) return null;

  const counts = new Map<Script, number>();
  let simplified = 0;
  let traditional = 0;
  let ukrainian = 0;
  let persian = 0;
  let urdu = 0;

  for (const ch of text) {
    const script = scriptOf(ch.codePointAt(0)!);
    if (!script) continue;
    counts.set(script, (counts.get(script) ?? 0) + 1);
    if (script === 'han') {
      if (SIMPLIFIED_ONLY.includes(ch)) simplified++;
      else if (TRADITIONAL_ONLY.includes(ch)) traditional++;
    } else if (script === 'cyrillic') {
      if (UKRAINIAN_ONLY.includes(ch)) ukrainian++;
    } else if (script === 'arabic') {
      if (URDU_ONLY.includes(ch)) urdu++;
      else if (PERSIAN_ONLY.includes(ch)) persian++;
    }
  }

  if (counts.size === 0) return null;

  // Kana settles Japanese outright: Japanese borrows Han characters, so a text
  // with both is Japanese, while one with Han alone is not.
  if ((counts.get('kana') ?? 0) > 0) return 'ja';

  let winner: Script = 'latin';
  let best = -1;
  for (const [script, n] of counts) {
    if (n > best) { best = n; winner = script; }
  }

  switch (winner) {
    case 'han':
      return traditional > simplified ? 'zh-TW' : 'zh-CN';
    case 'hangul':
      return 'ko';
    case 'cyrillic':
      return ukrainian > 0 ? 'uk' : 'ru';
    case 'greek':
      return 'el';
    case 'hebrew':
      return 'he';
    case 'arabic':
      return urdu > 0 ? 'ur' : persian > 0 ? 'fa' : 'ar';
    case 'devanagari':
      return 'hi';
    case 'bengali':
      return 'bn';
    case 'thai':
      return 'th';
    case 'kana':
      return 'ja';
    case 'latin':
      return identifyLatin(text);
  }
}

/**
 * Which Latin-script language, by accented letters and everyday words.
 *
 * English is the fallback rather than null: a Latin selection with no marks and
 * no function words is usually a single English word or a technical phrase, and
 * on the web that guess is right far more often than it is wrong. The card says
 * the language was detected, and the original is on screen beside it.
 */
function identifyLatin(text: string): string {
  const lower = text.toLowerCase();
  const words = new Set(lower.split(/[^\p{L}\p{M}']+/u).filter(Boolean));

  let bestCode = 'en';
  let bestScore = 0;

  for (const profile of LATIN) {
    let score = 0;
    if (profile.marks) {
      for (const mark of profile.marks) {
        if (lower.includes(mark)) score += 3;
      }
    }
    for (const word of profile.words) {
      if (words.has(word)) score += 1;
    }
    // Ties go to the earlier profile, which is why the list leads with the
    // languages a browser is most likely to meet.
    if (score > bestScore) { bestScore = score; bestCode = profile.code; }
  }

  return bestCode;
}
