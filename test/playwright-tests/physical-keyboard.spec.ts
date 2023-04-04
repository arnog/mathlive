import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';


// Tests the following functionality on the smoke test page: 
// Cmd-A select all, latex mode, press Enter to exit latex mode, smartSuperscript,
// +- inline shortcut, down arrow for fraction navigation,
// latex render, MathJson render, MathASCII render, MathML render,
// speakable text render, selection latex, selection replace on type,
// custom onInlineShortcut handler, replace * with \cdot
test('smoke test with physical keyboard', async ({ page, browserName }) => {
  const modifierKey = /Mac|iPod|iPhone|iPad/.test(await page.evaluate( () => navigator.platform)) ? "Meta" : "Control";

  let selectAllCommand = `${modifierKey}+a`;
  if (modifierKey === "Meta" && browserName === "chromium") {
    // Cmd-a not working with Chromium on Mac, need to use Control-A
    // Cmd-a works correctly on Chrome and Edge on Mac
    selectAllCommand = 'Control+a';
  }

  await page.goto('/dist/smoke/');

  await page.locator('math-field').press(selectAllCommand);
  await page.locator('math-field').type('x=/-b+-\sqrt');
  await page.locator('math-field').press('Enter');
  await page.locator('math-field').type('b^2-4ac');
  await page.locator('math-field').press('ArrowDown');
  await page.locator('math-field').type('2a');

  // check latex
  await page.locator(String.raw`text=x=\frac{-b\pm\sqrt{b^2-4\mathrm{ac}}}{2a}`).waitFor();

  // check MathJson
  await page.locator('text=["Equal","x",["Divide",["Multiply",["Rational",1,2],["PlusMinus",["Negate","b"],["Sqrt",["Add",["Multiply",-4,"ac"],["Square","b"]]]]],"a"]]')
            .waitFor();

  // check MathASCII
  await page.locator('text=x=(-b+-sqrt(b^2-4ac))/(2a)').waitFor();
  
  // check MathML
  await page.locator('text=<mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>&#177;</mo><msqrt><mrow><msup>b<mn>2</mn></msup><mo>−</mo><mn>4</mn><mo>&#8290;</mo><mi>ac</mi></mrow></msqrt></mrow><mrow><mn>2</mn><mo>&#8290;</mo><mi>a</mi></mrow></mfrac></mrow>')
            .waitFor();

  // check Speakable Text
  await page.locator("text='X' equals the fraction minus 'B' plus or minus the square root of 'B' squared minus 4 'A' 'C'. End square root over 2 'A'. End fraction.")
            .waitFor();

  // select denominator
  await page.locator('math-field').press('Shift+ArrowLeft');
  await page.locator('math-field').press('Shift+ArrowLeft');

  // check selection latex
  await page.locator('#selection >> text=2a').waitFor();

  // replace only selection
  await page.locator('math-field').type('2*z');

  // check updated latex
  await page.locator(String.raw`text=x=\frac{-b\pm\sqrt{b^2-4\mathrm{ac}}}{2\cdot z}`).waitFor();

});


test('default space bar', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  await page.locator('#mf-1').type('1/y +x');

  // check that space bar navigated out of denominator of fraction
  const latex = await page.locator('#mf-1').evaluate( (mfe: MathfieldElement) => {
    return mfe.value;
  });

  expect(latex).toBe('\\frac{1}{y}+x');
});


test('custom mathModeSpace', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  await page.locator('#mf-3').type('1/y +x');

  // check that space was inserted
  const latex = await page.locator('#mf-3').evaluate( (mfe: MathfieldElement) => {
    return mfe.value;
  });

  expect(latex).toBe('\\frac{1}{y\\:+x}');
});


test('tab focus', async ({ page }) => {
  // For this one, need to be careful to not use locator.press or locator.type to prevent 
  // playwright from managing focus

  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  // focus first math field by clicking it then type
  await page.locator('#mf-1').click();
  await page.keyboard.type('a');  // type directly to page so that Playwright doesn't manage focus

  // Tab to next math field and type
  await page.keyboard.press('Tab'); // tab directly to page so that Playwright doesn't manage focus
  await page.keyboard.type('b');

  // make sure second math field is focused
  await expect(page.locator('#mf-2')).toBeFocused();

  // Tab to next math field and type
  await page.keyboard.press('Tab');
  await page.keyboard.type('c');

  // Tab to next math field and type (this one is readonly, won't change anything)
  await page.keyboard.press('Tab');
  await page.keyboard.type('d');

  // make sure readonly mathfield has focus
  await expect(page.locator('#mf-4')).toBeFocused();

  // Shift-Tab twice to get back to second math field and type 
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.type('e');

  // check contents of all of the math fields
  expect(await page.locator('#mf-1').evaluate( (e: MathfieldElement) => e.value)).toBe('a');
  expect(await page.locator('#mf-2').evaluate( (e: MathfieldElement) => e.value)).toBe('be');
  expect(await page.locator('#mf-3').evaluate( (e: MathfieldElement) => e.value)).toBe('c');

});


test('smartSuperscript', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  await page.locator('#mf-1').type('y^3+z'); // smartSuperscript=true
  await page.locator('#mf-3').type('y^3+z'); // smartSuperscript=false

  // check results
  expect(await page.locator('#mf-1').evaluate( (e: MathfieldElement) => e.value))
    .toBe('y^3+z');
  expect(await page.locator('#mf-3').evaluate( (e: MathfieldElement) => e.value))
    .toBe('y^{3+z}');
});


test('cannot edit readonly mathfield', async ({ page}) => {
  await page.goto('http://127.0.0.1:8000/dist/playwright-test-page/');

  // focus readonly mathfield
  await page.locator('#mf-4').focus();

  // make sure readonly mathfield can receive focus
  await expect(page.locator('#mf-4')).toBeFocused();

  // check initial latex
  expect(await page.locator('#mf-4').evaluate( (e: MathfieldElement) => e.value))
    .toBe('x=\\frac{3}{4}');

  // attempt to type into readonly mathfiled
  await page.locator('#mf-4').type('abc');

  // check that latex has not changed
  expect(await page.locator('#mf-4').evaluate( (e: MathfieldElement) => e.value))
    .toBe('x=\\frac{3}{4}');

});