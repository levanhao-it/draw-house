/**
 * Resolves when all @font-face fonts have been loaded by the browser.
 * Must be awaited before any canvas toDataURL/toBlob call (G-6).
 */
export function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}
