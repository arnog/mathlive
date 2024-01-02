import { test, expect } from '@playwright/test';

import type { MathfieldElement } from '../../src/public/mathfield-element';

test('double/triple click to select', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('(x+y)-(125+s)=34');

  // double click to select clicked on block
  await page.locator('#mf-1 >> span.ML__cmr >> text=2').dblclick();

  // check selection latex
  let selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('125');

  await page.locator('#mf-1').press('ArrowRight'); // unselect current selection

  // triple click to select it all
  await page
    .locator('#mf-1 >> span.ML__cmr >> text=3')
    .click({ clickCount: 3, delay: 200 });

  // check selection latex
  selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe(
    String.raw`\left(x+y\right)-\left(125+s\right)=34`
  );
});
