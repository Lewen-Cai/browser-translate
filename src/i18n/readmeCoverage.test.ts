import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES, LOCALE_LABELS } from './localeInfo';
import { MESSAGES } from './strings';

// pnpm/Vitest run from the repository root; Vite may rewrite import.meta.url
// to an HTTP URL in jsdom, so do not treat it as a filesystem URL here.
const root = process.cwd();
// English stays at the repository root, which is the only place GitHub reads a
// landing page from. Every other language lives in readmes/, under its own
// locale code.
const pathFor = (locale: string) => locale === 'en' ? 'README.md' : `readmes/${locale}.md`;
const others = LOCALES.filter((l) => l !== 'en');

/** Where a language chip should point, from the document doing the pointing. */
const navTarget = (from: string, to: string) => {
  if (to === 'en') return from === 'en' ? './README.md' : '../README.md';
  return from === 'en' ? `./readmes/${to}.md` : `./${to}.md`;
};
const sections = [
  'why', 'features', 'subtitles', 'languages', 'architecture', 'installation',
  'configuration', 'prompts', 'validation', 'free-engines', 'privacy',
  'development', 'acknowledgements', 'license',
];
const commands = ['pnpm install', 'pnpm dev', 'pnpm test', 'pnpm test:run', 'pnpm typecheck', 'pnpm lint', 'pnpm build'];

/** Check spelling/case even on Windows, where existsSync alone is case-insensitive. */
function existsWithExactCase(relative: string): boolean {
  let current = root;
  for (const part of relative.replace(/^\.\//, '').split('/')) {
    if (!part || part === '.' || part === '..' || !existsSync(current)) return false;
    if (!readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return existsSync(current);
}

describe('localized README coverage', () => {
  it('keeps English at the root and every other language in readmes/', () => {
    expect(readdirSync(root).filter((name) => /^README.*\.md$/.test(name))).toEqual(['README.md']);
    expect(readdirSync(path.join(root, 'readmes')).filter((name) => name.endsWith('.md')).sort())
      .toEqual([...others].sort().map((l) => `${l}.md`));
    expect(readdirSync(root)).not.toContain('README_CN.md');
  });

  for (const locale of LOCALES) {
    describe(locale, () => {
      const content = readFileSync(path.join(root, pathFor(locale)), 'utf8');
      const headerText = content.slice(0, content.indexOf('<a id="why">'));
      const header = document.createElement('div');
      header.innerHTML = headerText;

      it('centers the hero and links every language exactly once, marking itself', () => {
        expect(header.querySelector('h1[align="center"]')?.textContent).toBe('BrowserTranslate');
        const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('a')).filter((a) => a.querySelector('kbd'));
        const hrefs = links.map((a) => a.getAttribute('href'));
        expect(hrefs.sort()).toEqual(LOCALES.map((l) => navTarget(locale, l)).sort());
        const current = header.querySelector('kbd > b');
        expect(current?.textContent).toBe(LOCALE_LABELS[locale]);
        expect(current?.closest('a')?.getAttribute('href')).toBe(navTarget(locale, locale));
        for (const link of links) expect(link.closest('p')?.getAttribute('align')).toBe('center');
        for (const image of header.querySelectorAll('img')) expect(image.getAttribute('alt')?.trim()).toBeTruthy();
      });

      it('contains the full section structure and the same product limits', () => {
        const ids = [...content.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
        expect(ids).toEqual(sections);
        const body = content.slice(headerText.length);
        expect(body.length).toBeGreaterThan(3500);
        // "todo" is ordinary Portuguese/Spanish, not necessarily a TODO marker.
        expect(content).not.toMatch(/<!--\s*TODO\b|\bTODO:/);
        expect(body).toContain('56');
        expect(body).toContain('14');
        expect(body).toContain('20');
        expect(body).toMatch(/12[,.\s]?000/);
        for (const value of ['Alt+T', 'Alt+A', '{{...}}', 'chrome.storage.local', 'edge.microsoft.com', 'translate-pa.googleapis.com', 'GPL-3.0']) {
          expect(body, value).toContain(value);
        }
        for (const command of commands) expect(body).toContain(command);
        for (const key of ['subtitleGeneral', 'sectionTranslation', 'sectionProviders', 'sectionSubtitles', 'sectionData'] as const) {
          expect(body, `settings label: ${key}`).toContain(MESSAGES[locale][key]);
        }
      });

      it('uses valid local links, images and stable fragment targets', () => {
        const links = [
          ...[...content.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]!),
          ...[...content.matchAll(/\]\(([^\s)]+)\)/g)].map((m) => m[1]!),
        ];
        // Relative links resolve against the document's own directory, which is
        // `readmes/` for every language but English.
        const dir = path.posix.dirname(pathFor(locale));
        for (const link of links) {
          if (/^https:\/\//.test(link)) continue;
          if (link.startsWith('#')) {
            expect(sections, link).toContain(link.slice(1));
          } else {
            const target = path.posix.normalize(path.posix.join(dir, link));
            expect(existsWithExactCase(target), `${pathFor(locale)} -> ${link}`).toBe(true);
          }
        }
        expect(content).not.toContain('README_CN.md');
        expect(content).toContain(`${locale === 'en' ? '.' : '..'}/assets/banner.png`);
        expect(content).toContain(`${locale === 'en' ? '.' : '..'}/assets/framework.png`);
      });
    });
  }
});
