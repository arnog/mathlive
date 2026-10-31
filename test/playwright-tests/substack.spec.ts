import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

test('a new row in the limit of a sum stacks it in a \\substack', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.focus();
    mfe.executeCommand(['insert', '\\sum_{#?}']);
  });
  await page.locator('#mf-1').pressSequentially('i<n', { delay: 50 });
  await page.locator('#mf-1').press('Control+Enter');
  await page.locator('#mf-1').pressSequentially('j<m', { delay: 50 });

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);

  expect(latex).toBe(String.raw`\sum_{\substack{i<n\\ j<m}}`);
});

test('a new row in a \\substack adds a line to it', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.focus();
    mfe.executeCommand(['insert', '\\sum_{\\substack{i<n\\\\#?}}']);
  });
  await page.locator('#mf-1').pressSequentially('j<m', { delay: 50 });
  await page.locator('#mf-1').press('Control+Enter');
  await page.locator('#mf-1').pressSequentially('k', { delay: 50 });

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);

  expect(latex).toBe(String.raw`\sum_{\substack{i<n\\ j<m\\ k}}`);
});
