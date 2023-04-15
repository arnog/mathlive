import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

test('virtual-keyboard-toggle visibility', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(0).isVisible()
  ).toBe(true);

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(1).isVisible()
  ).toBe(false);
});

test('virtual keyboard with two math fields', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // toggle the virtual keyboard to visible and focus first math field
  await page.locator('.ML__virtual-keyboard-toggle').nth(0).click();

  // press some keyboard buttons
  await page.getByRole('toolbar').getByText('abc').click();
  await page.getByText('zZ').click();
  await page.getByRole('toolbar').getByText('123').click();
  await page.getByText('=≠').first().click();
  await page.getByText('1■−1').click();
  await page.getByText('÷■1').click();
  await page.getByText('2■2').click();

  // check resulting latex
  let latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe('z=\\frac12');

  // click to focus next math field to make sure virtual keyboard updates focused math field
  await page.locator('#mf-2').click();

  await page.getByText('na', { exact: true }).click();
  await page.getByText('=≠').first().click();
  await page.getByText('xy').click();
  await page.getByText('■2■′').click();

  // check latex of second math field
  // make sure first math field is unchanged
  latex = await page
    .locator('#mf-2')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe('n=x^2');

  // make sure first math field is unchanged
  latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe('z=\\frac12');

  // make sure that when no mathfield is focused that the virtual keyboard is hidden
  await page.locator('#ta-2').click();
  await page
    .getByRole('toolbar')
    .getByText('123')
    .waitFor({ state: 'detached' });
});
