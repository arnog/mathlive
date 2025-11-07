import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect, Page } from '@playwright/test';

type KeycapIdentifier =
  | string
  | {
      label?: string;
      value?: string;
    };

const keycapLocator = (page: Page, identifier: KeycapIdentifier) => {
  const selectors: string[] = [];
  const scopedSelector = (sel: string) =>
    `.MLK__layer.is-visible ${sel}`;

  if (typeof identifier === 'string') {
    selectors.push(scopedSelector(`[aria-label="${identifier}"]`));
  } else {
    if (identifier.label)
      selectors.push(scopedSelector(`[aria-label="${identifier.label}"]`));
    if (identifier.value)
      selectors.push(
        scopedSelector(`[data-keycap-value="${identifier.value}"]`)
      );
  }

  if (selectors.length === 0)
    throw new Error('keycapLocator requires a label or value');

  return page.locator(selectors.join(', ')).first();
};

type KeypressOptions = {
  beforeKeyPress?: () => Promise<void>;
  afterKeyPress?: (identifier: KeycapIdentifier | string) => Promise<void>;
};

test('virtual-keyboard-toggle visibility', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(0).isVisible()
  ).toBe(true);

  expect(
    await page.locator('.ML__virtual-keyboard-toggle').nth(1).isVisible()
  ).toBe(false);
});

async function virtualKeyboardSample1(
  page: Page,
  options?: KeypressOptions
) {
  const press = async (identifier: KeycapIdentifier | string) => {
    if (options?.beforeKeyPress) await options.beforeKeyPress();
    await keycapLocator(page, identifier).click();
    if (options?.afterKeyPress) await options.afterKeyPress(identifier);
    // Add small delay to simulate human timing
    await page.waitForTimeout(50);
  };

  await page.getByRole('toolbar').getByText('abc').click();
  await press('z');
  await page.getByRole('toolbar').getByText('123').click();
  await press('=');
  await press('1');
  await press({ label: '&divide;' });
  await press('2');

  return 'z=\\frac12';
}

async function virtualKeyboardSample2(
  page: Page,
  options?: KeypressOptions
) {
  const press = async (identifier: KeycapIdentifier | string) => {
    if (options?.beforeKeyPress) await options.beforeKeyPress();
    await keycapLocator(page, identifier).click();
    if (options?.afterKeyPress) await options.afterKeyPress(identifier);
    // Add small delay to simulate human timing
    await page.waitForTimeout(50);
  };

  await press('n');
  await press('=');
  await press('x');
  await press({ value: '#@^2}' });

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

  // Wait for focus change
  await page.waitForTimeout(100);

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

test('math fields in iframe with virtual keyboard', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/iframe_test.html');

  const frame = page.frame('mathlive-iframe');

  expect(frame).toBeTruthy();

  if (frame) {
    // toggle the virtual keyboard to visible and focus first math field
    await frame.locator('.ML__virtual-keyboard-toggle').nth(0).click();

    // Ensure the iframe mathfield has focus before sending VK commands
    await frame.locator('#mf-1').focus();
    await frame.waitForFunction(() => document.activeElement?.id === 'mf-1');

    // press some keyboard buttons (keyboard will be in main page)
    const expectedResult1 = await virtualKeyboardSample1(page);

    // check resulting latex
    let latex = await frame
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(latex).toBe(expectedResult1);
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
  const rowLocator = page.locator('.MLK__layer.is-visible .MLK__row');
  await rowLocator.locator('> :nth-child(1)').click(); // shift
  await rowLocator.locator('> :nth-child(2)').click(); // A
  await rowLocator.locator('> :nth-child(1)').click(); // shift
  await rowLocator.locator('> :nth-child(2)').click(); // a

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);
  expect(latex).toBe('Aa');
});
