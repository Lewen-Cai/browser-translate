import { describe, it, expect } from 'vitest';
import { attachSpeakers, splitSpeaker } from './speaker';
import type { Cue } from './types';

function cue(id: number, text: string, speaker?: string): Cue {
  return { id, startMs: id * 1000, endMs: id * 1000 + 900, text, ...(speaker && { speaker }) };
}

describe('splitSpeaker', () => {
  it('takes a name off the front of a line', () => {
    expect(splitSpeaker('Ana Ruiz: So, you can search.')).toEqual({
      speaker: 'Ana Ruiz',
      text: 'So, you can search.',
    });
  });

  it('handles a full-width colon, which a CJK transcript uses', () => {
    expect(splitSpeaker('张伟： 我们开始吧')).toEqual({ speaker: '张伟', text: '我们开始吧' });
  });

  it('leaves a clause that merely ends in a colon alone', () => {
    expect(splitSpeaker('So here is the thing, everyone: we are late')).toEqual({
      text: 'So here is the thing, everyone: we are late',
    });
    expect(splitSpeaker('The agenda is as follows: three items')).toEqual({
      text: 'The agenda is as follows: three items',
    });
  });

  it('leaves a timestamp or a numbered marker alone', () => {
    expect(splitSpeaker('12: 30 is when we start')).toEqual({ text: '12: 30 is when we start' });
  });

  it('leaves a line with nothing after the colon alone', () => {
    expect(splitSpeaker('Ana Ruiz: ')).toEqual({ text: 'Ana Ruiz: ' });
  });

  it('leaves a line with no colon at all alone', () => {
    expect(splitSpeaker('So, you can search.')).toEqual({ text: 'So, you can search.' });
  });
});

describe('attachSpeakers', () => {
  it('splits a label that comes back, because a person says more than one thing', () => {
    const out = attachSpeakers([
      cue(0, 'Ana Ruiz: So, you can search.'),
      cue(1, 'Ana Ruiz: And then filter.'),
    ]);
    expect(out.map((c) => [c.speaker, c.text])).toEqual([
      ['Ana Ruiz', 'So, you can search.'],
      ['Ana Ruiz', 'And then filter.'],
    ]);
  });

  it('leaves a one-off label in the text, where it is probably a sentence', () => {
    // "Chapter 3: the basics" in a lecture transcript is not somebody talking.
    const out = attachSpeakers([
      cue(0, 'Chapter 3: the basics'),
      cue(1, 'We begin with automata.'),
    ]);
    expect(out[0]!.speaker).toBeUndefined();
    expect(out[0]!.text).toBe('Chapter 3: the basics');
  });

  it('keeps several speakers apart in the same transcript', () => {
    const out = attachSpeakers([
      cue(0, 'Ana: Hello.'),
      cue(1, 'Ben: Hello back.'),
      cue(2, 'Ana: Shall we start?'),
      cue(3, 'Ben: Yes.'),
    ]);
    expect(out.map((c) => c.speaker)).toEqual(['Ana', 'Ben', 'Ana', 'Ben']);
    expect(out.map((c) => c.text)).toEqual(['Hello.', 'Hello back.', 'Shall we start?', 'Yes.']);
  });

  it('leaves a cue that was already told who is speaking', () => {
    // WebVTT's <v Name> is explicit and needs none of the guesswork.
    const out = attachSpeakers([cue(0, 'Hello: everyone', 'Ana'), cue(1, 'Hi: there', 'Ana')]);
    expect(out[0]).toEqual(cue(0, 'Hello: everyone', 'Ana'));
  });

  it('returns the same cues untouched when nothing is labelled', () => {
    const input = [cue(0, 'Just words.'), cue(1, 'More words.')];
    expect(attachSpeakers(input)).toEqual(input);
  });

  it('keeps the ids, which the translator addresses cues by', () => {
    const out = attachSpeakers([cue(0, 'Ana: One.'), cue(1, 'Ana: Two.')]);
    expect(out.map((c) => c.id)).toEqual([0, 1]);
  });
});
