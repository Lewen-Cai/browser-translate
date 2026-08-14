import { describe, it, expect } from 'vitest';
import { parseVtt } from './parseVtt';

const SAMPLE = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Good morning everyone.

2
00:00:02.500 --> 00:00:06.000
Today we are looking at
finite automata.
`;

describe('parseVtt', () => {
  it('reads cues with their timings in milliseconds', () => {
    expect(parseVtt(SAMPLE)).toEqual([
      { id: 0, startMs: 0, endMs: 2500, text: 'Good morning everyone.' },
      { id: 1, startMs: 2500, endMs: 6000, text: 'Today we are looking at finite automata.' },
    ]);
  });

  it('skips the header and the blocks that are not cues', () => {
    const withNotes = `WEBVTT - Recording transcript

NOTE This file was produced automatically.

STYLE
::cue { color: yellow }

00:00:01.000 --> 00:00:02.000
Only this is speech.
`;
    const cues = parseVtt(withNotes);
    expect(cues).toHaveLength(1);
    expect(cues[0]!.text).toBe('Only this is speech.');
  });

  it('accepts a timestamp with no hour, which WebVTT allows', () => {
    const cues = parseVtt('WEBVTT\n\n01:02.250 --> 01:04.000\nShort form.\n');
    expect(cues[0]).toMatchObject({ startMs: 62250, endMs: 64000 });
  });

  it('parses a file with Windows line endings the same way', () => {
    // The `.` in a JS regex does not match `\r`, so a file served with CRLF
    // parses to nothing at all unless the endings are normalised first.
    expect(parseVtt(SAMPLE.replace(/\n/g, '\r\n'))).toEqual(parseVtt(SAMPLE));
  });

  it('drops the markup a cue is drawn with, keeping only what was said', () => {
    const cues = parseVtt('WEBVTT\n\n00:00.000 --> 00:01.000\n<v Ana>Hello <i>there</i></v>\n');
    expect(cues[0]!.text).toBe('Hello there');
  });

  it('ignores a cue identifier without mistaking it for speech', () => {
    const cues = parseVtt('WEBVTT\n\nintro-line\n00:00.000 --> 00:01.000\nWords.\n');
    expect(cues[0]!.text).toBe('Words.');
  });

  it('has nothing to return for an empty or unparseable file', () => {
    expect(parseVtt('')).toEqual([]);
    expect(parseVtt('WEBVTT\n\n')).toEqual([]);
    expect(parseVtt('<html><body>Sign in</body></html>')).toEqual([]);
  });

  it('drops a cue with a timing but no words under it', () => {
    const cues = parseVtt('WEBVTT\n\n00:00.000 --> 00:01.000\n\n00:01.000 --> 00:02.000\nReal.\n');
    expect(cues).toHaveLength(1);
    expect(cues[0]!.text).toBe('Real.');
  });

  it('numbers cues by their own order, not by the file’s labels', () => {
    // The id is an index the translator uses to address a cue; a file whose
    // identifiers are names, or are numbered from something other than one,
    // must not shift it.
    const cues = parseVtt('WEBVTT\n\n7\n00:00.000 --> 00:01.000\nA\n\nnamed\n00:01.000 --> 00:02.000\nB\n');
    expect(cues.map((c) => c.id)).toEqual([0, 1]);
  });
});

describe('parseVtt speakers', () => {
  it('takes the name from a <v> span, which says it outright', () => {
    const cues = parseVtt('WEBVTT\n\n00:00.000 --> 00:01.000\n<v Ana>Hello there</v>\n');
    expect(cues[0]).toMatchObject({ speaker: 'Ana', text: 'Hello there' });
  });

  it('takes a plain "Name:" label once it has seen it twice', () => {
    // A meeting recorder writes every line this way, and translating the name
    // gives a different rendering of it every few seconds.
    const cues = parseVtt(
      'WEBVTT\n\n00:00.000 --> 00:01.000\nAna Ruiz: So, you can search.\n' +
      '\n00:01.000 --> 00:02.000\nAna Ruiz: And then filter.\n',
    );
    expect(cues.map((c) => [c.speaker, c.text])).toEqual([
      ['Ana Ruiz', 'So, you can search.'],
      ['Ana Ruiz', 'And then filter.'],
    ]);
  });

  it('leaves a colon that is part of a sentence where it is', () => {
    const cues = parseVtt('WEBVTT\n\n00:00.000 --> 00:01.000\nThe agenda is: three items\n');
    expect(cues[0]!.speaker).toBeUndefined();
    expect(cues[0]!.text).toBe('The agenda is: three items');
  });
});
