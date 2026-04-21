import { test, expect } from '@playwright/test';

const LIGHT_NEUTRAL_100 = 'rgb(245, 245, 245)'; // #f5f5f5
const DARK_NEUTRAL_100 = 'rgb(18, 18, 18)'; //    #121212

// Probe a custom property via a real color channel so that light-dark()
// resolves. Reading the custom property with getPropertyValue returns the
// unresolved `light-dark(...)` expression.
const readVar = (id: string, varName: string) => `
  (() => {
    const mf = document.getElementById(${JSON.stringify(id)});
    mf.style.setProperty('outline-color', 'var(${varName})');
    return getComputedStyle(mf).outlineColor;
  })()
`;

const readColorScheme = (id: string) => `
  (() => {
    const mf = document.getElementById(${JSON.stringify(id)});
    return getComputedStyle(mf).colorScheme;
  })()
`;

// --_caret-color is defined in mathfield.less on .ML__container. Probing
// it verifies that file's light-dark() rewrite resolves correctly, not just
// colors.less. The container inherits its computed color-scheme from the
// host, so probing the container itself is sufficient.
const readCaretColor = (id: string) => `
  (() => {
    const mf = document.getElementById(${JSON.stringify(id)});
    const container = mf.shadowRoot.querySelector('.ML__container');
    container.style.setProperty('outline-color', 'var(--_caret-color)');
    return getComputedStyle(container).outlineColor;
  })()
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

test('theme="light" overrides prefers-color-scheme: dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });

  // With no theme attribute, the system dark preference should apply.
  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    DARK_NEUTRAL_100
  );

  // Setting theme='light' should flip back to the light palette.
  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    LIGHT_NEUTRAL_100
  );
});

test('theme="dark" overrides prefers-color-scheme: light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });

  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    LIGHT_NEUTRAL_100
  );

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'dark');
  });
  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    DARK_NEUTRAL_100
  );
});

test('removing theme attribute restores system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    LIGHT_NEUTRAL_100
  );

  await page.evaluate(() => {
    document.getElementById('mf-1')!.removeAttribute('theme');
  });
  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    DARK_NEUTRAL_100
  );
});

test('theme attribute pins the computed color-scheme', async ({ page }) => {
  // Default tracks the system preference.
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await page.evaluate(readColorScheme('mf-1'))).toBe('light dark');

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  expect(await page.evaluate(readColorScheme('mf-1'))).toBe('light');

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'dark');
  });
  expect(await page.evaluate(readColorScheme('mf-1'))).toBe('dark');
});

test('mathfield.less variables respect theme attribute', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });

  // `--_caret-color` is a container-scoped variable defined in mathfield.less,
  // not colors.less. The container inherits its computed color-scheme from
  // the host, so light-dark() in mathfield.less resolves accordingly.
  const darkCaret = await page.evaluate(readCaretColor('mf-1'));

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  const lightCaret = await page.evaluate(readCaretColor('mf-1'));

  // The two modes should produce different caret colors; we don't care about
  // the exact hsl values, just that light-dark() actually resolved to a
  // different branch.
  expect(darkCaret).not.toBe(lightCaret);
  expect(darkCaret).not.toBe('');
  expect(lightCaret).not.toBe('');
});
