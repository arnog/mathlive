import { test, expect } from '@playwright/test';

const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

test.beforeEach(async ({ page }) => {
  await page.goto('/dist/playwright-test-page/');
  await page.waitForSelector('math-field', { timeout: 5000 });
});

// The hidden copy of the expression for assistive technologies must be a
// MathML tree. The HTML parser only creates MathML elements for the
// descendants of a `<math>` element: without this root element, `<mfrac>`
// is an unknown HTML element.
for (const tag of ['math-span', 'math-div']) {
  test(`<${tag}> has a hidden MathML tree with a <math> root`, async ({
    page,
  }) => {
    const result = await page.evaluate(async (tag) => {
      const element = document.createElement(tag);
      const rendered = new Promise((resolve) =>
        element.addEventListener('render', resolve, { once: true })
      );
      element.textContent = '\\frac{a}{b}';
      document.body.prepend(element);
      await rendered;

      const root = element.shadowRoot!;
      const describe = () => ({
        mathCount: root.querySelectorAll('math').length,
        mathNamespace: root.querySelector('math')?.namespaceURI,
        mfracNamespace: root.querySelector('mfrac')?.namespaceURI,
        mfracParentIsInMath: Boolean(root.querySelector('math mfrac')),
      });
      const first = describe();

      // A second render must replace the MathML tree, not add a new one
      (element as any).render();
      return { first, second: describe() };
    }, tag);

    const expected = {
      mathCount: 1,
      mathNamespace: MATHML_NAMESPACE,
      mfracNamespace: MATHML_NAMESPACE,
      mfracParentIsInMath: true,
    };
    expect(result.first).toEqual(expected);
    expect(result.second).toEqual(expected);
  });
}
