import { describe, it, expect, vi } from 'vitest';
import { plainTextCopyHandler, shadowSelectionText, type CopyEventLike } from './copyPlainText';

function event() {
  const setData = vi.fn<(format: string, data: string) => void>();
  const preventDefault = vi.fn<() => void>();
  const e: CopyEventLike = { clipboardData: { setData }, preventDefault };
  return { e, setData, preventDefault };
}

describe('plainTextCopyHandler', () => {
  it('writes the selection as text and nothing else', () => {
    const { e, setData } = event();
    plainTextCopyHandler(() => 'the translation')(e);
    expect(setData).toHaveBeenCalledTimes(1);
    expect(setData).toHaveBeenCalledWith('text/plain', 'the translation');
  });

  it('never writes an HTML flavour, which is what carried the background', () => {
    const { e, setData } = event();
    plainTextCopyHandler(() => 'x')(e);
    expect(setData.mock.calls.map((c) => c[0])).not.toContain('text/html');
  });

  it("cancels the default, or the browser's own flavours overwrite ours", () => {
    const { e, preventDefault } = event();
    plainTextCopyHandler(() => 'x')(e);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('stands aside when it cannot read a selection', () => {
    // Replacing a copy that would have worked with an empty clipboard is worse
    // than the problem being fixed.
    const { e, setData, preventDefault } = event();
    plainTextCopyHandler(() => '')(e);
    expect(setData).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('stands aside when the event carries no clipboard at all', () => {
    const preventDefault = vi.fn<() => void>();
    plainTextCopyHandler(() => 'x')({ clipboardData: null, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('keeps the line structure a multi-line answer was read in', () => {
    const { e, setData } = event();
    plainTextCopyHandler(() => 'first line\nsecond line')(e);
    expect(setData).toHaveBeenCalledWith('text/plain', 'first line\nsecond line');
  });
});

describe('shadowSelectionText', () => {
  it("prefers the shadow tree's own selection", () => {
    const root = {
      getSelection: () => ({ toString: () => 'inside the card' }) as unknown as Selection,
    } as unknown as ShadowRoot;
    expect(shadowSelectionText(root)).toBe('inside the card');
  });

  it('falls back to the document where the shadow root offers none', () => {
    const spy = vi
      .spyOn(document, 'getSelection')
      .mockReturnValue({ toString: () => 'from the document' } as unknown as Selection);
    expect(shadowSelectionText({} as ShadowRoot)).toBe('from the document');
    spy.mockRestore();
  });

  it('answers with an empty string rather than null when nothing is selected', () => {
    const spy = vi.spyOn(document, 'getSelection').mockReturnValue(null);
    expect(shadowSelectionText({} as ShadowRoot)).toBe('');
    spy.mockRestore();
  });
});
