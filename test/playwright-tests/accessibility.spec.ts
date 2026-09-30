import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

async function addMarkup(page: Page, html: string): Promise<void> {
  await page.evaluate((html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.append(div);
  }, html);
}

// The focusable element of a mathfield is the keyboard sink, a
// `role=textbox` in the shadow DOM. It must have an accessible name.
const sink = (page: Page, id: string) =>
  page.locator(`#${id} .ML__keyboard-sink`);

test('keyboard sink is named by the host aria-label', async ({ page }) => {
  await addMarkup(
    page,
    '<math-field id="a11y-1" aria-label="Your answer"></math-field>'
  );
  await expect(sink(page, 'a11y-1')).toHaveAccessibleName('Your answer');
  await expect(
    page.getByRole('textbox', { name: 'Your answer', exact: true })
  ).toHaveCount(1);
});

test('keyboard sink is named when created with the constructor', async ({
  page,
}) => {
  await page.evaluate(() => {
    const mf = new (window as any).MathfieldElement();
    mf.id = 'a11y-2';
    mf.setAttribute('aria-label', 'Your answer');
    mf.setAttribute('math-virtual-keyboard-policy', 'manual');
    document.body.append(mf);
  });
  await expect(sink(page, 'a11y-2')).toHaveAccessibleName('Your answer');
});

test('keyboard sink name follows aria-label changes', async ({ page }) => {
  await addMarkup(
    page,
    '<math-field id="a11y-3" aria-label="First"></math-field>'
  );
  await page
    .locator('#a11y-3')
    .evaluate((mf) => mf.setAttribute('aria-label', 'Second'));
  await expect(sink(page, 'a11y-3')).toHaveAccessibleName('Second');
});

test('keyboard sink is named by aria-labelledby', async ({ page }) => {
  await addMarkup(
    page,
    '<span id="a11y-4-label">Area of the circle</span><math-field id="a11y-4" aria-labelledby="a11y-4-label"></math-field>'
  );
  await expect(sink(page, 'a11y-4')).toHaveAccessibleName('Area of the circle');
});

test('keyboard sink is named by a <label>', async ({ page }) => {
  await addMarkup(
    page,
    '<label for="a11y-5">Question 1</label><math-field id="a11y-5">x</math-field>' +
      '<label>Question 2 <math-field id="a11y-6">y</math-field></label>'
  );
  await expect(sink(page, 'a11y-5')).toHaveAccessibleName('Question 1');
  await expect(sink(page, 'a11y-6')).toHaveAccessibleName('Question 2');
});

test('keyboard sink is named by the host title', async ({ page }) => {
  await addMarkup(
    page,
    '<math-field id="a11y-10" title="Your answer"></math-field>'
  );
  await expect(sink(page, 'a11y-10')).toHaveAccessibleName('Your answer');
});

// The read-only state is on the keyboard sink and not on the host: the host
// has the `group` role, which does not support `aria-readonly`.
test('keyboard sink is read-only when the mathfield is read-only', async ({
  page,
}) => {
  await addMarkup(
    page,
    '<math-field id="a11y-13" read-only>x</math-field>' +
      '<math-field id="a11y-14" readonly>x</math-field>' +
      '<math-field id="a11y-15">x</math-field>'
  );
  for (const id of ['a11y-13', 'a11y-14']) {
    await expect(sink(page, id)).toHaveAttribute('aria-readonly', 'true');
    await expect(page.locator(`#${id}`)).not.toHaveAttribute('aria-readonly');
  }
  await expect(sink(page, 'a11y-15')).not.toHaveAttribute('aria-readonly');
});

test('keyboard sink read-only state follows the mathfield', async ({
  page,
}) => {
  await addMarkup(page, '<math-field id="a11y-16">x</math-field>');
  const mf = page.locator('#a11y-16');

  // The `readOnly` property
  await mf.evaluate((mf: any) => (mf.readOnly = true));
  await expect(sink(page, 'a11y-16')).toHaveAttribute('aria-readonly', 'true');
  await mf.evaluate((mf: any) => (mf.readOnly = false));
  await expect(sink(page, 'a11y-16')).not.toHaveAttribute('aria-readonly');

  // The `readonly` property
  await mf.evaluate((mf: any) => (mf.readonly = true));
  await expect(sink(page, 'a11y-16')).toHaveAttribute('aria-readonly', 'true');
  await expect(mf).not.toHaveAttribute('aria-readonly');
  await mf.evaluate((mf: any) => (mf.readonly = false));
  await expect(sink(page, 'a11y-16')).not.toHaveAttribute('aria-readonly');

  // The `readonly` attribute
  await mf.evaluate((mf) => mf.setAttribute('readonly', ''));
  await expect(sink(page, 'a11y-16')).toHaveAttribute('aria-readonly', 'true');
  await mf.evaluate((mf) => mf.removeAttribute('readonly'));
  await expect(sink(page, 'a11y-16')).not.toHaveAttribute('aria-readonly');
});

test('keyboard sink is not read-only when the mathfield has editable prompts', async ({
  page,
}) => {
  // A read-only mathfield with editable prompts accepts input in the prompts
  await addMarkup(
    page,
    '<math-field id="a11y-17" readonly>x=\\placeholder[answer]{}</math-field>' +
      '<math-field id="a11y-18" readonly>x</math-field>'
  );
  await expect(sink(page, 'a11y-17')).not.toHaveAttribute('aria-readonly');

  // Prompts added after the mathfield was created are detected on focus
  await expect(sink(page, 'a11y-18')).toHaveAttribute('aria-readonly', 'true');
  await page.locator('#a11y-18').evaluate((mf: any) => {
    mf.value = 'y=\\placeholder[answer]{}';
    mf.focus();
  });
  await expect(sink(page, 'a11y-18')).not.toHaveAttribute('aria-readonly');
});

test('keyboard sink has a default name', async ({ page }) => {
  await expect(sink(page, 'mf-1')).toHaveAccessibleName('math input field');
});

test('keyboard sink name includes the content after a focus', async ({
  page,
}) => {
  await addMarkup(
    page,
    '<math-field id="a11y-7" aria-label="Your answer">x</math-field>'
  );
  await page.locator('#a11y-7').evaluate((mf: HTMLElement) => mf.focus());
  // The spoken form of the content is appended to the name
  await expect(sink(page, 'a11y-7')).toHaveAccessibleName(/^Your answer: \S/);
});

// The host role and name are set with ElementInternals, which can't be read
// from the DOM: read the platform accessibility tree with the Chrome
// DevTools Protocol (Chromium only).
async function hostAXNode(
  page: Page,
  selector: string
): Promise<{ role?: string; name?: string }> {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector,
  });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    nodeId,
    fetchRelatives: false,
  });
  return { role: nodes[0].role?.value, name: nodes[0].name?.value };
}

test('host role does not have presentational children', async ({
  page,
  browserName,
}) => {
  // The mathfield contains focusable controls (the keyboard sink), so its
  // role must not be one whose children are presentational, such as `math`.
  test.skip(browserName !== 'chromium', 'Uses the Chrome DevTools Protocol');
  await addMarkup(
    page,
    '<math-field id="a11y-8" aria-label="Your answer"></math-field>'
  );
  await expect(sink(page, 'a11y-8')).toHaveAccessibleName('Your answer');
  const host = await hostAXNode(page, '#a11y-8');
  expect(host.role).not.toBe('math');
  expect(host.role).toBe('group');
  expect(host.name).toBe('Your answer');
});

test('host and keyboard sink have the same name', async ({
  page,
  browserName,
}) => {
  // The host has no default `aria-label`: a default would take precedence
  // over a `<label>`, and the host would be named "math input field" while
  // the keyboard sink is named by the `<label>`.
  test.skip(browserName !== 'chromium', 'Uses the Chrome DevTools Protocol');
  await addMarkup(
    page,
    '<label for="a11y-11">Question 1</label><math-field id="a11y-11"></math-field>' +
      '<math-field id="a11y-12"></math-field>'
  );
  await expect(sink(page, 'a11y-11')).toHaveAccessibleName('Question 1');
  expect((await hostAXNode(page, '#a11y-11')).name).toBe('Question 1');

  // Without an author-supplied name, the host is an unnamed group and only
  // the keyboard sink has the default name.
  await expect(sink(page, 'a11y-12')).toHaveAccessibleName('math input field');
  expect((await hostAXNode(page, '#a11y-12')).name ?? '').toBe('');
});

test('Tab moves into and out of a labelled mathfield', async ({ page }) => {
  await addMarkup(
    page,
    '<button id="a11y-before">Before</button><math-field id="a11y-9" aria-label="Your answer"></math-field><button id="a11y-after">After</button>'
  );
  await page.locator('#a11y-before').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.type('x+1');
  await expect(page.locator('#a11y-9')).toBeFocused();
  expect(await page.locator('#a11y-9').evaluate((mf: any) => mf.value)).toBe(
    'x+1'
  );
  await page.keyboard.press('Tab');
  // Focus leaves the mathfield (where it goes depends on the rest of the page)
  await expect(page.locator('#a11y-9')).not.toBeFocused();
});
