/**
 * Put text on the clipboard from a content script.
 *
 * The async Clipboard API is the right one and is what runs nearly everywhere,
 * but a page may forbid it outright through a Permissions-Policy header, and it
 * throws when the document is not focused. We are a guest on someone else's
 * page and get no say in either, so a copy button that simply fails on those
 * pages is not good enough; the old selection-and-execCommand trick still works
 * there because it is the document's own copy, not ours.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Blocked or unfocused — fall through to the legacy path.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    // Off-screen but focusable: display:none or visibility:hidden would make the
    // selection empty and the copy a no-op. `fixed` keeps it from scrolling the
    // page when it takes focus.
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
