import { test, expect } from '@playwright/test';

import type { MathfieldElement } from '../../src/public/mathfield-element';

test('placeholders in displaylines are clickable (issue #2619)', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  // Set the value with displaylines containing placeholders
  await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value =
      '\\displaylines{x=\\placeholder[gap1]{},\\\\ y=\\placeholder[gap2]{}}';
    mfe.readOnly = false; // Make sure it's not readonly
  });

  await page.waitForTimeout(200);

  // Find all prompt boxes (placeholders render as prompts)
  const prompts = page.locator('#mf-1 .ML__prompt');
  const promptCount = await prompts.count();
  expect(promptCount).toBe(2); // Should have 2 placeholders

  // Click on the first placeholder (first row: x=...)
  const box1 = await prompts.nth(0).boundingBox();
  expect(box1).not.toBeNull();

  if (box1) {
    // Click on the prompt (force click because the box overlays it)
    await prompts.nth(0).click({ force: true });
    await page.waitForTimeout(200);

    // Check if the first placeholder is selected
    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      return {
        selection: mfe.getValue(mfe.selection, 'latex'),
        hasFocus: mfe.hasFocus(),
        position: (mfe as any).model?.position,
      };
    });

    console.log('After clicking first placeholder:', result);
    expect(result.selection).toContain('placeholder[gap1]');
  }

  // Click on the second placeholder (second row: y=...)
  const box2 = await prompts.nth(1).boundingBox();
  expect(box2).not.toBeNull();

  if (box2) {
    await prompts.nth(1).click({ force: true });
    await page.waitForTimeout(200);

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      return {
        selection: mfe.getValue(mfe.selection, 'latex'),
        hasFocus: mfe.hasFocus(),
        position: (mfe as any).model?.position,
      };
    });

    console.log('After clicking second placeholder:', result);
    expect(result.selection).toContain('placeholder[gap2]');
  }
});

test('placeholders without displaylines are clickable (control)', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  // Set the value with placeholders NOT in displaylines
  await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value = 'x=\\placeholder[gap1]{}, y=\\placeholder[gap2]{}';
    mfe.readOnly = false; // Make sure it's not readonly
  });

  await page.waitForTimeout(200);

  // Find all prompt boxes
  const prompts = page.locator('#mf-1 .ML__prompt');
  const promptCount = await prompts.count();
  expect(promptCount).toBe(2);

  // Click on the first placeholder
  await prompts.nth(0).click({ force: true });
  await page.waitForTimeout(200);

  const result1 = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    return {
      selection: mfe.getValue(mfe.selection, 'latex'),
      hasFocus: mfe.hasFocus(),
    };
  });

  console.log('Control test - After clicking gap1:', result1);
  expect(result1.selection).toContain('placeholder[gap1]');

  // Click on the second placeholder
  await prompts.nth(1).click({ force: true });
  await page.waitForTimeout(200);

  const result2 = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    return {
      selection: mfe.getValue(mfe.selection, 'latex'),
      hasFocus: mfe.hasFocus(),
    };
  });

  console.log('Control test - After clicking gap2:', result2);
  expect(result2.selection).toContain('placeholder[gap2]');
});
