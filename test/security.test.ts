import {
  convertLatexToMarkup,
  convertLatexToMathMl,
} from '../src/public/mathlive-ssr';

//
// Validate that unsecure content is blocked
//
test('Unsecure Content', () => {
  expect(() =>
    convertLatexToMarkup('\\href{javascript:alert(1)}{Click me}')
  ).toThrow();

  expect(() =>
    convertLatexToMarkup('\\htmlData{><img/onerror=alert(1)"src=}{x}')
  ).toThrow();

  expect(
    convertLatexToMarkup('\\htmlData{x=" ><img/onerror=alert(1) src>}{x}')
  ).toMatch(
    '<span class="ML__latex"><span class="ML__strut" style="height:0.44em"></span><span class="ML__base"><span data-x="&quot; ><img/onerror=alert(1) src>"><span class="ML__mathit">x</span></span></span></span>'
  );

  // href via htmlData is blocked (unless it's a safe URL)
  expect(() =>
    convertLatexToMarkup('\\htmlData{href="javascript:alert(1)"}{x}')
  ).toThrow();

  expect(() =>
    convertLatexToMarkup('\\href{javascript:alert(1)}{x}')
  ).toThrow();

  expect(() =>
    convertLatexToMarkup(
      '\\href{data:application/json;base64,eyJmb28iOiJiYXIifQ==}{x}'
    )
  ).toThrow();

  expect(() =>
    convertLatexToMarkup(
      '\\href{\t\t\tj\ta\tv\ta\ts\tc\tr\ti\tp\tt:alert(1)}{x}'
    )
  ).toThrow();
});

//
// Text-content reflection must be escaped in both HTML and MathML output.
// (\text{}, \mbox{} accept arbitrary characters in their body.)
//
test('Text content escaping (XSS)', () => {
  const payload = '<img src=x onerror=alert(1)>';

  for (const cmd of ['\\text', '\\mbox']) {
    // HTML output: the body is rendered, with markup characters escaped.
    const html = convertLatexToMarkup(`${cmd}{${payload}}`);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&gt;');

    // MathML output: must never emit a raw tag.
    const mathml = convertLatexToMathMl(`${cmd}{${payload}}`);
    expect(mathml).not.toContain('<img');
  }

  // \text is serialized to MathML; confirm its body is escaped there too.
  expect(convertLatexToMathMl(`\\text{${payload}}`)).toContain('&lt;img');

  // A literal ampersand is escaped (and not double-escaped).
  expect(convertLatexToMarkup('\\text{a&b}')).toContain('a&amp;b');
  expect(convertLatexToMarkup('\\text{a&b}')).not.toContain('&amp;amp;');
  expect(convertLatexToMathMl('\\text{a&b}')).toContain('a&amp;b');

  // Literal `<`/`>` delimiters (e.g. \left< … \right>) are escaped in MathML.
  const delim = convertLatexToMathMl('\\left<x\\right>');
  expect(delim).not.toContain('<mo><');
  expect(delim).not.toContain('<mo>>');
  expect(delim).toContain('&lt;');
  expect(delim).toContain('&gt;');
});

//
// Secure Content
//
test('Secure Content', () => {
  // http and https protocols are allowed with \href
  expect(convertLatexToMarkup('\\href{http://example.com}{x}')).toMatch(
    '<span class="ML__latex"><span class="ML__strut" style="height:0.44em"></span><span class="ML__base"><span href="http://example.com"><span class="ML__mathit">x</span></span></span></span>'
  );

  // Gets turned into a data-onerror attribute, so safe
  expect(convertLatexToMarkup('\\htmlData{onerror=alert(1)}{x}')).toMatch(
    '<span class="ML__latex"><span class="ML__strut" style="height:0.44em"></span><span class="ML__base"><span data-onerror="alert(1)"><span class="ML__mathit">x</span></span></span></span>'
  );
});
