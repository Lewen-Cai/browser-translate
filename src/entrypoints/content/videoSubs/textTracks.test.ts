import { describe, it, expect } from 'vitest';
import { cuesFromTextTrack, pickTextTrack } from './textTracks';

/** jsdom ships no TextTrack implementation; these carry the fields we read. */
function cue(startTime: number, endTime: number, text: string) {
  return { startTime, endTime, text } as unknown as TextTrackCue;
}

function track(
  patch: { kind?: string; mode?: TextTrackMode; language?: string; cues?: TextTrackCue[] } = {},
): TextTrack {
  return {
    kind: patch.kind ?? 'subtitles',
    mode: patch.mode ?? 'disabled',
    language: patch.language ?? '',
    cues: (patch.cues ?? null) as unknown as TextTrackCueList | null,
  } as unknown as TextTrack;
}

function list(tracks: TextTrack[]): TextTrackList {
  return Object.assign([...tracks], { length: tracks.length }) as unknown as TextTrackList;
}

describe('pickTextTrack', () => {
  it('takes the track the reader already has showing', () => {
    const wanted = track({ language: 'de', mode: 'showing' });
    expect(pickTextTrack(list([track({ language: 'en' }), wanted]))).toBe(wanted);
  });

  it('otherwise takes the first spoken-word track, whatever its language', () => {
    // A page that ships one track ships the one it has; refusing it because it
    // is not in some preferred language would leave nothing to translate.
    const first = track({ language: 'sv' });
    expect(pickTextTrack(list([first, track({ language: 'en' })]))).toBe(first);
  });

  it('ignores tracks that are not speech', () => {
    const chapters = track({ kind: 'chapters', mode: 'showing' });
    const subs = track({ kind: 'captions' });
    expect(pickTextTrack(list([chapters, subs]))).toBe(subs);
    expect(pickTextTrack(list([chapters]))).toBeNull();
  });

  it('has nothing to pick from an empty or absent list', () => {
    expect(pickTextTrack(list([]))).toBeNull();
    expect(pickTextTrack(null)).toBeNull();
  });
});

describe('cuesFromTextTrack', () => {
  it('reads out the cues with their timings in milliseconds', async () => {
    const t = track({ cues: [cue(0, 1.5, 'Hello'), cue(1.5, 3.25, 'World')] });
    expect(await cuesFromTextTrack(t)).toEqual([
      { id: 0, startMs: 0, endMs: 1500, text: 'Hello' },
      { id: 1, startMs: 1500, endMs: 3250, text: 'World' },
    ]);
  });

  it('strips the markup WebVTT allows inside a cue', () => {
    // <v Speaker> and <i> are how the cue is drawn, not what is said, and a
    // model asked to translate them would carry them into the answer.
    const t = track({ cues: [cue(0, 1, '<v Ana>Hello <i>there</i></v>')] });
    return expect(cuesFromTextTrack(t)).resolves.toEqual([
      { id: 0, startMs: 0, endMs: 1000, text: 'Hello there' },
    ]);
  });

  it('drops cues with no words in them', async () => {
    const t = track({ cues: [cue(0, 1, '   '), cue(1, 2, 'Real')] });
    const cues = await cuesFromTextTrack(t);
    expect(cues).toHaveLength(1);
    expect(cues[0]!.text).toBe('Real');
  });

  it('wakes a disabled track so the browser loads its cues', async () => {
    // A disabled track never loads, so reading one without this returns nothing
    // on a page whose captions the reader has not switched on.
    const t = track({ mode: 'disabled', cues: [cue(0, 1, 'Hi')] });
    await cuesFromTextTrack(t);
    expect(t.mode).toBe('hidden');
  });

  it('leaves a track the reader had showing showing', async () => {
    const t = track({ mode: 'showing', cues: [cue(0, 1, 'Hi')] });
    await cuesFromTextTrack(t);
    expect(t.mode).toBe('showing');
  });

  it('gives up rather than hanging when the cues never arrive', async () => {
    expect(await cuesFromTextTrack(track({ cues: [] }), 0)).toEqual([]);
  });
});
