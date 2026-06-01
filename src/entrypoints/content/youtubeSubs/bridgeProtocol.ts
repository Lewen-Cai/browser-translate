export const BT_REQ = 'bt-yt-captions-request';
export const BT_RES = 'bt-yt-captions-response';
export const BT_FETCH_REQ = 'bt-yt-transcript-request';
export const BT_FETCH_RES = 'bt-yt-transcript-response';

export interface CaptionTrack {
  baseUrl: string;
  languageCode: string; // e.g. 'en'
  kind?: string;        // 'asr' for auto-generated
  name?: string;        // display name
  vssId?: string;       // YouTube track id, e.g. '.en' or 'a.en' — used to match the active track
}

export interface CaptionsResponse {
  source: typeof BT_RES;
  isLive: boolean;
  tracks: CaptionTrack[];
  activeVssId?: string;        // vssId of the caption track the user currently has displayed
  activeLanguageCode?: string; // languageCode of the active track
}

/** Ask the MAIN-world bridge for the captured (pot-bearing) transcript of a language. */
export interface TranscriptRequest {
  source: typeof BT_FETCH_REQ;
  id: string;
  lang: string;
}

export interface TranscriptResponse {
  source: typeof BT_FETCH_RES;
  id: string;
  body: string;
  error?: string;
}
