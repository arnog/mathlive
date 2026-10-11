import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

// The notation of `\enclose` is drawn over the base. It must be sized to the
// base as laid out by the browser: the width computed by MathLive does not
// include the spacing around binary and relational operators, and
// overestimates vertical lists (fractions). Before the fix, the box was too
// narrow for `x+1` (the `1` overlapped the border) and too wide for
// `\frac{1}{2}`, with all the padding below the base.
const FORMULAS = [
  '8',
  'x+1',
  '3+5=8',
  'x^2',
  '\\sqrt{2}+1',
  '\\frac{1}{2}',
  '\\frac{3x+1}{x^2-4}',
  '\\left(\\frac{x+1}{x-1}\\right)^2',
];

const NOTATIONS = ['box', 'roundedbox'];

type Geometry = {
  frame: { left: number; right: number; top: number; bottom: number };
  glyphs: { left: number; right: number; top: number; bottom: number };
  fontSize: number;
};

for (const notation of NOTATIONS) {
  for (const formula of FORMULAS) {
    test(`\\enclose{${notation}} fits ${formula}`, async ({ page }) => {
      const geometry: Geometry = await page.evaluate(
        async ([notation, formula]) => {
          const element = document.createElement('math-span');
          element.style.fontSize = '40px';
          const rendered = new Promise((resolve) =>
            element.addEventListener('render', resolve, { once: true })
          );
          element.textContent = `\\enclose{${notation}}[1px solid red]{${formula}}`;
          document.body.prepend(element);
          await rendered;

          const root = element.shadowRoot!;
          const frame = root
            .querySelector('.ML__notation')!
            .getBoundingClientRect();

          // Union of the boxes of the characters of the base
          const base = root.querySelector('.ML__notation')!.nextElementSibling!;
          const range = document.createRange();
          const rects: DOMRect[] = [];
          const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent?.trim()) continue;
            range.selectNodeContents(walker.currentNode);
            rects.push(...Array.from(range.getClientRects()));
          }
          element.remove();

          return {
            frame: {
              left: frame.left,
              right: frame.right,
              top: frame.top,
              bottom: frame.bottom,
            },
            glyphs: {
              left: Math.min(...rects.map((r) => r.left)),
              right: Math.max(...rects.map((r) => r.right)),
              top: Math.min(...rects.map((r) => r.top)),
              bottom: Math.max(...rects.map((r) => r.bottom)),
            },
            fontSize: 40,
          };
        },
        [notation, formula]
      );

      const { frame, glyphs, fontSize } = geometry;
      const tolerance = 1; // px

      // The frame encloses every character
      expect(glyphs.left).toBeGreaterThanOrEqual(frame.left - tolerance);
      expect(glyphs.right).toBeLessThanOrEqual(frame.right + tolerance);
      expect(glyphs.top).toBeGreaterThanOrEqual(frame.top - tolerance);
      expect(glyphs.bottom).toBeLessThanOrEqual(frame.bottom + tolerance);

      // The padding is the same on the left and on the right
      const leftGap = glyphs.left - frame.left;
      const rightGap = frame.right - glyphs.right;
      expect(Math.abs(leftGap - rightGap)).toBeLessThan(0.1 * fontSize);
    });
  }
}

// The horizontal strike crosses the characters halfway up the x-height.
// Before the fix, it was drawn below the baseline (an underline).
for (const formula of ['8', 'x+1', '3+5=8', 'y=g(p)']) {
  test(`\\enclose{horizontalstrike} crosses ${formula}`, async ({ page }) => {
    const offset: number = await page.evaluate(async (formula) => {
      const fontSize = 40;
      const wrapper = document.createElement('div');
      wrapper.style.fontSize = `${fontSize}px`;
      // A zero height inline-block sits on the baseline of the text
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:1px;height:0';
      const element = document.createElement('math-span');
      const rendered = new Promise((resolve) =>
        element.addEventListener('render', resolve, { once: true })
      );
      element.textContent = `\\enclose{horizontalstrike}[1px solid red]{${formula}}`;
      wrapper.append('a', marker, element);
      document.body.prepend(wrapper);
      await rendered;

      const baseline = marker.getBoundingClientRect().bottom;
      const line = element
        .shadowRoot!.querySelector('.ML__notation line')!
        .getBoundingClientRect();
      wrapper.remove();
      // Height of the strike above the baseline, in em
      return (baseline - (line.top + line.bottom) / 2) / fontSize;
    }, formula);

    expect(offset).toBeGreaterThan(0.1);
    expect(offset).toBeLessThan(0.4);
  });
}

// In a mathfield, the caret is taller than `x+1`. It must not move or resize
// the notation when it is inside the base: the top of the notation was then
// clipped by the mathfield.
test(`\\enclose{roundedbox} does not move when the caret is inside`, async ({
  page,
}) => {
  const [unfocused, focused] = await page.evaluate(async () => {
    const mf = document.createElement('math-field') as any;
    mf.style.fontSize = '32px';
    document.body.prepend(mf);
    mf.value = '\\enclose{roundedbox}[1px solid red]{x+1}';
    const frame = () => {
      const r = mf.shadowRoot
        .querySelector('.ML__notation')
        .getBoundingClientRect();
      return [r.top, r.bottom, r.left, r.right];
    };
    await new Promise((resolve) => setTimeout(resolve, 100));
    const before = frame();
    mf.focus();
    mf.selection = { ranges: [[1, 1]] };
    await new Promise((resolve) => setTimeout(resolve, 100));
    const after = frame();
    mf.remove();
    return [before, after];
  });

  for (let i = 0; i < 4; i++)
    expect(Math.abs(focused[i] - unfocused[i])).toBeLessThan(0.5);
});
