import { test, expect, Page } from '@playwright/test';

// The clipboard content is captured from the `copy` event rather than read
// from the system clipboard, which requires permissions that are not
// available in all browsers.

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

async function setup(page: Page, html: string): Promise<void> {
  await page.evaluate((html) => {
    document.getElementById('copy-test')?.remove();
    const container = document.createElement('div');
    container.id = 'copy-test';
    container.innerHTML = html;
    document.body.prepend(container);
  }, html);
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll('#copy-test math-span, #copy-test math-div')
    ).every((el) => el.shadowRoot?.querySelector('[part="render"] .ML__latex'))
  );
}

/** Trigger a copy of the current selection and return the clipboard data */
async function copy(
  page: Page
): Promise<{ text: string; html: string; prevented: boolean }> {
  await page.evaluate(() => {
    const w = window as any;
    w.__copyResult = undefined;
    window.addEventListener(
      'copy',
      (event) => {
        w.__copyResult = {
          text: event.clipboardData?.getData('text/plain') ?? '',
          html: event.clipboardData?.getData('text/html') ?? '',
          prevented: event.defaultPrevented,
        };
      },
      { once: true }
    );
    // The copy event is dispatched to the body, as with a regular page
    // selection
    (document.activeElement as HTMLElement | null)?.blur();
    document.execCommand('copy');
  });
  return page.evaluate(() => (window as any).__copyResult);
}

/** Select the rendered text of a static element, from `start` to `end` */
async function selectInShadow(
  page: Page,
  selector: string,
  start = 0,
  end?: number
): Promise<void> {
  await page.evaluate(
    ([selector, start, end]) => {
      const host = document.querySelector(selector as string)!;
      const walker = document.createTreeWalker(
        host.shadowRoot!.querySelector('[part="render"]')!,
        NodeFilter.SHOW_TEXT
      );
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      const last = (end as number | null) ?? nodes.length - 1;
      getSelection()!.setBaseAndExtent(
        nodes[start as number],
        0,
        nodes[last],
        nodes[last].length
      );
    },
    [selector, start, end ?? null] as const
  );
}

async function selectContents(page: Page, selector: string): Promise<void> {
  await page.evaluate((selector) => {
    getSelection()!.selectAllChildren(document.querySelector(selector)!);
  }, selector);
}

test('copy all of a <math-span> copies its LaTeX', async ({ page }) => {
  await setup(
    page,
    String.raw`<math-span id="s">\frac{a}{b}+x^2+\sqrt{y}</math-span>`
  );
  await selectInShadow(page, '#s');
  const result = await copy(page);
  expect(result.text).toBe(String.raw`\frac{a}{b}+x^2+\sqrt{y}`);
  expect(result.prevented).toBe(true);
});

test('copy part of a <math-span> copies all its LaTeX', async ({ page }) => {
  await setup(
    page,
    String.raw`<math-span id="s">\frac{a}{b}+x^2+\sqrt{y}</math-span>`
  );
  await selectInShadow(page, '#s', 1, 2);
  expect((await copy(page)).text).toBe(String.raw`\frac{a}{b}+x^2+\sqrt{y}`);
});

test('copy a <math-div> copies its LaTeX', async ({ page }) => {
  await setup(page, String.raw`<math-div id="d">\int_0^1 x\,dx</math-div>`);
  await selectInShadow(page, '#d');
  expect((await copy(page)).text).toBe(String.raw`\int_0^1 x\,dx`);
});

test('copy a <math-span> by mouse selection', async ({ page }) => {
  await setup(
    page,
    String.raw`<math-span id="s">\frac{a}{b}+x^2+\sqrt{y}</math-span>`
  );
  const box = (await page.locator('#s').boundingBox())!;
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  expect((await copy(page)).text).toBe(String.raw`\frac{a}{b}+x^2+\sqrt{y}`);
});

test('copy text and a <math-span> wraps the LaTeX in $', async ({ page }) => {
  await setup(page, '<p id="p">解は <math-span>x^2</math-span> です</p>');
  await selectContents(page, '#p');
  const result = await copy(page);
  expect(result.text).toBe('解は $x^2$ です');
  expect(result.prevented).toBe(true);
});

test('copy from text into a <math-span> includes the whole LaTeX', async ({
  page,
}) => {
  await setup(page, '<p id="p">Solve <math-span id="s">x^2+1</math-span></p>');
  const p = (await page.locator('#p').boundingBox())!;
  const s = (await page.locator('#s').boundingBox())!;
  await page.mouse.move(p.x + 1, p.y + p.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 10 });
  await page.mouse.up();
  expect((await copy(page)).text).toBe('Solve $x^2+1$');
});

test('copy text and a <math-div> wraps the LaTeX in $$', async ({ page }) => {
  await setup(
    page,
    String.raw`<p>Consider</p><math-div>\frac{a}{b}</math-div><p>where b is not 0.</p>`
  );
  await selectContents(page, '#copy-test');
  expect((await copy(page)).text).toBe(
    'Consider\n\n$$\\frac{a}{b}$$\n\nwhere b is not 0.'
  );
});

test('copy text with a <math-span> and a <math-div>', async ({ page }) => {
  await setup(
    page,
    '<p>Let <math-span>x=2</math-span>, then</p><math-div>x^2=4</math-div>'
  );
  await selectContents(page, '#copy-test');
  expect((await copy(page)).text).toBe('Let $x=2$, then\n\n$$x^2=4$$');
});

test('copy does not include the accessibility content', async ({ page }) => {
  await setup(
    page,
    String.raw`<p id="p">A <math-span>\sqrt{2}</math-span> and <math-span>\pi</math-span>.</p>`
  );
  await selectContents(page, '#p');
  expect((await copy(page)).text).toBe(String.raw`A $\sqrt{2}$ and $\pi$.`);
});

test('copy without static elements is unchanged', async ({ page }) => {
  await setup(page, '<p id="p">Plain <b>text</b></p><math-span>x</math-span>');
  await selectContents(page, '#p');
  expect(await copy(page)).toEqual({ text: '', html: '', prevented: false });
});

test('copy text and a <math-span> keeps the HTML formatting', async ({
  page,
}) => {
  await setup(
    page,
    '<p id="p">Let <b>x</b> be <a href="#">a root</a> of <math-span>x^2=2</math-span></p>'
  );
  await selectContents(page, '#p');
  const { text, html } = await copy(page);
  expect(text).toBe('Let x be a root of $x^2=2$');
  expect(html).toContain('<b>x</b>');
  expect(html).toContain('<a href="#">a root</a>');
  expect(html).toContain('$x^2=2$');
  expect(html).not.toContain('math-span');
});

test('copy text and a <math-span> keeps the inherited white-space', async ({
  page,
}) => {
  await setup(page, '<pre id="p">a\n  b <math-span>x</math-span></pre>');
  await selectContents(page, '#p');
  expect((await copy(page)).text).toBe('a\n  b $x$');
});

test('copy text and a <math-span> applies the rules of the ancestors', async ({
  page,
}) => {
  await setup(
    page,
    '<style>#copy-test .note { display: none }</style><p id="p">A <span class="note">hidden</span><math-span>x</math-span></p>'
  );
  await selectContents(page, '#p');
  expect((await copy(page)).text).toBe('A $x$');
});

test('copy text and a <math-span> does not connect custom elements', async ({
  page,
}) => {
  await page.evaluate(() => {
    const w = window as any;
    w.__connected = 0;
    customElements.define(
      'copy-test-shadow',
      class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
        }
        connectedCallback() {
          w.__connected += 1;
        }
      }
    );
  });
  await setup(
    page,
    '<p id="p">See <copy-test-shadow>word</copy-test-shadow> and <math-span>x</math-span></p>'
  );
  await selectContents(page, '#p');
  const { text, html } = await copy(page);
  expect(text).toBe('See word and $x$');
  expect(html).toContain('<copy-test-shadow>word</copy-test-shadow>');
  expect(await page.evaluate(() => (window as any).__connected)).toBe(1);
});

test('copy a selection that includes a <math-field> is unchanged', async ({
  page,
}) => {
  await setup(
    page,
    '<p id="p"><math-span>x</math-span> and <math-field>y</math-field></p>'
  );
  await selectContents(page, '#p');
  expect((await copy(page)).prevented).toBe(false);
});

test('copy a MathJSON <math-span> without the Compute Engine copies its source', async ({
  page,
}) => {
  await setup(
    page,
    '<math-span id="s" format="math-json">["Add", "x", 1]</math-span>'
  );
  await page.evaluate(() =>
    getSelection()!.selectAllChildren(document.getElementById('copy-test')!)
  );
  expect((await copy(page)).text).toBe('["Add", "x", 1]');
});

test('static elements are selectable, other math is not', async ({ page }) => {
  await setup(
    page,
    String.raw`<math-span id="s">x</math-span><div id="rendered">\(y\)</div>`
  );
  const result = await page.evaluate(async () => {
    const { renderMathInElement } = await import('/dist/mathlive.mjs' as any);
    renderMathInElement(document.getElementById('rendered')!);
    const userSelect = (el: Element | null | undefined) =>
      el
        ? getComputedStyle(el).userSelect ||
          getComputedStyle(el).webkitUserSelect
        : 'missing';
    return {
      span: userSelect(
        document
          .getElementById('s')!
          .shadowRoot!.querySelector('[part="render"] .ML__latex')
      ),
      rendered: userSelect(document.querySelector('#rendered .ML__latex')),
      mathfield: userSelect(
        document.getElementById('mf-1')!.shadowRoot!.querySelector('.ML__latex')
      ),
    };
  });
  expect(result).toEqual({ span: 'text', rendered: 'none', mathfield: 'none' });
});
