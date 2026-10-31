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
    '<span class="ML__latex"><span class="ML__strut" style="height:0.44em"></span><span class="ML__base"><span data-x="&quot; &gt;&lt;img/onerror=alert(1) src&gt;"><span class="ML__mathit">x</span></span></span></span>'
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

//
// The `shadow` option of `\enclose` is placed inside the `style` attribute of
// the SVG overlay. A value with spaces or quotes must not be able to add
// attributes (such as an event handler) to the `<svg>` element.
//
test('Enclose shadow attribute injection', () => {
  const payload = String.raw`\enclose{horizontalstrike}[shadow="0) onload=window.pwned=1//"]{x}`;
  const markup = convertLatexToMarkup(payload);
  expect(markup).not.toMatch(/onload/);
  expect(markup).not.toMatch(/pwned/);
  // Nothing is emitted between the closing quote of `style` and the next
  // quoted attribute.
  expect(markup).toMatch(/<svg style="[^"]*" stroke-width="/);

  // A valid shadow is emitted inside the quoted `style` attribute.
  expect(
    convertLatexToMarkup(
      String.raw`\enclose{horizontalstrike}[shadow="1px 1px 2px red"]{x}`
    )
  ).toMatch(/<svg style="[^"]*filter:drop-shadow\(1px 1px 2px red\);" stroke-width="/);

  expect(
    convertLatexToMarkup(
      String.raw`\enclose{horizontalstrike}[shadow="1px 1px rgba(0, 0, 0, .5)"]{x}`
    )
  ).toMatch(/filter:drop-shadow\(1px 1px rgba\(0, 0, 0, .5\)\);" stroke-width="/);

  // `auto` uses the built-in preset and nothing else.
  const auto = convertLatexToMarkup(
    String.raw`\enclose{horizontalstrike}[shadow="auto"]{x}`
  );
  expect(auto).toMatch(/<svg style="[^"]*filter:drop-shadow\(0 0 .5px rgba\(255, 255, 255, .7\)\) drop-shadow\(1px 1px 2px #333\);" stroke-width="/);
  expect(auto).not.toMatch(/drop-shadow\(auto\)/);

  // Invalid shadows are dropped entirely.
  for (const bad of [
    'url(x)',
    '1px 1px red; background:url(x)',
    '1px',
    '1px 1px 1px 1px red',
    '1px 1px "red"',
    '1px 1px expression(1)',
    '1px 1px rgb(a) b',
  ]) {
    const m = convertLatexToMarkup(
      String.raw`\enclose{horizontalstrike}[shadow="` + bad + '"]{x}'
    );
    expect(m).not.toMatch(/filter:/);
    expect(m).toMatch(/<svg style="[^"]*" stroke-width="/);
  }
});

//
// A value of `\htmlData` or `\href` that is a single quote character must not
// be emitted as an unterminated quote, since the text of the following
// attributes would then be reinterpreted as attribute syntax.
//
test('Attribute value that is a single quote character', () => {
  const m1 = convertLatexToMarkup(
    String.raw`\htmlData{a=",b=x onmouseover=alert(1) y}{x}`
  );
  expect(m1).toMatch('<span data-a="&quot;" data-b="x onmouseover=alert(1) y">');

  const m2 = convertLatexToMarkup(
    String.raw`\htmlData{a=',b=' onmouseover=alert(1) c}{x}`
  );
  expect(m2).toMatch(`<span data-a="'" data-b="' onmouseover=alert(1) c">`);

  const m3 = convertLatexToMarkup(
    String.raw`\href{https://a.com/,b=",c=x onfocus=alert(1) autofocus tabindex=0 y}{z}`
  );
  expect(m3).toMatch(
    '<span href="https://a.com/" data-b="&quot;" data-c="x onfocus=alert(1) autofocus tabindex=0 y">'
  );

  // `&` is escaped so that character references are kept literally
  expect(
    convertLatexToMarkup(String.raw`\href{https://example.org/?a=1&copy;=2}{x}`)
  ).toMatch('href="https://example.org/?a=1&amp;copy;=2"');
  expect(convertLatexToMarkup(String.raw`\class{a&#32;b}{x}`)).toMatch(
    'class="a&amp;#32;b"'
  );
});

//
// The notation names of `\enclose` are written in the `notation` attribute of
// the MathML `<menclose>` element. Unknown names are dropped, and the names
// are escaped.
//
test('Enclose notation names in MathML', () => {
  const m1 = convertLatexToMathMl(String.raw`\enclose{box" onclick="alert(1)}{x}`);
  expect(m1).not.toMatch(/onclick/);
  // `box"` is not a known notation name, so it is dropped
  expect(m1).toMatch('<menclose notation=""><mi>x</mi></menclose>');

  const m2 = convertLatexToMathMl(
    String.raw`\enclose{box"><img src=x onerror=alert(1)><b x="}{x}`
  );
  expect(m2).not.toMatch(/<img|onerror/);
  expect(m2).toMatch('<menclose notation=""><mi>x</mi></menclose>');

  expect(
    convertLatexToMathMl(String.raw`\enclose{box,horizontalstrike}{x}`)
  ).toMatch('<menclose notation="box horizontalstrike">');
});

//
// Values from the LaTeX input that end up in a `style` attribute are validated
// so that a `;` cannot add CSS declarations.
//
test('CSS declaration injection', () => {
  const noInjection = (latex: string) => {
    const m = convertLatexToMarkup(latex);
    expect(m).not.toMatch(/url\(|position:fixed|evil/);
  };
  noInjection(String.raw`\bbox[border:1px solid red;background:url(//evil/x)]{x}`);
  noInjection(String.raw`\bbox[;background:url(//evil/x)]{x}`);
  noInjection(String.raw`\enclose{roundedbox}[2px solid red;position:fixed;inset:0]{x}`);
  noInjection(String.raw`\enclose{box}[mathbackground="red;background:url(//evil/x)"]{x}`);
  noInjection(String.raw`\enclose{left}[mathcolor="red;position:fixed;inset:0"]{x}`);
  noInjection(String.raw`\textcolor{red;background:url(//evil/x)}{x}`);
  noInjection(String.raw`\color{;background:url(//evil/x)} x`);
  noInjection(String.raw`\colorbox{red;background:url(//evil/x)}{x}`);
  noInjection(String.raw`\fcolorbox{red;background:url(//evil/x)}{blue;position:fixed}{x}`);
  noInjection(String.raw`\text{\fontfamily{serif;position:fixed;top:0}X}`);

  // Valid values are preserved
  expect(
    convertLatexToMarkup(String.raw`\bbox[border:1px solid red]{x}`)
  ).toMatch('border:1px solid red');
  expect(
    convertLatexToMarkup(String.raw`\enclose{roundedbox}[2px dashed blue]{x}`)
  ).toMatch('border:2px dashed blue');
  expect(
    convertLatexToMarkup(String.raw`\enclose{box}[mathbackground="rgba(0, 0, 0, .5)"]{x}`)
  ).toMatch('background-color:rgba(0, 0, 0, .5)');
  expect(
    convertLatexToMarkup(String.raw`\text{\fontfamily{Comic Sans MS}X}`)
  ).toMatch('font-family:Comic Sans MS');
});
