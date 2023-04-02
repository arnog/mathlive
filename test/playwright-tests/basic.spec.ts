import { test, expect } from '@playwright/test';


// Tests the following functionality on the smoke test page: 
// Cmd-A select all, latex mode, press Enter to exit latex mode, smartSuperscript,
// +- inline shortcut, down arrow for fraction navigation,
// latex render, MathJson render, MathASCII render, MathML render,
// speakable text render, selection latex, selection replace on type,
// custom onInlineShortcut handler, replace * with \cdot
test('smoke test', async ({ page, browserName }) => {
  const modifierKey = /Mac|iPod|iPhone|iPad/.test(await page.evaluate( () => navigator.platform)) ? "Meta" : "Control";

  let selectAllCommand = `${modifierKey}+a`;
  if (modifierKey === "Meta" && browserName === "chromium") {
    // Cmd-a not working with Chromium on Mac, need to use Control-A
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
  await page.locator('text=value     "2a"').waitFor();

  // replace only selection
  await page.locator('math-field').type('2*z');

  // check updated latex
  await page.locator(String.raw`text=x=\frac{-b\pm\sqrt{b^2-4\mathrm{ac}}}{2\cdot z}`).waitFor();

});


