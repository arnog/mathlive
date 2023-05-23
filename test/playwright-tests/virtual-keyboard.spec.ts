import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect, Page } from '@playwright/test';

test('virtual-keyboard-toggle visibility', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(0).isVisible()
  ).toBe(true);

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(1).isVisible()
  ).toBe(false);
});

async function virtualKeyboardSample1(page: Page) {
  await page.getByRole('toolbar').getByText('abc').click();
  await page.getByText('zZ').click();
  await page.getByRole('toolbar').getByText('123').click();
  await page.getByText('=≠').first().click();
  await page.getByText('1■−1').click();
  await page.getByText('÷■1').click();
  await page.getByText('2■2').click();

  return 'z=\\frac12';
} 

async function virtualKeyboardSample2(page: Page) {
  await page.getByText('na', { exact: true }).click();
  await page.getByText('=≠').first().click();
  await page.getByText('xy').click();
  await page.getByText('■2■′').click();

  return 'n=x^2';
} 

test('virtual keyboard with two math fields', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // toggle the virtual keyboard to visible and focus first math field
  await page.locator('.ML__virtual-keyboard-toggle').nth(0).click();

  // press some keyboard buttons
  const expectedResult1 = await virtualKeyboardSample1(page);

  // check resulting latex
  let latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe(expectedResult1);

  // click to focus next math field to make sure virtual keyboard updates focused math field
  await page.locator('#mf-2').click();

  const expectedResult2 = await virtualKeyboardSample2(page);

  // check latex of second math field
  // make sure first math field is unchanged
  latex = await page
    .locator('#mf-2')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe(expectedResult2);

  // make sure first math field is unchanged
  latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe(expectedResult1);

  // make sure that when no mathfield is focused that the virtual keyboard is hidden
  await page.locator('#ta-2').click();
  await page
    .getByRole('toolbar')
    .getByText('123')
    .waitFor({ state: 'detached' });
});

test('math fields in iframe with virtual keyboard', async ({ page, browserName, context }) => {
  test.skip(browserName === "webkit" && Boolean(process.env.CI), "Iframe test is flaky in webkit on GH actions");

  await page.goto('/dist/playwright-test-page/');

  const frame = page.frame('mathlive-iframe');

  expect(frame).toBeTruthy();

  if (frame) {
    // toggle the virtual keyboard to visible and focus first math field
    await frame.locator('.ML__virtual-keyboard-toggle').nth(0).click();

    // press some keyboard buttons (keyboard will be in main page)
    const expectedResult1 = await virtualKeyboardSample1(page);

    // check resulting latex
    let latex = await frame
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(latex).toBe(expectedResult1);

    // click to focus math field in current page to make sure virtual keyboard updates focused mathfield
    await page.locator('text=#mf-1: default').click(); // need to click on page before focusing in page math field
    await page.locator('#mf-1').focus();

    const expectedResult2 = await virtualKeyboardSample2(page);

    // check latex of in page math field
    // make sure iframe math field is unchanged
    latex = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(latex).toBe(expectedResult2);

    // make sure first math field is unchanged
    latex = await frame
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(latex).toBe(expectedResult1);

    // make sure that when no mathfield is focused that the virtual keyboard is hidden
    await page.locator('#ta-2').click();
    await page
      .getByRole('toolbar')
      .getByText('123')
      .waitFor({ state: 'detached' });
  }
});

test('Switch layer by shift', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.evaluate(() => {
    const shift = {
      class: 'action font-glyph modifier',
      label: "<svg><use xlink:href='#svg-shift' /></svg>",
    };
    window.mathVirtualKeyboard.layouts = [
      {
        label: 'abc',
        layers: [
          {
            id: 'abc-lower',
            rows: [
              [
                {
                  ...shift,
                  command: ['switchKeyboardLayer', 'abc-upper'],
                },
                {
                  latex: 'a',
                },
              ],
            ],
          },
          {
            id: 'abc-upper',
            rows: [
              [
                {
                  ...shift,
                  command: ['switchKeyboardLayer', 'abc-lower'],
                },
                {
                  latex: 'A',
                },
              ],
            ],
          },
        ],
      },
    ];
  });

  await page.locator('.ML__virtual-keyboard-toggle').nth(0).click();
  const rowLocator = page.locator('.MLK__layer.is-visible .row');
  await rowLocator.locator('> :nth-child(1)').click(); // shift
  await rowLocator.locator('> :nth-child(2)').click(); // A
  await rowLocator.locator('> :nth-child(1)').click(); // shift
  await rowLocator.locator('> :nth-child(2)').click(); // a

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe('Aa');
});
