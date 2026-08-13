import { Languages } from '~/ui/icons';

interface Props {
  /** Bounding rect of the selection. Icon hangs at its top-right corner. */
  rect: DOMRect;
  onClick: () => void;
}

export const ICON_SIZE = 22;
const GAP = 4;

/**
 * Computes where the icon should sit relative to a selection rect.
 * Exported so the TranslationCard can anchor its open animation here.
 */
export function computeIconPosition(rect: DOMRect): { top: number; left: number } {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Default: hang the icon ABOVE the selection's top-right corner.
  let top = rect.top + scrollY - ICON_SIZE - GAP;
  let left = rect.right + scrollX - ICON_SIZE;

  // If that would clip the icon above the viewport, drop it to the
  // right-of-top-right instead.
  if (top < scrollY + 2) {
    top = rect.top + scrollY;
    left = rect.right + scrollX + GAP;
  }

  // Keep within viewport horizontally.
  const maxLeft = scrollX + window.innerWidth - ICON_SIZE - 4;
  if (left > maxLeft) left = maxLeft;
  if (left < scrollX + 2) left = scrollX + 2;

  return { top, left };
}

export function TriggerIcon({ rect, onClick }: Props) {
  const { top, left } = computeIconPosition(rect);

  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()} // don't blur the selection
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${ICON_SIZE}px`,
        height: `${ICON_SIZE}px`,
        borderRadius: '5px',
        // Theme tokens — the shadow container carries the active theme's vars.
        background: 'rgb(var(--ap-brand))',
        color: 'rgb(var(--ap-brand-fg))',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
      title="Translate (BrowserTranslate)"
    >
      <Languages size={13} />
    </button>
  );
}
