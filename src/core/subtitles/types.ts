export interface Cue {
  id: number; // stable index into the parsed list
  startMs: number;
  endMs: number;
  text: string;
}
