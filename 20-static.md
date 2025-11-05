---
date: Last Modified
title: Static Math Formulas
slug: /mathfield/guides/static/
---

# Static Math Formulas

## Converting LaTeX to Various Formats

The mathfield library includes some utility functions to convert between various
formats. These utility functions can be used without a mathfield. In fact, they
do not require a browser environment at all, and can be used in a Node.js
environment.

They are available as a Service Side Render (SSR) package which can be imported
as follows:

```javascript
import * from 'mathlive/ssr';
```

**To convert LaTeX to HTML**, use the
[`convertLatexToMarkup()`](/mathfield/api/#q=convertLatexToMarkup) function.

```javascript
import { convertLatexToMarkup } from 'mathlive';
console.log(convertLatexToMarkup('x^2 + y^2 = z^2'));
```

**To convert LaTeX to MathML**, use the
[`latexToMathML()`](/mathfield/api/#q=latexToMathML) function.

```javascript
import { convertLatexToMathMl } from 'mathlive';
console.log(convertLatexToMathMl('x^2 + y^2 = z^2'));
```

**To convert LaTeX to spoken text**, use the
[`convertLatexToSpeakableText()`](/mathfield/api/#q=convertLatexToSpeakableText)
function.

```javascript
import { convertLatexToSpeakableText } from 'mathlive';
console.log(convertLatexToSpeakableText('x^2 + y^2 = z^2'));
```

**To convert LaTeX to AsciiMath**, use the
[`convertLatexToAsciiMath()`](/mathfield/api/#q=convertLatexToAsciiMath)
function.

```javascript
import { convertLatexToAsciiMath } from 'mathlive';
console.log(convertLatexToAsciiMath('x^2 + y^2 = z^2'));
```

## Converting From Various Formats to LaTeX

**To convert MathJson to LaTeX**, use the
[`convertMathJsonToLatex()`](/mathfield/api/#convertmathjsontolatex) function.

```javascript
import { convertMathJsonToLatex } from 'mathlive';
console.log(convertMathJsonToLatex(["Add", "x", "y"]));
```

**To convert AsciiMath to LaTeX**, use the
[`convertAsciiMathToLatex()`](/mathfield/api/#q=convertAsciiMathToLatex)
function.

```javascript
import { asciiMathToLatex } from 'mathlive';
console.log(convertAsciiMathToLatex('x^2 + y^2 = z^2'));
```

## Rendering Static Math Formulas

MathLive provides two approaches for rendering static (non-editable) math
formulas:

1. **Web Components** (`<math-span>` and `<math-div>`) - A simple, declarative
   approach using custom HTML elements
2. **Auto-rendering** (`renderMathInDocument()`) - Automatically converts LaTeX
   delimiters in your document to rendered math

### Using Web Components

**For simple static formulas**, use the `<math-span>` and `<math-div>` web
components. These provide a lightweight way to render math without editing
capabilities.

```html
<!-- Inline formula -->
<p>The famous equation <math-span>E = mc^2</math-span> was discovered by Einstein.</p>

<!-- Block formula -->
<math-div>\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}</math-div>
```

**Attributes:**

- `mode`: Set to `textstyle` (default for `<math-span>`) or `displaystyle`
  (default for `<math-div>`)
- `format`: Set to `latex` (default), `ascii-math`, or `math-json`
- `letter-shape-style`: Set to `auto`, `tex`, `iso`, `french`, or `upright`
- `macros`: JSON string of custom LaTeX macros
- `min-font-scale`: Minimum font scaling
- `max-matrix-cols`: Maximum matrix columns
- `aria-label`: Custom accessible description (auto-generated if not provided)
- `tabindex`: Set to `0` to make formula focusable and enable keyboard
  navigation
- `role`: Automatically set to `img` (can be overridden)

**Examples:**

```html
<!-- AsciiMath format -->
<math-span format="ascii-math">x^2 + y^2</math-span>

<!-- MathJSON format -->
<math-div format="math-json">["Add", "x", "y"]</math-div>

<!-- Override display mode -->
<math-span mode="displaystyle">\sum_{i=1}^n i^2</math-span>

<!-- Custom letter shape style -->
<math-div letter-shape-style="iso">f(x) = ax + b</math-div>

<!-- Programmatic rendering -->
<math-div id="formula">x + y</math-div>
<script type="module">
  const formula = document.getElementById('formula');
  formula.textContent = 'x^2 + y^2 = z^2';
  formula.render(); // Manually trigger re-render
</script>
```

**Events:**

- `render`: Fired when content is successfully rendered
- `render-error`: Fired when rendering fails

```javascript
const mathDiv = document.querySelector('math-div');
mathDiv.addEventListener('render', (event) => {
  console.log('Rendered:', event.detail.content);
});
mathDiv.addEventListener('render-error', (event) => {
  console.error('Render error:', event.detail.error);
});
```

**Performance Features:**

The components include built-in performance optimizations:

- **Lazy Font Loading**: Fonts are loaded once globally across all components,
  reducing network requests
- **Intersection Observer**: Off-screen formulas are rendered only when they
  become visible (50px before entering viewport), dramatically improving page
  load times for documents with many formulas

**Accessibility Features:**

The components are designed with accessibility in mind:

- **Auto-generated ARIA Labels**: Formulas automatically receive `aria-label`
  attributes with speakable text descriptions (user-provided labels take
  precedence)
- **MathML Fallback**: Hidden MathML is included for screen readers that support
  it
- **Keyboard Navigation**: When made focusable with `tabindex="0"`, formulas can
  be navigated with Tab and activated with Space/Enter to hear the description
  via speech synthesis
- **Semantic Role**: Automatically set to `role="img"` for proper accessibility
  tree representation

```html
<!-- Auto-generated accessibility -->
<math-span>E = mc^2</math-span>

<!-- Custom ARIA label (preserved) -->
<math-span aria-label="Einstein's mass-energy equivalence">E = mc^2</math-span>

<!-- Keyboard navigable -->
<math-div tabindex="0">\int_0^1 f(x) dx</math-div>
```

### Auto-rendering with renderMathInDocument()

**To render math contained in a document as a static (non-editable) formula**,
call [`renderMathInDocument()`](/mathfield/api/#q=renderMathInDocument) at the
end of your document, or in a `DOMContentLoaded` event handler.

```html
<script defer type="module">
  window.addEventListener('DOMContentLoaded', () =>
    import('https://esm.run/mathlive').then((mathlive) =>
      mathlive.renderMathInDocument()
    )
  );
</script>
```

By default, any LaTeX code in the text element of a DOM element that is enclosed
with the following delimiters will be rendered as math:

- `\[`...`\]` or `$$`...`$$` -- rendered in Display Style (CSS display block)
- `\(`...`\)` -- rendered in Text Style (CSS display inline)

```html
<h1>Taxicab Number</h1>
<p>The second taxicab number
   is \\(1729 = 10^3 + 9^3 = 12^3 + 1^3\\)
</p>
```

More complex expressions can be wrapped in a `<script>` tag. One of the benefits
of this approach is that the browser will not attempt to display the content of
the `<script>` tag before it is typeset, avoiding an unsightly flash of code on
screen.

**To render LaTeX code, use `<script type="math/tex">`**

**To render MathJSON, use `<script type="math/json">`**

**To render the formula inline, append** `; mode=text` **to the type**. If no
mode is provided, or `mode=display`, the display (block) style is used.

```html
<h1>Quadratic roots</h1>
<script type="math/json"> ["Add",
    ["Multiply", "a", ["Square", "x"]]],
    ["Multiply", "b", "x"],
    "c"
  ]
</script>
<script type="math/tex; mode=text">
  =  a
  \left( x - \frac{-b + \sqrt {b^2-4ac}}{2a} \right)
  \left( x - \frac{-b - \sqrt {b^2-4ac}}{2a} \right)
</script>
```

The following DOM elements are ignored for conversion: `<noscript>`, `<style>`,
`<textarea>`, `<pre>`, `<code>`, `<annotation>` and `<annotation-xml>`.

If you dynamically generate content, call
[`renderMathInElement(element)`](/mathfield/api/#q=renderMathInElement) to
render your element after the page has been loaded. This is a recursive call
that will be applied to `element` and all its children.

To render again elements or a whole document that has already been rendered,
call `renderMathInElement()` and `renderMathInDocument()` again. This is useful
when a change in the environment requires the layout to be updated.

To customize the behavior of the `renderMathInElement()` and
`renderMathInDocument()` functions pass an optional `options` object literal:

- `skipTags`: an array of tag names whose content will not be scanned for
  delimiters
- `processScriptType`: `<script>` tags of the indicated type will be processed
  while others will be ignored. Default: "math/tex".
- `ignoreClass`: a string used as a regular expression of class names of
  elements whose content will not be scanned for delimiters (`"tex2jax_ignore"`
  by default)
- `processClass`: a string used as a regular expression of class names of
  elements whose content **will** be scanned for delimiters, even if their tag
  name or parent class name would have prevented them from doing so.
  (`"tex2jax_process"` by default)
- `TeX.processEnvironments`: if false, math expression that start with `\begin{`
  will not automatically be rendered. (true by default)
- `TeX.delimiters.inline` and `TeX.delimiters.display` arrays of delimiters that
  will trigger a render of the content in 'textstyle' or 'displaystyle' style,
  respectively.

```javascript
renderMathInElement(document.getElementById('formulas'), {
  // Elements with a class of "instruction" or "source"
  // will be skipped
  ignoreClass: 'instruction|source',
  TeX: {
    delimiters: {
      // Allow math formulas surrounded by $...$ or \(...\)
      // to be rendered as inline (textstyle) content.
      inline: [
        ['$', '$'],
        ['\\(', '\\)'],
      ],
      display: [],
    },
  },
});
```

### Choosing Between Web Components and Auto-rendering

**Use `<math-span>` and `<math-div>` when:**

- You want a simple, declarative API
- You need to render individual formulas
- You want programmatic control over re-rendering with the `render()` method
- You need to handle render events
- You're working with dynamic content that changes frequently
- You want to use different input formats (LaTeX, AsciiMath, or MathJSON)

**Use `renderMathInDocument()` when:**

- You have existing content with LaTeX delimiters (`\(...\)`, `$$...$$`, etc.)
- You want to convert an entire document at once
- You're migrating from other LaTeX rendering libraries (like KaTeX or MathJax)
- You need to render math in `<script type="math/tex">` tags

Both approaches produce the same visual output and share the same rendering
engine. The main difference is in how you specify and control the rendering.

## Read-only Mathfield

When a math formula is displayed as a static element using
`renderMathInDocument()`, the formula is transformed into some static markup. As
a result, only the markup content can be selected, not the underlying LaTeX
formula. Selection of a portion of the formula may also lead to unexpected
results.

If preserving the ability to select a formula is important, consider using a
read-only mathfield instead.

**To create a read-only mathfield**, add the `read-only` attribute to a
`<math-field>` element.

```live
:::html
<style>
math-field[read-only] {
  border: none;
  background-color: transparent;
}
</style>
<p>The solution of the equation is
<math-field read-only style="display:inline-block">
  x=\frac{-b\pm \sqrt{b^2-4ac}}{2a}
</math-field>
</p>
```

<!-- Equation rendering -->
<!-- Readonly mathfield see https://github.com/arnog/mathlive/issues/609-->
