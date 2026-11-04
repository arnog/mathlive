import { expect, test } from '@playwright/test';

test('insertDms chooses a semantic marker after an integer', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  const results = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      const insertDms = (latex: string): string => {
        mfe.value = latex;
        mfe.executeCommand('insertDms');
        return mfe.value;
      };

      return [
        insertDms('30'),
        insertDms('30\\degree15'),
        insertDms('30\\degree15\\minute20'),
        insertDms('30.5'),
        insertDms('30{,}5'),
        insertDms('x'),
      ];
    });

  expect(results).toEqual([
    '30\\degree',
    '30\\degree15\\minute',
    '30\\degree15\\minute20\\second',
    '30.5',
    '30{,}5',
    'x',
  ]);
});
