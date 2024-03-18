import { test, expect } from '@playwright/test';

import type { MathfieldElement } from '../../src/public/mathfield-element';

test('double/triple click to select', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('(x+y)-(125+s)=34');

  // double click to select clicked on block
  await page.locator('#mf-1 >> span.ML__cmr >> text=2').dblclick();

  // check selection latex
  let selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('125');

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
  expect(selectionLatex).toBe(
    String.raw`\left(x+y\right)-\left(125+s\right)=34`
  );
});

test('context menu select all and cut', async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit' && Boolean(process.env.CI),
    'Keyboard paste does not work when headless on Linux (works when run with gui on Linux or headless/gui on MacOs)'
  );

  const modifierKey = /Mac|iPod|iPhone|iPad/.test(
    await page.evaluate(() => navigator.platform)
  )
    ? 'Meta'
    : 'Control';

  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('x+y=30');

  // check initial contents
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('x+y=30');  

  // use select all and cut from the context menu
  await page.locator('#mf-1').click({button: "right"});
  await page.locator('text=Select All').click();
  await new Promise((resolver) => setTimeout(resolver, 1000));
  await page.locator('#mf-1').click({button: "right"});
  await page.locator('text=Cut').click();
  await new Promise((resolver) => setTimeout(resolver, 1000));

  // make sure field is empty after
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('');
  
  // paste original contents back
  // need to use keyboard shortcut since context menu paste requires browser permission
  await page.locator('#mf-1').press(`${modifierKey}+v`);

  // initial contents should now be there
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value.trim())
  ).toBe('x+y=30');  
});

