import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

const MULTILINE = String.raw`\displaylines{a=b\\ c=d}`;

declare global {
  interface Window {
    copiedData: Record<string, string>;
  }
}

test('serializing the whole range of a multiline mathfield keeps the row separators', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').evaluate((e: MathfieldElement, latex: string) => {
    e.value = latex;
  }, MULTILINE);

  // Serializing the whole mathfield goes through the root...
  expect(
    await page
      .locator('#mf-1')
      .evaluate((e: MathfieldElement) => e.getValue('latex-expanded'))
  ).toBe(MULTILINE);

  // ...and serializing a range that covers the whole mathfield has to agree
  // with it. This is the range a copy uses, and it used to return the atoms of
  // every row rather than the array they belong to, dropping the `\\` between
  // them.
  expect(
    await page
      .locator('#mf-1')
      .evaluate((e: MathfieldElement) => e.getValue(0, -1, 'latex-expanded'))
  ).toBe(MULTILINE);
});

test('copying a multiline mathfield keeps the row separators', async ({
  page,
  browserName,
}) => {
  // Use process.platform (the real OS) rather than navigator.platform,
  // which Playwright's bundled Chromium and Firefox both report as 'Win32'
  // even on macOS.
  const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';

  // On macOS, Cmd+A doesn't trigger select-all in Playwright's bundled
  // Chromium. Use Ctrl+A instead; it works in Playwright on Mac and is the
  // standard select-all on other platforms. Cmd+A works correctly in real
  // Chrome/Edge on Mac and in Playwright's bundled Firefox.
  const selectAllCommand =
    modifierKey === 'Meta' && browserName === 'chromium'
      ? 'Control+a'
      : `${modifierKey}+a`;

  await page.goto('/dist/playwright-test-page/');

  // Read the payload from the copy event itself rather than from the system
  // clipboard: reading the clipboard needs permissions that are not available
  // in every browser, and the clipboard is shared by every test running in
  // parallel.
  await page.locator('#mf-1').evaluate((e: MathfieldElement, latex: string) => {
    e.value = latex;
    e.addEventListener('copy', (ev: ClipboardEvent) => {
      window.copiedData = {
        'text/plain': ev.clipboardData!.getData('text/plain'),
        'application/x-latex': ev.clipboardData!.getData('application/x-latex'),
      };
    });
  }, MULTILINE);

  await page.locator('#mf-1').press(selectAllCommand);
  await page.locator('#mf-1').press(`${modifierKey}+c`);

  expect(await page.evaluate(() => window.copiedData)).toStrictEqual({
    'text/plain': `$$ ${MULTILINE} $$`,
    'application/x-latex': MULTILINE,
  });
});
