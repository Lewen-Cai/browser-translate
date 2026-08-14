import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  srcDir: 'src',
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'activeTab', 'contextMenus', 'alarms'],
    // The free translation engines. Most model endpoints stay permission-free:
    // they are chosen at runtime and send CORS headers that let a browser talk
    // to them directly.
    host_permissions: [
      'https://edge.microsoft.com/*',
      'https://translate-pa.googleapis.com/*',
    ],
    // opencode's endpoint sends no CORS headers at all, so no request header can
    // opt in and a host grant is the only way through. Optional rather than
    // required, and asked for when that provider is switched on, so nobody who
    // never uses it is prompted.
    optional_host_permissions: ['https://opencode.ai/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'BrowserTranslate',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
      },
    },
    commands: {
      'translate-selection': {
        suggested_key: { default: 'Alt+T' },
        description: 'Translate the current selection',
      },
    },
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
