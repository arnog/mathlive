import { test, expect, type Frame, type Page } from '@playwright/test';
import type { MathfieldElement } from '../../src/public/mathfield-element';

const MESSAGE_TYPE = 'mathlive#virtual-keyboard-message';

async function focusMathfield(context: Page | Frame) {
  await context.locator('#mf-1').focus();
  // Focusing connects the message listener after a short delay. Wait for the
  // connection so rejection tests cannot pass just because nothing is listening.
  await context.waitForFunction(
    () =>
      (document.getElementById('mf-1') as any)?._mathfield
        ?.connectedToVirtualKeyboard
  );
}

async function addSender(page: Page, opaque = false): Promise<Frame> {
  const url = 'http://127.0.0.1:9030/keyboard-security-sender';
  await page.route(url, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><p>Sender</p>',
    })
  );
  await page.evaluate(
    ({ url, opaque }) =>
      new Promise<void>((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.name = 'security-sender';
        if (opaque) iframe.sandbox.add('allow-scripts');
        iframe.onload = () => resolve();
        iframe.src = url;
        document.body.append(iframe);
      }),
    { url, opaque }
  );
  return page.frame('security-sender')!;
}

// The acknowledgement ensures the receiver has processed all preceding messages
// from this sender before assertions, including messages it silently ignores.
async function sendMessages(
  receiver: Page | Frame,
  sender: Frame,
  messages: object[]
) {
  await receiver.evaluate(() => {
    window.addEventListener('message', function barrier(event) {
      if (event.data !== 'keyboard-security-barrier') return;
      window.removeEventListener('message', barrier);
      (event.source as Window).postMessage('keyboard-security-ack', '*');
    });
  });
  const receiverName = 'name' in receiver ? receiver.name() : '';
  await sender.evaluate(
    ({ messages, receiverName }) =>
      new Promise<void>((resolve) => {
        const target = receiverName
          ? window.top!.frames[receiverName]
          : window.top!;
        window.addEventListener('message', function ack(event) {
          if (event.data !== 'keyboard-security-ack') return;
          window.removeEventListener('message', ack);
          resolve();
        });
        for (const message of messages) target.postMessage(message, '*');
        target.postMessage('keyboard-security-barrier', '*');
      }),
    { messages, receiverName }
  );
}

for (const opaque of [false, true]) {
  test(`rejects ${opaque ? 'opaque' : 'cross-origin'} keyboard control by default`, async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const sender = await addSender(page, opaque);
    await sendMessages(page, sender, [
      { type: MESSAGE_TYPE, action: 'connect' },
      { type: MESSAGE_TYPE, action: 'update-setting', layouts: ['minimalist'] },
      { type: MESSAGE_TYPE, action: 'show', animate: false },
    ]);
    expect(await page.evaluate(() => window.mathVirtualKeyboard.visible)).toBe(
      false
    );
    expect(
      await page.evaluate(() => window.mathVirtualKeyboard.layouts)
    ).toEqual(['default']);
  });
}

const marker = '<b data-keyboard-untrusted>Untrusted layout</b>';
for (const [name, setting] of Object.entries({
  'markup': { layouts: [{ label: 'test', layers: [{ markup: marker }] }] },
  'layout label': { layouts: [{ label: marker, rows: [['a']] }, 'numeric'] },
  'keycap label': { layouts: [{ rows: [[{ label: marker }]] }] },
  'keycap override': { setKeycap: { keycap: '[0]', value: { label: marker } } },
})) {
  test(`rejects cross-origin HTML in ${name} even with origin checks disabled`, async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const originalLayouts = await page.evaluate(() => {
      window.mathVirtualKeyboard.originValidator = 'none';
      window.mathVirtualKeyboard.show({ animate: false });
      return window.mathVirtualKeyboard.layouts;
    });
    const sender = await addSender(page);
    await sendMessages(page, sender, [
      { type: MESSAGE_TYPE, action: 'update-setting', ...setting },
      { type: MESSAGE_TYPE, action: 'show', animate: false },
    ]);
    await expect(page.locator('[data-keyboard-untrusted]')).toHaveCount(0);
    expect(
      await page.evaluate(() => window.mathVirtualKeyboard.layouts)
    ).toEqual(originalLayouts);
  });
}

test('rejects the reported update-setting then show sequence from a sibling frame', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');
  await page.evaluate(() => {
    window.mathVirtualKeyboard.originValidator = 'none';
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.name = 'reported-sequence-sender';
        iframe.onload = () => resolve();
        iframe.srcdoc = '<p>Sender</p>';
        document.body.append(iframe);
      })
  );
  const sender = page.frame('reported-sequence-sender')!;
  await sendMessages(page, sender, [
    {
      type: MESSAGE_TYPE,
      action: 'update-setting',
      layouts: [{ label: 'test', layers: [{ markup: marker }] }],
    },
    { type: MESSAGE_TYPE, action: 'show', animate: false },
  ]);
  await expect(page.locator('[data-keyboard-untrusted]')).toHaveCount(0);
  expect(await page.evaluate(() => window.mathVirtualKeyboard.visible)).toBe(
    false
  );
  expect(
    await page.evaluate(() => window.mathVirtualKeyboard.layouts)
  ).toEqual(['default']);
});

test('a sibling frame cannot send commands to the focused top-level mathfield', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');
  // Use a same-origin sibling to test the source check independently of origin.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.name = 'sibling';
        iframe.onload = () => resolve();
        iframe.srcdoc = '<p>Sibling</p>';
        document.body.append(iframe);
      })
  );
  const sender = page.frame('sibling')!;
  await focusMathfield(page);
  await sendMessages(page, sender, [
    {
      type: MESSAGE_TYPE,
      action: 'execute-command',
      command: ['insert', 'unexpected'],
    },
  ]);
  expect(
    await page.locator('#mf-1').evaluate((mf: MathfieldElement) => mf.value)
  ).toBe('');
});

test('explicitly allowed cross-origin mathfields can use the host keyboard', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/iframe_test.html');
  const frame = page.frame('mathlive-iframe-cross-origin')!;
  await frame.waitForFunction(() => customElements.get('math-field'));
  await page.evaluate(() => {
    window.mathVirtualKeyboard.originValidator = (origin) =>
      origin === 'http://localhost:9029';
    window.mathVirtualKeyboard.targetOrigin = 'http://localhost:9029';
  });
  await frame.evaluate(() => {
    window.mathVirtualKeyboard.originValidator = (origin) =>
      origin === 'http://127.0.0.1:9029';
    window.mathVirtualKeyboard.targetOrigin = 'http://127.0.0.1:9029';
    window.mathVirtualKeyboard.layouts = ['numeric'];
  });
  await expect
    .poll(() => page.evaluate(() => window.mathVirtualKeyboard.layouts))
    .toEqual(['numeric']);
  await focusMathfield(frame);
  await frame.evaluate(() =>
    window.mathVirtualKeyboard.show({ animate: false })
  );
  await page
    .locator('.MLK__layer.is-visible [data-keycap-value="1"]')
    .first()
    .click();
  await expect
    .poll(() =>
      frame.locator('#mf-1').evaluate((mf: MathfieldElement) => mf.value)
    )
    .toBe('1');
});

test('trusted same-origin custom layouts still work', async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.evaluate((marker) => {
    window.mathVirtualKeyboard.layouts = [
      { label: 'Custom', layers: [{ markup: marker }] },
    ];
    window.mathVirtualKeyboard.show({ animate: false });
  }, marker);
  await expect(page.locator('[data-keyboard-untrusted]')).toHaveCount(1);
});

test('an unrelated frame cannot impersonate the keyboard to a proxy or mathfield', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/iframe_test.html');
  const receiver = page.frame('mathlive-iframe')!;
  await receiver.waitForFunction(() => customElements.get('math-field'));
  await receiver.evaluate(() => {
    window.mathVirtualKeyboard.originValidator = 'none';
  });
  await focusMathfield(receiver);
  const sender = await addSender(page);
  await sendMessages(receiver, sender, [
    {
      type: MESSAGE_TYPE,
      action: 'geometry-changed',
      boundingRect: { height: 999 },
    },
    {
      type: MESSAGE_TYPE,
      action: 'execute-command',
      command: ['insert', 'unexpected'],
    },
  ]);
  expect(
    await receiver.evaluate(
      () => window.mathVirtualKeyboard.boundingRect.height
    )
  ).not.toBe(999);
  expect(
    await receiver.locator('#mf-1').evaluate((mf: MathfieldElement) => mf.value)
  ).toBe('');
});

test('response messages cannot redirect the host keyboard command recipient', async ({
  page,
}) => {
  await page.goto('/dist/playwright-test-page/');
  const sender = await addSender(page);
  await page.evaluate(() => {
    window.mathVirtualKeyboard.originValidator = 'none';
  });
  await page.locator('.ML__virtual-keyboard-toggle').nth(0).click();
  await focusMathfield(page);
  await sendMessages(page, sender, [
    {
      type: MESSAGE_TYPE,
      action: 'geometry-changed',
      boundingRect: { height: 999 },
    },
  ]);
  await page
    .locator('.MLK__layer.is-visible [data-keycap-value="1"]')
    .first()
    .click();
  await expect
    .poll(() =>
      page.locator('#mf-1').evaluate((mf: MathfieldElement) => mf.value)
    )
    .toBe('1');
});
