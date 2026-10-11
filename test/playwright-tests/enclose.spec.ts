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
