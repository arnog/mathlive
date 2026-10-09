import { test, expect } from '@playwright/test';

const LIGHT_NEUTRAL_100 = 'rgb(245, 245, 245)';
const DARK_NEUTRAL_100 = 'rgb(18, 18, 18)';

const readVar = (id: string, varName: string) => `
  (() => {
    const mf = document.getElementById(${JSON.stringify(id)});
    mf.style.setProperty('outline-color', 'var(${varName})');
    return getComputedStyle(mf).outlineColor;
  })()
`;

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

  expect(await page.evaluate(readVar('mf-1', '--neutral-100'))).toBe(
    DARK_NEUTRAL_100
  );

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

test('mathfield.less container variables respect theme attribute', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const darkCaret = await page.evaluate(readCaretColor('mf-1'));

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'light');
  });
  const lightCaret = await page.evaluate(readCaretColor('mf-1'));

  expect(darkCaret).not.toBe(lightCaret);
  expect(darkCaret).not.toBe('');
  expect(lightCaret).not.toBe('');
});

test('theme="dark" on light OS applies dark container palette', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const lightCaret = await page.evaluate(readCaretColor('mf-1'));

  await page.evaluate(() => {
    document.getElementById('mf-1')!.setAttribute('theme', 'dark');
  });
  const darkCaret = await page.evaluate(readCaretColor('mf-1'));

  expect(darkCaret).not.toBe(lightCaret);

  // Sanity: this dark caret should match the one produced by dark OS with no theme attribute.
  await page.evaluate(() => {
    document.getElementById('mf-1')!.removeAttribute('theme');
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  const osDarkCaret = await page.evaluate(readCaretColor('mf-1'));
  expect(darkCaret).toBe(osDarkCaret);
});
