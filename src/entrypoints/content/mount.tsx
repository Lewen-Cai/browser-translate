import { render, type ComponentChild } from 'preact';
import themeCss from '~/ui/theme.css?inline';

const HOST_ID = 'browsertranslate-host';

export interface MountedShadow {
  root: ShadowRoot;
  unmount: () => void;
  render: (node: ComponentChild) => void;
  setDark: (isDark: boolean) => void;
  setLang: (lang: string) => void;
}

export function createShadowMount(): MountedShadow {
  let host = document.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    // position:absolute (not fixed) anchors the host to the document origin so it
    // scrolls with the page — matching the document-space coordinates that
    // computeIconPosition / TranslationCard produce (they add scrollX/scrollY).
    // With fixed, a scrolled page renders the icon/card scrollY px off-screen.
    host.style.cssText = 'all:initial;position:absolute;top:0;left:0;z-index:2147483647;';
    document.documentElement.appendChild(host);
  }
  let root = host.shadowRoot;
  if (!root) {
    root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = themeCss;
    root.appendChild(style);
    const container = document.createElement('div');
    container.id = 'bt-root';
    root.appendChild(container);
  }
  const container = root.querySelector('#bt-root') as HTMLElement;
  return {
    root,
    unmount: () => render(null, container),
    render: (node: ComponentChild) => render(node, container),
    // The shadow root has its own copy of the stylesheet, so the dark palette
    // has to be switched on inside it rather than inherited from <html>.
    setDark: (isDark: boolean) => container.classList.toggle('dark', isDark),
    // The CJK font stack is chosen from this, and the browser reads it to decide
    // what the generic families mean. Set inside the shadow root for the same
    // reason as the palette: <html lang> does not reach in here.
    setLang: (lang: string) => container.setAttribute('lang', lang),
  };
}
