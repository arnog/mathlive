import { test, expect, Page } from '@playwright/test';

// A blur arms "restore the focus when the window regains it" with `focusin`
// and `click` listeners on the document. Those listeners keep the mathfield
// alive, so they must go away once the restore is cancelled or the mathfield
// is removed.

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });

  // Track the `focusin` and `click` listeners added to the document. One is
  // armed until its signal aborts, or until it has run if it is `once`.
  await page.evaluate(() => {
    const tracked: { once: boolean; ran: boolean; signal?: AbortSignal }[] = [];
    const add = EventTarget.prototype.addEventListener;
    document.addEventListener = function (type: string, listener, options) {
      if ((type !== 'focusin' && type !== 'click') || !listener)
        return add.call(this, type, listener, options);
      const entry = {
        once: typeof options === 'object' && !!options?.once,
        ran: false,
        signal: typeof options === 'object' ? options?.signal : undefined,
      };
      tracked.push(entry);
      return add.call(
        this,
        type,
        function (this: Document, event: Event) {
          entry.ran = true;
          if (typeof listener === 'function') listener.call(this, event);
          else listener.handleEvent(event);
        },
        options
      );
    };
    (window as any).armedListeners = () =>
      tracked.filter((x) => !(x.once && x.ran) && !x.signal?.aborted).length;
  });
});

const armedListeners = (page: Page) =>
  page.evaluate(() => (window as any).armedListeners() as number);

test('moving the focus through mathfields leaves one restore armed', async ({
  page,
}) => {
  await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const fields: HTMLElement[] = [];
    for (let i = 0; i < 5; i += 1) {
      const mf = document.createElement('math-field');
      mf.className = 'blur-listeners';
      // On a touch device, a visible virtual keyboard ignores the blur
      (mf as any).mathVirtualKeyboardPolicy = 'manual';
      document.body.appendChild(mf);
      fields.push(mf);
      mf.focus();
      // Let the focus settle: the keyboard sink is focused after a short delay
      await wait(150);
    }
    fields[fields.length - 1].blur();
  });
  // Each focus cancelled the restore of the field before it: only the last
  // blur is armed, with a `focusin` and a `click` listener
  expect(await armedListeners(page)).toBe(2);

  // Removing the mathfields cancels it
  await page.evaluate(() => {
    document.querySelectorAll('.blur-listeners').forEach((mf) => mf.remove());
  });
  expect(await armedListeners(page)).toBe(0);
});

test('a click cancels the restore', async ({ page }) => {
  await page.evaluate(async () => {
    const mf = document.createElement('math-field');
    document.body.appendChild(mf);
    mf.focus();
    await new Promise((r) => setTimeout(r, 150));
    mf.blur();
  });
  expect(await armedListeners(page)).toBe(2);
  await page.evaluate(() => document.body.click());
  expect(await armedListeners(page)).toBe(0);
});

// Chromium blurs a focused element when it is removed, Firefox and WebKit do
// not: in both cases the blur arms a restore that the removal must cancel
test('removing a focused mathfield leaves no restore armed', async ({
  page,
}) => {
  await page.evaluate(async () => {
    const mf = document.createElement('math-field');
    document.body.appendChild(mf);
    mf.focus();
    await new Promise((r) => setTimeout(r, 150));
    mf.remove();
  });
  expect(await armedListeners(page)).toBe(0);
});

// When no `focusin` or `click` reaches the document between two blurs, the
// second blur must replace the restore armed by the first
test('blurring a mathfield again replaces its restore', async ({ page }) => {
  await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    window.addEventListener('focusin', (evt) => evt.stopPropagation(), {
      capture: true,
    });
    const mf = document.createElement('math-field');
    mf.className = 'blur-listeners';
    document.body.appendChild(mf);
    for (let i = 0; i < 3; i += 1) {
      mf.focus();
      await wait(150);
      mf.blur();
    }
  });
  expect(await armedListeners(page)).toBe(2);
  await page.evaluate(() =>
    document.querySelector('.blur-listeners')!.remove()
  );
  expect(await armedListeners(page)).toBe(0);
});
