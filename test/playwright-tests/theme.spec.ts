import { test, expect } from '@playwright/test';

// Regression tests for https://github.com/arnog/mathlive/issues/2999
// theme="light" must override `prefers-color-scheme: dark` so that an
// author-set attribute is authoritative over the OS-level preference.

const LIGHT_NEUTRAL_100 = '#f5f5f5';
const DARK_NEUTRAL_100 = '#121212';

const readNeutral100 = (id: string) =>
  `(() => {
    const mf = document.getElementById(${JSON.stringify(id)});
    return getComputedStyle(mf).getPropertyValue('--neutral-100').trim();
  })()`;

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

test('theme="light" overrides prefers-color-scheme: dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });

  // With no theme attribute, the system dark preference should apply.
  const before = await page.evaluate(readNeutral100('mf-1'));
  expect(before).toBe(DARK_NEUTRAL_100);

  // Setting theme='light' should flip back to the light palette.
  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  const after = await page.evaluate(readNeutral100('mf-1'));
  expect(after).toBe(LIGHT_NEUTRAL_100);
});

test('theme="dark" overrides prefers-color-scheme: light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });

  const before = await page.evaluate(readNeutral100('mf-1'));
  expect(before).toBe(LIGHT_NEUTRAL_100);

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'dark');
  });
  const after = await page.evaluate(readNeutral100('mf-1'));
  expect(after).toBe(DARK_NEUTRAL_100);
});

test('removing theme attribute restores system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  expect(await page.evaluate(readNeutral100('mf-1'))).toBe(LIGHT_NEUTRAL_100);

  await page.evaluate(() => {
    document.getElementById('mf-1')!.removeAttribute('theme');
  });
  expect(await page.evaluate(readNeutral100('mf-1'))).toBe(DARK_NEUTRAL_100);
});
