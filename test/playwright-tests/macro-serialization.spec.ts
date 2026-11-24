import type { MathfieldElement } from '../../src/public/mathfield-element';

import { expect, test } from '@playwright/test';

test('an unbraced macro argument remains separate from the command', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  const cases = [
    [String.raw`a\equiv b\pmod m`, String.raw`a\equiv b\pmod m`],
    [String.raw`a\equiv b\pmod{m}`, String.raw`a\equiv b\pmod{m}`],
    [String.raw`a\equiv b\pmod 3`, String.raw`a\equiv b\pmod3`],
    [String.raw`a\equiv b\pmod\alpha`, String.raw`a\equiv b\pmod\alpha`],
  ];

  for (const [input, expected] of cases) {
    const output = await page
      .locator('#mf-1')
      .evaluate((field: MathfieldElement, latex: string) => {
        field.setValue('');
        field.insert(latex, { format: 'latex' });
        return field.getValue('latex');
      }, input);
    expect(output).toBe(expected);
  }
});
