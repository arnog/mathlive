import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

test('max-matrix-rows attribute', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  const testLatex = String.raw`\begin{bmatrix} a & b & c & d & e & f & g & h & i & j & k \\ l & m & n & o & p & q & r & s & t & u & v \end{bmatrix}`;

  await page
    .locator('#mf-1')
    .evaluate(
      (e: MathfieldElement, latex: string) => (e.value = latex),
      testLatex
    );

  await page
    .locator('#mf-6')
    .evaluate(
      (e: MathfieldElement, latex: string) => (e.value = latex),
      testLatex
    );

  // check latex (default #mf-1 should wrap after 10 columns, #mf-6 with max-matrix-cols=11 should not wrap)
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.getValue('latex-expanded'))
  ).toBe("\\begin{bmatrix}a & b & c & d & e & f & g & h & i & j\\\\ k & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{}\\\\ l & m & n & o & p & q & r & s & t & u\\\\ v & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{} & \\placeholder{}\\end{bmatrix}");

  expect(
    await page.locator('#mf-6').evaluate((e: MathfieldElement) => e.getValue('latex-expanded'))
  ).toBe("\\begin{bmatrix}a & b & c & d & e & f & g & h & i & j & k\\\\ l & m & n & o & p & q & r & s & t & u & v\\end{bmatrix}");
});