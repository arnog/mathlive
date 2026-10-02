import { test, expect } from '@playwright/test';

// Regression tests for #2973: a mathfield removed from the DOM while it had
// focus must not break focusing the next mathfield.

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

test('focusing a mathfield after a focused one was removed does not throw', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const result = await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const first = document.createElement('math-field');
    first.value = 'x^2';
    document.body.appendChild(first);
    first.focus();
    // Let the focus settle: the keyboard sink is focused after a short delay
    await wait(150);
    const firstHadFocus = first.hasFocus();
    // Removed by the app while it has focus. Firefox and WebKit do not
    // blur an element when it is removed from the DOM.
    first.remove();

    const second = document.createElement('math-field');
    second.value = 'y';
    document.body.appendChild(second);
    let error: string | null = null;
    try {
      second.focus();
    } catch (e) {
      error = String(e);
    }
    await wait(150);
    return { firstHadFocus, error, hasFocus: second.hasFocus() };
  });

  expect(result.firstHadFocus).toBe(true);
  expect(result.error).toBeNull();
  expect(result.hasFocus).toBe(true);
  expect(errors).toEqual([]);
});

test('remove on Enter, then add and type in a new mathfield (#2973)', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.evaluate(() => {
    const container = document.createElement('div');
    container.id = 'container-2973';
    const button = document.createElement('button');
    button.id = 'add-2973';
    button.textContent = 'Add';
    document.body.prepend(button, container);

    const create = (id: string) => {
      container.innerHTML = '';
      const mf = document.createElement('math-field');
      mf.id = id;
      mf.value = 'x^2';
      container.appendChild(mf);
      mf.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') container.removeChild(mf);
      });
      setTimeout(() => mf.focus(), 0);
    };
    button.addEventListener('click', () => create('mf-2973-b'));
    create('mf-2973-a');
  });

  // Let the first field settle into focus, then remove it with Enter
  await expect
    .poll(() =>
      page.evaluate(
        () => (document.getElementById('mf-2973-a') as any)?.hasFocus() ?? false
      )
    )
    .toBe(true);
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await expect(page.locator('#mf-2973-a')).toHaveCount(0);

  await page.locator('#add-2973').click();
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(
        () => (document.getElementById('mf-2973-b') as any)?.hasFocus() ?? false
      )
    )
    .toBe(true);
  await page.waitForTimeout(100);
  await page.keyboard.type('+1');

  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => (document.getElementById('mf-2973-b') as any).value
    )
  ).toBe('x^2+1');
});

// Chromium dispatches a `blur` event when a focused element is removed from
// the DOM. Firefox and WebKit do not. The mathfield must dispatch the same
// events in all browsers, so that an application that saves the value in a
// `change` or `blur` listener does not lose the last edit.
test('removing a focused mathfield dispatches change, blur and focusout', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.evaluate(() => {
    const mf = document.createElement('math-field');
    mf.id = 'mf-removed';
    document.body.prepend(mf);
    const log: string[] = [];
    (window as any).removedLog = log;
    for (const type of ['focus', 'change', 'blur', 'focusout'])
      mf.addEventListener(type, () => log.push(type));
    mf.focus();
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (document.getElementById('mf-removed') as any)?.hasFocus() ?? false
      )
    )
    .toBe(true);
  await page.waitForTimeout(100);
  await page.keyboard.type('z');

  const log = await page.evaluate(async () => {
    document.getElementById('mf-removed')!.remove();
    await new Promise((r) => setTimeout(r, 100));
    return (window as any).removedLog;
  });

  expect(log).toEqual(['focus', 'change', 'blur', 'focusout']);
  expect(errors).toEqual([]);
});

test('removing a focused mathfield with no edits does not dispatch change', async ({
  page,
}) => {
  const log = await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const mf = document.createElement('math-field');
    mf.value = 'x^2';
    document.body.prepend(mf);
    const log: string[] = [];
    for (const type of ['focus', 'change', 'blur', 'focusout'])
      mf.addEventListener(type, () => log.push(type));
    mf.focus();
    await wait(150);
    mf.remove();
    await wait(100);
    return log;
  });

  expect(log).toEqual(['focus', 'blur', 'focusout']);
});

test('removing a mathfield that does not have the focus dispatches no event', async ({
  page,
}) => {
  const log = await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const mf = document.createElement('math-field');
    mf.value = 'x^2';
    document.body.prepend(mf);
    const log: string[] = [];
    for (const type of ['focus', 'change', 'blur', 'focusout'])
      mf.addEventListener(type, () => log.push(type));
    await wait(150);
    mf.remove();
    await wait(100);
    return log;
  });

  expect(log).toEqual([]);
});
