import { decodeEntities, escapeText } from './entities';
import { httpError, networkError, parseError } from './errors';
import { toEngineLang, toEngineSourceLang } from './langCodes';
import type { MtEngine, MtRequest } from './types';

/**
 * Google's translate-pa endpoint — the one the Chrome/web "translate this page"
 * libraries call. The key below is the public library key baked into those
 * clients, not a user credential; `application/json+protobuf` is genuinely the
 * content type it expects, with the body being positional JSON rather than an
 * object.
 *
 * Body:     [[[text, …], sourceLang, targetLang], client]
 * Response: [[translated, …]]
 */
const ENDPOINT = 'https://translate-pa.googleapis.com/v1/translateHtml';
const API_KEY = 'AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520';
const CLIENT = 'wt_lib';

async function translate(req: MtRequest): Promise<string[]> {
  if (req.texts.length === 0) return [];

  const from = toEngineSourceLang('google', req.sourceLang);
  const to = toEngineLang('google', req.targetLang);
  const body = JSON.stringify([[req.texts.map(escapeText), from, to], CLIENT]);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json+protobuf',
        'X-Goog-API-Key': API_KEY,
      },
      body,
      ...(req.signal && { signal: req.signal }),
    });
  } catch (e) {
    throw networkError(e, 'Google');
  }

  if (!response.ok) throw httpError(response.status, 'Google');

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw parseError('Google');
  }

  const translations = Array.isArray(json) ? json[0] : undefined;
  if (!Array.isArray(translations) || translations.length !== req.texts.length) {
    throw parseError('Google');
  }

  return translations.map((text, i) =>
    typeof text === 'string' ? decodeEntities(text) : req.texts[i]!,
  );
}

export const googleEngine: MtEngine = {
  id: 'google',
  label: 'Google Translate',
  shortLabel: 'Google',
  maxBatchSize: 20,
  maxBatchChars: 4000,
  translate,
};
