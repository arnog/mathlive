import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

test('default space bar', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('1/y +x');

  // check that space bar navigated out of denominator of fraction
  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe('\\frac{1}{y}+x');
});

test('custom mathModeSpace', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-3').pressSequentially('1/y +x');

  // check that space was inserted
  const latex = await page
    .locator('#mf-3')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  expect(latex).toBe('\\frac{1}{y\\:+x}');
});

test('tab focus', async ({ page }) => {
  // For this one, need to be careful to not use locator.press or locator.type to prevent
  // playwright from managing focus

  await page.goto('/dist/playwright-test-page/');

  // focus first math field by clicking it then type
  await page.locator('#mf-1').click();
  await page.keyboard.type('a'); // type directly to page so that Playwright doesn't manage focus

  // Tab to next math field and type
  await tab(page);
  await page.keyboard.type('b');

  // make sure second math field is focused
  await expect(page.locator('#mf-2')).toBeFocused();

  // Tab to next math field and type
  await tab(page);
  await page.keyboard.type('c');

  // Tab to next math field and type (this one is readonly, won't change anything)
  await tab(page);
  await page.keyboard.type('d');

  // make sure readonly mathfield has focus
  await expect(page.locator('#mf-4')).toBeFocused();

  // Shift-Tab three times to get back to second math field and type
  // 1/ go back to end of mf#3
  await shiftTab(page);
  // 2/ go to start of mf#3
  await shiftTab(page);
  // 3/ go to mf#2
  await shiftTab(page);
  await page.keyboard.type('e');

  // check contents of all of the math fields
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe('a');
  expect(
    await page.locator('#mf-2').evaluate((e: MathfieldElement) => e.value)
  ).toBe('be');
  expect(
    await page.locator('#mf-3').evaluate((e: MathfieldElement) => e.value)
  ).toBe('c');
});

test('smartSuperscript', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('y^3+z'); // smartSuperscript=true

  await page.waitForTimeout(100);

  await page.locator('#mf-3').pressSequentially('y^3+z'); // smartSuperscript=false

  // check results
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe('y^3+z');
  expect(
    await page.locator('#mf-3').evaluate((e: MathfieldElement) => e.value)
  ).toBe('y^{3+z}');
});

test('cannot edit readonly mathfield', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // focus readonly mathfield
  await page.locator('#mf-4').focus();

  // make sure readonly mathfield can receive focus
  await expect(page.locator('#mf-4')).toBeFocused();

  // check initial latex
  expect(
    await page.locator('#mf-4').evaluate((e: MathfieldElement) => e.value)
  ).toBe('x=\\frac{3}{4}');

  // attempt to type into readonly mathfiled
  await page.locator('#mf-4').pressSequentially('abc');

  // check that latex has not changed
  expect(
    await page.locator('#mf-4').evaluate((e: MathfieldElement) => e.value)
  ).toBe('x=\\frac{3}{4}');
});

test('escape to enter/exit latex mode', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').press('Escape');
  await page.locator('#mf-1').pressSequentially('\\frac');
  await page.locator('#mf-1').press('Escape');
  // full fraction will be selected, navigate back to numerator
  await page.locator('#mf-1').press('ArrowLeft');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially('x');
  await page.locator('#mf-1').press('ArrowDown');
  await page.locator('#mf-1').pressSequentially('y');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe('\\frac{x}{y}');

  // attempt to use latex mode for math field with latex mode disabled
  // using instructions from: mathfield/guides/customizing/#turning-off-the-latex-mode
  await page.locator('#mf-5').press('Escape');
  await page.locator('#mf-5').pressSequentially('lozenge');
  await page.locator('#mf-5').press('Escape');

  // check latex of result
  expect(
    await page.locator('#mf-5').evaluate((e: MathfieldElement) => e.value)
  ).toBe('lozenge');
});

test('backslash to enter, enter to exit latex mode', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('\\frac');
  await page.locator('#mf-1').press('Enter');
  await page.locator('#mf-1').pressSequentially('x');
  await page.locator('#mf-1').press('ArrowDown');
  await page.locator('#mf-1').pressSequentially('y');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe('\\frac{x}{y}');

  // attempt to use latex mode for math field with latex mode disabled
  // using instructions from: mathfield/guides/customizing/#turning-off-the-latex-mode
  await page.locator('#mf-5').pressSequentially('\\lozenge');
  await page.locator('#mf-5').press('Enter');

  // check latex of result
  expect(
    await page.locator('#mf-5').evaluate((e: MathfieldElement) => e.value)
  ).toBe('\\backslash lozenge');
});

test('Select all/type to replace selection', async ({ page, browserName }) => {
  const modifierKey = /Mac|iPod|iPhone|iPad/.test(
    await page.evaluate(() => navigator.platform)
  )
    ? 'Meta'
    : 'Control';

  let selectAllCommand = `${modifierKey}+a`;
  if (modifierKey === 'Meta' && browserName === 'chromium') {
    // Cmd-a not working with Chromium on Mac, need to use Control-A
    // Cmd-a works correctly on Chrome and Edge on Mac
    selectAllCommand = 'Control+a';
  }

  await page.goto('/dist/playwright-test-page/');

  // add some content to the first math field
  await page.locator('#mf-1').pressSequentially('x+y=20');

  await page.locator('#mf-1').press(selectAllCommand);

  // check the contents of the selection
  let selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('x+y=20');

  // type to replace selection
  await page.locator('#mf-1').pressSequentially('30=r+t');

  // make sure math field contents were replaced
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('30=r+t');

  // select rhs
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');

  selectionLatex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('r+t');

  // type to replace rhs only
  await page.locator('#mf-1').pressSequentially('z+y');
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('30=z+y');
});

test('readonly selectable', async ({ page, browserName }) => {
  const modifierKey = /Mac|iPod|iPhone|iPad/.test(
    await page.evaluate(() => navigator.platform)
  )
    ? 'Meta'
    : 'Control';

  let selectAllCommand = `${modifierKey}+a`;
  if (modifierKey === 'Meta' && browserName === 'chromium') {
    // Cmd-a not working with Chromium on Mac, need to use Control-A
    // Cmd-a works correctly on Chrome and Edge on Mac
    selectAllCommand = 'Control+a';
  }

  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-4').press(selectAllCommand);

  // check contents of selection
  const selectionLatex = await page
    .locator('#mf-4')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.getValue(mfe.selection, 'latex');
    });
  expect(selectionLatex).toBe('x=\\frac{3}{4}');
});

test('test up/down arrow fraction navigation', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('x/y');
  await page.locator('#mf-1').press('ArrowUp');
  await page.locator('#mf-1').pressSequentially('+1');
  await page.locator('#mf-1').press('ArrowDown');
  await page.locator('#mf-1').pressSequentially('+2');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe('\\frac{x+1}{y+2}');
});

test('test inline shortcuts', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('+-grad*alpha+tanx-20>=40');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\pm\nabla\cdot\alpha+\tan x-20\ge40`);
});

test('underscore subscript', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('x_y -y_s'); // space to exit subscript
  await page.locator('#mf-1').press('ArrowRight'); // right arrow to exit subscript
  await page.locator('#mf-1').pressSequentially('+z_rt +20'); // double char subscript

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`x_{y}-y_{s}+z_{rt}+20`);
});

test('subscript and superscript', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page
    .locator('#mf-1')
    .pressSequentially('x_y ^h +y_rr ^a +z_1 ^aa + s_11 ^bb +30+x^h _s -40');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`x_{y}^{h}+y_{rr}^{a}+z_1^{aa}+s_{11}^{bb}+30+x_{s}^{h}-40`);
});

test('nested paranthesis', async ({ page }) => {
  // test both typing right parenthesis and using auto right paranthesis
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('(((x+y)-r -1');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially('+30');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\left(\left(\left(x+y\right)-r\right)-1\right)+30`);
});

test('sqrt inline shortcut (#1975)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('sqrt22');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially('=x');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\sqrt{22}=x`);
});

test('inline shortcut after long expression (#1978)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  const startingLatex = String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`;

  await page
    .locator('#mf-1')
    .evaluate(
      (e: MathfieldElement, latex: string) => (e.value = latex),
      startingLatex
    );

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('+alpha');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}+\alpha`);
});

test('inline shortcut after inserting a fraction (#2899)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('sin');
  await page.locator('#mf-1').press('/');
  await page.locator('#mf-1').press('c');
  await page.locator('#mf-1').press('o');
  await page.locator('#mf-1').press('s');

  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\sin\frac{\cos}{\placeholder{}}`);
});

test('keyboard select than divide (#1981)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('x+y');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').pressSequentially('/2');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\frac{x+y}{2}`);
});

test('slash on selected subscript (#2521)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('d_0');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('Shift+ArrowLeft');
  await page.locator('#mf-1').press('/');

  const latex = await page
    .locator('#mf-1')
    .evaluate((e: MathfieldElement) => e.value);

  expect(latex).toBe(String.raw`\frac{d_0}{\placeholder{}}`);
});

test('text mode serialization (#1978)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('x+y');
  await page.locator('#mf-1').press(`Shift+'`);
  await page.locator('#mf-1').pressSequentially(' Comment ');
  await page.locator('#mf-1').press(`Shift+'`);
  await page.locator('#mf-1').pressSequentially('z-s');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`x+y\text{ Comment }z-s`);
});

test('cross-origin iframe with physical keyboard', async ({
  page,
  context,
}) => {
  await page.goto('/dist/playwright-test-page/iframe_test.html');

  const frame = page.frame('mathlive-iframe-cross-origin');

  expect(frame).toBeTruthy();

  if (frame) {
    // type with physical keyboard
    await frame.locator('#mf-1').pressSequentially('x/20+z');

    // check resulting latex
    let latex = await frame
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(latex).toBe(String.raw`\frac{x}{20+z}`);
  }
});

test('keyboard shortcuts with placeholders (#2291, #2293, #2294)', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  // use latex mode for math field with default settings
  await page.locator('#mf-1').pressSequentially('/f*g');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').press('a');
  await page.locator('#mf-1').press('ArrowRight');
  await page.locator('#mf-1').pressSequentially('*x');

  // check latex of result
  expect(
    await page.locator('#mf-1').evaluate((e: MathfieldElement) => e.value)
  ).toBe(String.raw`\frac{f\cdot g}{a}\cdot x`);
});

test('keyboard cut and paste', async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit' && Boolean(process.env.CI),
    'Keyboard paste does not work when headless on Linux (works when run with gui on Linux or headless/gui on MacOs)'
  );

  const modifierKey = /Mac|iPod|iPhone|iPad/.test(
    await page.evaluate(() => navigator.platform)
  )
    ? 'Meta'
    : 'Control';

  let selectAllCommand = `${modifierKey}+a`;
  if (modifierKey === 'Meta' && browserName === 'chromium') {
    // Cmd-a not working with Chromium on Mac, need to use Control-A
    // Cmd-a works correctly on Chrome and Edge on Mac
    selectAllCommand = 'Control+a';
  }

  await page.goto('/dist/playwright-test-page/');

  await page.locator('#mf-1').pressSequentially('30=r+t');

  // check initial contents
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('30=r+t');

  // select all and cut
  await page.locator('#mf-1').press(selectAllCommand);
  await page.locator('#mf-1').press(`${modifierKey}+x`);

  // should be empty after cut
  expect(
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value)
  ).toBe('');

  // paste contents back
  await page.locator('#mf-1').press(`${modifierKey}+v`);

  // initial contents should now be there
  expect(
    await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value.trim())
  ).toBe('30=r+t');
});

test('mathbb with superscript (issue #2867)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Type \mathbb{R}^0 using physical keyboard
  await page.locator('#mf-1').pressSequentially('\\mathbb{R}^0');
  await page.locator('#mf-1').press('Enter');

  // Get the serialized LaTeX value
  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  // Should serialize as \mathbb{R}^0, not \mathbb{R^0}
  expect(latex).toBe('\\mathbb{R}^0');
});

test('backspace on empty displaylines (issue #2739)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Type "a", press Cmd+Enter (or Ctrl+Enter), type "b"
  await page.locator('#mf-1').pressSequentially('a');
  await page.locator('#mf-1').press(
    process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter'
  );
  await page.locator('#mf-1').pressSequentially('b');

  // Select all and delete
  await page.locator('#mf-1').press(
    process.platform === 'darwin' ? 'Meta+a' : 'Control+a'
  );
  await page.locator('#mf-1').press('Backspace');

  // Press Backspace again on empty displaylines - this should not throw an error
  await page.locator('#mf-1').press('Backspace');

  // The field should either be empty or just have the displaylines structure
  // The important thing is that no error was thrown during the backspace operations
  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  // Accept either empty string, empty displaylines, or displaylines with just whitespace
  expect(['', '\\displaylines{}', '\\displaylines{\\\\ }']).toContain(latex);
});

test('delete range with sqrt - all content (issue #2686)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Test deleting a range that includes all sqrt content
  const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value = '\\sqrt{abc}+x';
    // Select all content inside sqrt by setting selection programmatically
    // The selection should be from the first atom inside sqrt to the last
    mfe.selection = { ranges: [[1, 4]] }; // Select "abc" inside the sqrt
    // Delete the selection
    mfe.executeCommand('deleteBackward');
    return mfe.value;
  });

  // When all content of sqrt is deleted, the sqrt should be removed
  expect(result).toBe('+x');
});

test('delete range with empty sqrt after deletion (issue #2686)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Test that when all content in sqrt is deleted, the sqrt is removed
  const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value = '\\sqrt{a}+b';
    // Select just "a" from inside the sqrt - this should leave sqrt empty
    mfe.selection = { ranges: [[1, 2]] };
    mfe.executeCommand('deleteBackward');
    return mfe.value;
  });

  // After deleting "a", sqrt should be removed (empty), leaving just "+b"
  expect(result).toBe('+b');
});

test('delete range crossing sqrt boundary - hoist remaining content (issue #2686)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Test the scenario: 1√23 -> select "1" and "2" -> delete -> should get "3"
  const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value = '1\\sqrt{23}';
    // Debug: let's see the positions
    // Position 0: before "1"
    // Position 1: after "1"
    // Position 2: inside sqrt, before "2"
    // Position 3: inside sqrt, between "2" and "3"
    // Position 4: inside sqrt, after "3"
    mfe.selection = { ranges: [[0, 3]] }; // Select "1" and "2"
    mfe.executeCommand('deleteBackward');
    return mfe.value;
  });

  // After deleting "1" and "2", should hoist the "3" that remains in sqrt
  expect(result).toBe('3');
});

test('typing characters in placeholder (issue #2572)', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Test: Typing in placeholder should replace it and not cause characters to disappear
  await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
    mfe.value = '\\placeholder{}';
    // Select the placeholder (position 0 to 1)
    mfe.selection = { ranges: [[0, 1]] };
  });

  // Type characters - they should replace the placeholder and be inserted correctly
  await page.locator('#mf-1').pressSequentially('x+y');

  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => mfe.value);

  // Should produce the typed content, not lose characters
  expect(latex).toBe('x+y');
});


test('nested subscripts - issue #2146', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');

  // Test scenario 1: a_b_ should create a subscript of b
  const field = page.locator('#mf-1');
  await field.press('a');
  await field.press('Shift+Minus');
  await field.press('b');
  await field.press('Shift+Minus');
  await field.press('c');

  let latex = await page
    .locator('#mf-1')
    .evaluate((e: MathfieldElement) => e.value);

  // Should be a_{b_{c}}, not a_{b}c or other variations
  expect(latex).toBe(String.raw`a_{b_{c}}`);

  // Clear for next test
  await page.locator('#mf-1').evaluate((e: MathfieldElement) => {
    e.value = '';
  });

  // Test scenario 2: a^b_ should create a subscript of b, not a
  await field.press('a');
  await field.press('Shift+Digit6'); // caret
  await field.press('b');
  await field.press('Shift+Minus');
  await field.press('c');

  latex = await page
    .locator('#mf-1')
    .evaluate((e: MathfieldElement) => e.value);

  // Should be a^{b_{c}}, not a_{c}^{b} or other variations
  expect(latex).toBe(String.raw`a^{b_{c}}`);
});

test('issue #2733: inline shortcut buffer should flush when field becomes empty', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');

  // Type 'xxxx' which triggers the 'xx' -> '\times' shortcut
  await page.locator('#mf-1').pressSequentially('xxxx');

  // Delete twice with Backspace to make field empty
  await page.locator('#mf-1').press('Backspace');
  await page.locator('#mf-1').press('Backspace');

  // Type 'x' once more
  await page.locator('#mf-1').press('x');

  // Get the latex value
  const latex = await page
    .locator('#mf-1')
    .evaluate((mfe: MathfieldElement) => {
      return mfe.value;
    });

  // Should be just 'x', not 'x\times'
  expect(latex).toBe('x');
});

async function tab(page) {
  await page.keyboard.press('Tab');
  // Wait some time for focus to change
  await page.waitForTimeout(500);
}

async function shiftTab(page) {
  await page.keyboard.press('Shift+Tab');
  // Wait some time for focus to change
  await page.waitForTimeout(500);
}
