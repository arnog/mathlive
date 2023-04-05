import { S } from '../../src/core/mathstyle';
import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

test('double/triple click to select', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  await page.locator('#mf-1').type('(x+y)-(r+s)=34');

  // double click to select clicked on block
  await page.locator('#mf-1 >> span.ML__mathit >> text=r').dblclick();

  // check selection latex
  let selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('r+s');

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
  expect(selectionLatex).toBe(String.raw`\left(x+y\right)-\left(r+s\right)=34`);
});
