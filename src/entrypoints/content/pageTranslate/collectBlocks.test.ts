import { describe, it, expect, beforeEach } from 'vitest';
import { collectBlocks } from './collectBlocks';

function collect(html: string) {
  document.body.innerHTML = html;
  return collectBlocks(document.body);
}

describe('collectBlocks', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('collects paragraph and heading blocks', () => {
    expect(collect('<h1>Title here friend</h1><p>This is a real sentence of text.</p>')
      .map((b) => b.tagName)).toEqual(['H1', 'P']);
  });

  it('skips script, style, code and pre', () => {
    expect(collect('<p>Translate this please now</p><pre>code()</pre><code>x=1</code><script>var a=1</script>')
      .map((b) => b.tagName)).toEqual(['P']);
  });

  it('skips editable controls', () => {
    expect(collect('<p>Real translatable text content</p><textarea>editable</textarea><div contenteditable="true"><p>edit me</p></div>')
      .map((b) => b.tagName)).toEqual(['P']);
  });

  it('skips whitespace-only and too-short blocks', () => {
    const blocks = collect('<p>   </p><p>ok</p><p>This one is long enough to translate.</p>');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.textContent).toContain('long enough');
  });

  it('collects all languages including mixed content rather than guessing what needs translation', () => {
    const blocks = collect('<p>这是一段已经是中文的内容文字</p><p>This is English content to translate.</p><p>这个段落 contains both languages。</p>');
    expect(blocks).toHaveLength(3);
  });

  it('does not double-count nested blocks', () => {
    expect(collect('<div><p>Inner paragraph text content here.</p></div>').map((b) => b.tagName)).toEqual(['P']);
  });

  it('collects an ancestor with direct text AND a nested block without dropping content', () => {
    const blocks = collect('<ul><li>Intro text before the nested list<ul><li>Nested item text here</li></ul></li></ul>');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.textContent).toContain('Intro text before');
  });

  it('skips a pure container block in favour of its inner block', () => {
    expect(collect('<blockquote><p>Quoted paragraph text content here.</p></blockquote>')
      .map((b) => b.tagName)).toEqual(['P']);
  });

  it('ignores already-injected bilingual nodes', () => {
    expect(collect('<p>Source paragraph text content here.</p><p class="bt-bilingual">译文内容</p>')
      .map((b) => b.className)).toEqual(['']);
  });

  it('scopes to the main landmark when present', () => {
    expect(collect('<p id="out">Outside main, should be skipped.</p><main><p id="in">Inside the main region.</p></main>')
      .map((b) => b.id)).toEqual(['in']);
  });

  it('skips page chrome when falling back to body', () => {
    expect(collect('<header><p>Header tagline text here.</p></header><nav><p>Nav links text here.</p></nav><div><p>Body content paragraph text.</p></div><footer><p>Footer text content here.</p></footer>')
      .map((b) => b.textContent)).toEqual(['Body content paragraph text.']);
  });

  it('skips chrome even inside the main landmark', () => {
    expect(collect('<main><nav><p>In-page TOC nav text.</p></nav><p>Real article body text here.</p></main>')
      .map((b) => b.textContent)).toEqual(['Real article body text here.']);
  });
});
