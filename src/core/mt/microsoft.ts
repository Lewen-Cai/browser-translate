import { decodeEntities, escapeText } from './entities';
import { httpError, networkError, parseError } from './errors';
import { toEngineLang, toEngineSourceLang } from './langCodes';
import type { MtEngine, MtRequest } from './types';

/**
 * Microsoft's unauthenticated translate endpoint — the same one Edge's built-in
 * page translation uses. No key, no token: the older flow that traded a signature
 * for a JWT against edge.microsoft.com/translate/auth was retired upstream.
 *
 * The request body is a bare JSON array of strings (the classic Azure
 * `[{ Text }]` shape is rejected here) and the response keeps the Azure
 * envelope, one entry per input, in order.
 */
const ENDPOINT = 'https://edge.microsoft.com/translate/translatetext';

interface MsTranslation { text?: unknown }
interface MsResult { translations?: MsTranslation[] }

async function translate(req: MtRequest): Promise<string[]> {
  if (req.texts.length === 0) return [];

  const from = toEngineSourceLang('microsoft', req.sourceLang);
  const to = toEngineLang('microsoft', req.targetLang);
  const url =
    `${ENDPOINT}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` +
    '&isEnterpriseClient=false';

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.texts.map(escapeText)),
      ...(req.signal && { signal: req.signal }),
    });
  } catch (e) {
    throw networkError(e, 'Microsoft');
  }

  if (!response.ok) throw httpError(response.status, 'Microsoft');

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw parseError('Microsoft');
  }

  if (!Array.isArray(json) || json.length !== req.texts.length) throw parseError('Microsoft');

  return (json as MsResult[]).map((item, i) => {
    const text = item?.translations?.[0]?.text;
    // An empty result for one entry shouldn't lose the whole batch — fall back
    // to the source so the caller still gets an aligned array.
    return typeof text === 'string' ? decodeEntities(text) : req.texts[i]!;
  });
}

export const microsoftEngine: MtEngine = {
  id: 'microsoft',
  label: 'Microsoft Translator',
  maxBatchSize: 20,
  maxBatchChars: 4000,
  translate,
};
