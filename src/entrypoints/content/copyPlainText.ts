/**
 * Copying out of the card should yield the words, not the card.
 *
 * When text is copied from a page, Chrome writes two flavours: the plain text
 * and an HTML fragment carrying the computed style of what was selected. Our
 * card paints its own background — near-black under the dark palette — and that
 * background travels in the HTML flavour. Paste into a document and the words
 * arrive in a black box, which is our furniture appearing in someone else's
 * file.
 *
 * The card's styling is chrome, not content: nothing in it is worth carrying
 * into a document. So a copy that starts inside our shadow tree is answered
 * with the text alone.
 *
 * This is only for a copy the reader makes by hand. The card's own copy button
 * goes through `navigator.clipboard.writeText`, which was never able to write
 * anything but text.
 */

/** The shape we need from a copy event, so this stays testable without one. */
export interface CopyEventLike {
  clipboardData: { setData(format: string, data: string): void } | null;
  preventDefault(): void;
}

/**
 * Read what is selected inside a shadow tree.
 *
 * `ShadowRoot.getSelection` is Chromium's, and this extension is Chromium-only;
 * the document-level selection is the fallback, and returns the same text there
 * in current Chrome. Either can come back empty — a copy fired with nothing
 * selected, or a selection the engine will not report across the boundary — and
 * an empty answer has to stay empty rather than becoming an empty clipboard.
 */
export function shadowSelectionText(root: ShadowRoot): string {
  const withSelection = root as ShadowRoot & { getSelection?: () => Selection | null };
  const selection = withSelection.getSelection?.() ?? document.getSelection();
  return selection?.toString() ?? '';
}

/**
 * Build the copy handler. Takes the reader rather than the root so a test can
 * say what is selected without a live shadow tree.
 */
export function plainTextCopyHandler(readSelection: () => string) {
  return (event: CopyEventLike): void => {
    const text = readSelection();
    // Nothing readable to put back. Overriding here would replace a copy that
    // would have worked with an empty clipboard, which is worse than a black
    // background.
    if (!text || !event.clipboardData) return;
    event.clipboardData.setData('text/plain', text);
    // Required: without it the browser's own two flavours overwrite ours.
    event.preventDefault();
  };
}
