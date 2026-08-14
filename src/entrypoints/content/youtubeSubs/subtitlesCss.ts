/**
 * Styles for the in-player shadow root. Self-contained by definition: nothing
 * here can be reached by YouTube's stylesheets and nothing here escapes onto
 * the page.
 *
 * The overlay is always dark. It sits on top of arbitrary video, not on our own
 * surfaces, so it does not follow the extension's light/dark setting.
 */
export const SUBTITLES_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }

/* Sized to the player and given a font size derived from its height, so every
   length inside can be expressed in em and scale with the picture — including
   in fullscreen, which is just a much larger player. */
.window {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  /* Han characters are shared between these languages but drawn differently in
     each, so the serif stack follows the language of the text rather than
     trying to serve all three. The block carries the target language in its
     lang attribute; the generic 'serif' at the end is resolved per language by
     the browser from that same attribute, so a reader with none of these
     installed still gets a mincho for Japanese rather than a Chinese face.
     Keep in sync with theme.css, which does the same for the extension's UI. */
  --bt-cjk-serif: 'Source Han Serif SC', 'Noto Serif CJK SC', 'Noto Serif SC', serif;
  font-family: "YouTube Noto", Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana,
    "PT Sans Caption", sans-serif;
}

.window[lang='zh-TW'] {
  --bt-cjk-serif: 'Source Han Serif TC', 'Noto Serif CJK TC', 'Noto Serif TC', serif;
}
.window[lang='ja'] {
  --bt-cjk-serif: 'Source Han Serif', 'Noto Serif CJK JP', 'Noto Serif JP', serif;
}
.window[lang='ko'] {
  --bt-cjk-serif: 'Source Han Serif K', 'Noto Serif CJK KR', 'Noto Serif KR', serif;
}

.group {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.group[data-dragging="false"] { transition: top 200ms ease, bottom 200ms ease; }
.group[data-hidden="true"] { visibility: hidden; }

/* The grip is the only part of the block that takes pointer events. Everything
   else stays transparent to them so clicking the picture plays and pauses the
   video exactly as it does anywhere else on YouTube. */
.grip {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2em;
  height: 1.15em;
  margin-bottom: 0.18em;
  border-radius: 0.3em;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity 200ms ease;
}
.group:hover .grip, .grip[data-dragging="true"] { opacity: 1; }
.grip[data-dragging="true"] { cursor: grabbing; }
/* The same white bar the translation card uses, so the one gesture looks the
   same wherever it appears. The dark pill behind it is the difference: the card
   has its own surface to sit on, this is over arbitrary video. */
.grip-bar {
  width: 1.3em;
  height: max(2px, 0.14em);
  border-radius: 999px;
  background: #fff;
}

.plate {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
  max-width: 90%;
  padding: 0.3em 0.55em;
  border-radius: 0.35em;
  text-align: center;
  color: #fff;
}
.line {
  line-height: 1.28;
  white-space: pre-wrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}
.line[data-empty="true"] { display: none; }
.line[data-placeholder="true"] { opacity: 0.66; }
/* Between cues the plate goes invisible rather than away, so the grip keeps the
   spot the viewer dragged it to instead of dropping to the empty group's edge. */
.plate[data-empty="true"] { visibility: hidden; }

/* ---- settings panel ---- */

.panel {
  position: absolute;
  right: 1.1em;
  width: 19em;
  max-width: calc(100% - 2em);
  max-height: 70%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  border-radius: 1.1em;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(18, 18, 20, 0.94);
  backdrop-filter: blur(18px);
  color: #fff;
  font-size: 13px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform: translateY(0.5em);
  transition: opacity 180ms ease, transform 180ms ease;
}
.panel[data-open="true"] { opacity: 1; transform: translateY(0); }
.panel[data-open="false"] { visibility: hidden; }

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
  flex: none;
}
/* The scroll track runs the full height of this element, and the panel's own
   rounded corners clip whatever reaches them — so the track has to stop short
   of the bottom rather than run into the curve. The margin does that; the
   transparent border keeps the thumb off the right-hand edge for the same
   reason. */
.panel-body {
  overflow-y: auto;
  padding: 8px;
  margin-bottom: 10px;
  min-height: 0;
}
.panel-body::-webkit-scrollbar { width: 10px; }
.panel-body::-webkit-scrollbar-track { background: transparent; }
.panel-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.panel-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.34); background-clip: content-box; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.menu-item:hover { background: rgba(255, 255, 255, 0.08); }
.menu-item .label { flex: 1; min-width: 0; }
.menu-item .icon { display: flex; opacity: 0.72; flex: none; }
.menu-item .icon svg { width: 16px; height: 16px; display: block; }

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex: none;
}
.icon-button:hover { background: rgba(255, 255, 255, 0.12); }
.icon-button svg { width: 15px; height: 15px; display: block; }

.group-block { margin-bottom: 14px; }
.group-block:last-child { margin-bottom: 4px; }
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  opacity: 0.95;
}
.group-title svg { width: 14px; height: 14px; display: block; opacity: 0.7; }
.rows {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.045);
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
}
.row + .row { border-top: 1px solid rgba(255, 255, 255, 0.075); }
.row .name { opacity: 0.9; }

.row select {
  min-width: 6.5em;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font: inherit;
  cursor: pointer;
}
.row select option { background: #1a1a1c; color: #fff; }

.row input[type="color"] {
  width: 30px;
  height: 24px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
.row input[type="color"]::-webkit-color-swatch-wrapper { padding: 2px; }
.row input[type="color"]::-webkit-color-swatch { border: none; border-radius: 999px; }

.slider-row { flex-direction: column; align-items: stretch; gap: 4px; }
.slider-head { display: flex; align-items: center; justify-content: space-between; }
.slider-head .value { font-variant-numeric: tabular-nums; opacity: 0.75; }
.row input[type="range"] {
  width: 100%;
  height: 4px;
  margin: 4px 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  appearance: none;
  cursor: pointer;
}
.row input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
}

/* A switch, so the on/off state reads at a glance from across the room. */
.switch {
  position: relative;
  width: 36px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  cursor: pointer;
  padding: 0;
  flex: none;
  transition: background 160ms ease;
}
.switch[aria-checked="true"] { background: #3ea6ff; }
.switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 160ms ease;
}
.switch[aria-checked="true"]::after { transform: translateX(16px); }
`;
