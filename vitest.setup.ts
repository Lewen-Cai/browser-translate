import '@testing-library/jest-dom/vitest';

// jsdom has no ResizeObserver. Nothing under test depends on it firing — the
// code that uses it re-measures on demand as well — so an inert stand-in is
// enough to keep construction from throwing.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
