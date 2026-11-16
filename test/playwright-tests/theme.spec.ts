import type { Locator } from '@playwright/test';

import { test, expect } from '@playwright/test';

type ThemeStyles = {
  neutral: string;
  menuBackground: string;
  caret: string;
  selectionText: string;
  selectionBackground: string;
  containsHighlightBackground: string;
};

async function readThemeStyles(mathfield: Locator): Promise<ThemeStyles> {
  return mathfield.evaluate((element) => {
    const container =
      element.shadowRoot!.querySelector<HTMLElement>('.ML__container')!;

    const resolveColor = (target: HTMLElement, property: string): string => {
      const previous = target.style.outlineColor;
      target.style.outlineColor = `var(${property})`;
      const value = getComputedStyle(target).outlineColor;
      target.style.outlineColor = previous;
      return value;
    };

    return {
      neutral: resolveColor(element, '--neutral-100'),
      menuBackground: resolveColor(element, '--ui-menu-bg'),
      caret: resolveColor(container, '--_caret-color'),
      selectionText: resolveColor(container, '--_selection-color'),
      selectionBackground: resolveColor(
        container,
        '--_selection-background-color'
      ),
      containsHighlightBackground: resolveColor(
        container,
        '--_contains-highlight-background-color'
      ),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

test('theme attribute overrides the system color scheme', async ({ page }) => {
  const mathfield = page.locator('#mf-1');

  await page.emulateMedia({ colorScheme: 'light' });
  const systemLight = await readThemeStyles(mathfield);

  await page.emulateMedia({ colorScheme: 'dark' });
  const systemDark = await readThemeStyles(mathfield);
  expect(systemDark).not.toEqual(systemLight);

  await mathfield.evaluate((element) => element.setAttribute('theme', 'light'));
  expect(await readThemeStyles(mathfield)).toEqual(systemLight);

  await mathfield.evaluate((element) => element.removeAttribute('theme'));
  expect(await readThemeStyles(mathfield)).toEqual(systemDark);

  await page.emulateMedia({ colorScheme: 'light' });
  await mathfield.evaluate((element) => element.setAttribute('theme', 'dark'));
  expect(await readThemeStyles(mathfield)).toEqual(systemDark);
});

test('forced colors override dark theme colors', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
  const mathfield = page.locator('#mf-1');

  for (const theme of [null, 'dark']) {
    await mathfield.evaluate((element, theme) => {
      if (theme === null) {
        element.removeAttribute('theme');
      } else {
        element.setAttribute('theme', theme);
      }
    }, theme);

    const caretColor = await mathfield.evaluate((element) => {
      const container = element.shadowRoot!.querySelector('.ML__container')!;
      return getComputedStyle(container)
        .getPropertyValue('--_caret-color')
        .trim();
    });
    expect(caretColor).toBe('white');
  }
});
