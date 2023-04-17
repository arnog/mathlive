import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// #1691
test('right parenthesis first', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').type('1)');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').type('(');


  // check that space bar navigated out of denominator of fraction
  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`\left(1\right)`);
});


// #1375
test('curly brackes', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').type('{a}');

  let latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`\left\lbrace a\right\rbrace`);

  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('Backspace');

  latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe('');
});


// #1845
test('mixed closing delimiter', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').press('Shift+|')
  await page.locator('#mf-1').type('(1+2)');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`\left|\left(1+2\right)\right|`);

});


// #1656 and #1742
test('editing and re-adding right delimiter', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').type('1+cos()y')
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').type(')')

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`1+\cos\left(y\right)`);

});


// issue where deleting and replacing left paranthesis doesn't trigger update
test('editing and re-adding left delimiter', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').type('(1+2)')
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').type('(');

  const latex = await page.locator('#mf-1\\.value').textContent();

  expect(latex).toBe(String.raw`\left(1+2\right)`);

});



