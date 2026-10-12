import { test, expect } from '@playwright/test';

// Regression tests for #3111: the menu must close on a press outside of it,
// whatever the ancestors of the mathfield, and on a press on the mathfield.

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

// The menu is dismissed by a press on its scrim. The presses below use
// page.mouse, since locator.click() refuses to click an element that the
// scrim covers.

test('a press outside a transformed ancestor closes the menu', async ({
  page,
}) => {
  // A transform makes the element the containing block of its
  // `position: fixed` descendants, unless they are in the top layer
  await page.evaluate(() =>
    document.body.insertAdjacentHTML(
      'afterbegin',
      `<div id="transformed" style="transform: translateZ(0)">
        <math-field id="mf-transformed">x^2</math-field>
      </div>`
    )
  );
  const menu = page.locator('#mf-transformed .ui-menu-container');

  await page.locator('#mf-transformed [part=menu-toggle]').click();
  await expect(menu).toBeVisible();

  const box = (await page.locator('#transformed').boundingBox())!;
  await page.mouse.click(box.x + 10, box.y + box.height + 40);
  await expect(menu).toHaveCount(0);
});

test('a press on the mathfield closes the menu', async ({ page }) => {
  const menu = page.locator('#mf-1 .ui-menu-container');

  await page.locator('#mf-1 [part=menu-toggle]').click();
  await expect(menu).toBeVisible();

  const box = (await page.locator('#mf-1').boundingBox())!;
  await page.mouse.click(box.x + 10, box.y + box.height / 2);
  await expect(menu).toHaveCount(0);
});
