import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// #1691
test('right parenthesis first', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1)');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').pressSequentially('(');

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

  await page.locator('#mf-1').pressSequentially('{a}');

  let latex = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    return mfe.value;
  });

  expect(latex).toBe(String.raw`\left\lbrace a\right\rbrace`);

  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('Backspace');

  latex = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    return mfe.value;
  });

  expect(latex).toBe('');
});

// #1845
test('mixed closing delimiter', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').press('Shift+|');
  await page.locator('#mf-1').pressSequentially('(1+2)');

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

  await page.locator('#mf-1').pressSequentially('1+cos()y');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially(')');

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

  await page.locator('#mf-1').pressSequentially('(1+2)');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').pressSequentially('(');

  const latex = await page.locator('#mf-1\\.value').textContent();

  expect(latex).toBe(String.raw`\left(1+2\right)`);
});

test('deleting and re-adding left delimiter outside leftright atom', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1+(2+3)+4');
  for (let i = 0; i < 6; i++) await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  for (let i = 0; i < 3; i++) await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').pressSequentially('(');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`\left(1+2+3\right)+4`);
});

test('deleting and re-adding left delimiter inside leftright atom', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1+(2+3)+4');
  for (let i = 0; i < 6; i++) await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially('(');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`1+2+\left(3\right)+4`);
});

test('deleting and re-adding right delimiter in place', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1+(2+3)+4');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').pressSequentially(')');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`1+\left(2+3\right)+4`);
});

test('deleting and re-adding right delimiter outside leftright atom', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1+(2+3)+4');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially(')');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`1+\left(2+3+4\right)`);
});

test('deleting and re-adding right delimiter inside leftright atom', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1+(2+3)+4');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').pressSequentially(')');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe(String.raw`1+\left(2\right)+4+3`);
});
