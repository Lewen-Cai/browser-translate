import { isMonoModelIcon, modelIconName } from '~/core/providers/modelIcon';

/**
 * Where an icon file is served from. The icons ship as files rather than being
 * inlined into each script: there are about a hundred, and the content script —
 * injected into every page — would otherwise carry all of them.
 */
function iconUrl(icon: string): string {
  const path = `model-icons/${icon}.svg`;
  return typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL(path) : `/${path}`;
}

/**
 * One of LobeHub's vendor icons, by name. A single-colour icon is painted as a
 * mask in the current text colour, so it follows the theme the way the inline
 * monochrome brand marks do; a colour icon keeps its own colours.
 *
 * Inline styles only, so it renders the same inside the card's shadow root.
 */
export function LobeIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const box = { width: `${size}px`, height: `${size}px`, flex: 'none', display: 'inline-block' };
  if (isMonoModelIcon(icon)) {
    const mask = `url("${iconUrl(icon)}") center / contain no-repeat`;
    return (
      <span
        aria-hidden="true"
        style={{ ...box, backgroundColor: 'currentColor', mask, WebkitMask: mask }}
      />
    );
  }
  return <img src={iconUrl(icon)} alt="" aria-hidden="true" width={size} height={size} style={box} />;
}

/**
 * The vendor icon for a model id, or an empty square of the same size when the
 * id names none — so a list of models stays aligned either way.
 */
export function ModelIcon({ model, size = 14 }: { model: string; size?: number }) {
  const icon = modelIconName(model);
  if (!icon) return <span aria-hidden="true" style={{ width: `${size}px`, height: `${size}px`, flex: 'none', display: 'inline-block' }} />;
  return <LobeIcon icon={icon} size={size} />;
}
