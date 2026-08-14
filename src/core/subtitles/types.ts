export interface Cue {
  id: number; // stable index into the parsed list
  startMs: number;
  endMs: number;
  /** What was said, with any speaker label taken off — see `speaker.ts`. */
  text: string;
  /**
   * Who said it, where the transcript says. Kept apart from the text so it is
   * never translated: a model renders a transliterated name differently almost
   * every time, and the same person arriving under a new name every few seconds
   * reads as a fault.
   */
  speaker?: string;
}
