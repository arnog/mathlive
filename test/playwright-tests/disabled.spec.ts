import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8080/test/smoke/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

test('disabled mathfield should not be focusable', async ({ page }) => {
  // Create a disabled mathfield
  const result = await page.evaluate(() => {
    const mf = document.createElement('math-field');
    mf.id = 'test-disabled';
    mf.disabled = true;
    mf.value = 'x^2';
    document.body.appendChild(mf);

    let focusEventFired = false;
    mf.addEventListener('focus', () => {
      focusEventFired = true;
    });

    // Try to focus
    mf.focus();

    return {
      focusEventFired,
      hasFocus: mf.hasFocus(),
      disabled: mf.disabled,
    };
  });

  expect(result.disabled).toBe(true);
  expect(result.focusEventFired).toBe(false);
  expect(result.hasFocus).toBe(false);
});

test('clicking disabled mathfield should not focus it', async ({ page }) => {
  // Create a disabled mathfield
  await page.evaluate(() => {
    const mf = document.createElement('math-field');
    mf.id = 'test-click-disabled';
    mf.disabled = true;
    mf.value = 'y^2';
    mf.style.width = '200px';
    mf.style.height = '50px';
    document.body.appendChild(mf);
  });

  const mf = page.locator('#test-click-disabled');
  await mf.click();

  const result = await page.evaluate(() => {
    const field = document.getElementById('test-click-disabled') as any;
    return {
      hasFocus: field.hasFocus(),
      disabled: field.disabled,
    };
  });

  expect(result.disabled).toBe(true);
  expect(result.hasFocus).toBe(false);
});

test('disabled mathfield should not accept keyboard input', async ({ page }) => {
  // Create a disabled mathfield
  await page.evaluate(() => {
    const mf = document.createElement('math-field');
    mf.id = 'test-keyboard-disabled';
    mf.disabled = true;
    mf.value = 'z';
    mf.style.width = '200px';
    mf.style.height = '50px';
    document.body.appendChild(mf);
  });

  const mf = page.locator('#test-keyboard-disabled');

  // Try to click and type
  await mf.click();
  await page.keyboard.type('{');
  await page.keyboard.type('/');

  const result = await page.evaluate(() => {
    const field = document.getElementById('test-keyboard-disabled') as any;
    return {
      value: field.value,
      hasFocus: field.hasFocus(),
    };
  });

  // Value should still be 'z', not changed
  expect(result.value).toBe('z');
  expect(result.hasFocus).toBe(false);
});

test('enabling a disabled mathfield should make it focusable again', async ({ page }) => {
  const result = await page.evaluate(() => {
    const mf = document.createElement('math-field');
    mf.id = 'test-toggle-disabled';
    mf.disabled = true;
    mf.value = 'a^2';
    document.body.appendChild(mf);

    // Try to focus while disabled
    mf.focus();
    const focusedWhileDisabled = mf.hasFocus();

    // Enable and try to focus
    mf.disabled = false;
    mf.focus();
    const focusedWhileEnabled = mf.hasFocus();

    return {
      focusedWhileDisabled,
      focusedWhileEnabled,
    };
  });

  expect(result.focusedWhileDisabled).toBe(false);
  expect(result.focusedWhileEnabled).toBe(true);
});

test('disabled mathfield should not trigger focus event on click', async ({ page }) => {
  const result = await page.evaluate(() => {
    return new Promise((resolve) => {
      const mf = document.createElement('math-field');
      mf.id = 'test-focus-event';
      mf.disabled = true;
      mf.value = 'b^2';
      mf.style.width = '200px';
      mf.style.height = '50px';
      document.body.appendChild(mf);

      let focusEventCount = 0;
      mf.addEventListener('focus', () => {
        focusEventCount++;
      });

      // Simulate click
      mf.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      mf.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      mf.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Give it time for any async focus to happen
      setTimeout(() => {
        resolve({
          focusEventCount,
          hasFocus: mf.hasFocus(),
        });
      }, 100);
    });
  });

  expect(result.focusEventCount).toBe(0);
  expect(result.hasFocus).toBe(false);
});
