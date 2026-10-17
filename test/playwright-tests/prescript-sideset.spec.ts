import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

/** Inserts `latex`, then types each of `fills` in the next placeholder. */
async function fill(page, latex: string, fills: string[]): Promise<string> {
  await page.goto('/dist/playwright-test-page/');
  const field = page.locator('#mf-1');
  await field.evaluate((mfe: MathfieldElement, latex: string) => {
    mfe.focus();
    mfe.executeCommand(['insert', latex]);
  }, latex);
  for (const [i, text] of fills.entries()) {
    if (i > 0)
      await field.evaluate((mfe: MathfieldElement) =>
        mfe.executeCommand('moveToNextPlaceholder')
      );
    await field.pressSequentially(text, { delay: 50 });
  }
  return field.evaluate((mfe: MathfieldElement) => mfe.value);
}

test('\\prescript visits its superscript, its subscript, then its base', async ({
  page,
}) => {
  expect(await fill(page, '\\prescript{#?}{#?}{#?}', ['14', '6', 'C'])).toBe(
    String.raw`\prescript{14}{6}{C}`
  );
});

test('\\sideset visits the scripts before, the scripts after, then the limits', async ({
  page,
}) => {
  expect(
    await fill(page, '\\sideset{_{#?}^{#?}}{_{#?}^{#?}}\\sum_{#?}^{#?}', [
      'a',
      'b',
      'c',
      'd',
      'i',
      'n',
    ])
  ).toBe(String.raw`\sideset{_{a}^{b}}{_{c}^{d}}\sum_{i}^{n}`);
});

test('backspace empties a \\prescript one script at a time, then deletes it', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');
  const field = page.locator('#mf-1');
  await field.evaluate((mfe: MathfieldElement) => {
    mfe.value = '\\prescript{1}{6}{C}';
    mfe.focus();
    mfe.executeCommand('moveToMathfieldEnd');
  });
  const value = () => field.evaluate((mfe: MathfieldElement) => mfe.value);

  // Into the base, then its letter
  await field.press('Backspace');
  await field.press('Backspace');
  expect(await value()).toBe(String.raw`\prescript{1}{6}{}`);
  // On to the subscript, then its digit
  await field.press('Backspace');
  await field.press('Backspace');
  expect(await value()).toBe(String.raw`\prescript{1}{}{}`);
  // On to the superscript, then its digit; then the empty \prescript goes
  await field.press('Backspace');
  await field.press('Backspace');
  await field.press('Backspace');
  expect(await value()).toBe('');
});
