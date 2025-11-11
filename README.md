<div align="center">
    <img alt="MathLive" src="assets/mathlive-1.png?raw=true">
</div>

<h1 align="center">MathLive</h1>
<p align="center"><em>Web components for math input, display, and accessibility.</em></p>

[![Maintenance](https://img.shields.io/maintenance/yes/2025.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)

MathLive ships batteries-included UI components that bring TeX-quality math to
the web. Drop a mathfield on the page, wire up the events you care about, and
MathLive handles rendering, editing, speech, and keyboard UX for you.

- 800+ built-in LaTeX commands with high-fidelity typesetting
- Mobile-ready virtual keyboards and physical keyboard shortcuts
- Export/import as LaTeX, MathML, ASCIIMath, Typst, or MathJSON
- Screen-reader friendly with math-to-speech and ARIA labels
- Highly customizable UI, themes, macros, commands, and behaviors

<img src="assets/screenshots/mathlive-demo.png" alt="MathLive demo screenshot">

<table align="center">
    <tr>
        <td width='50%' align='center' style="border:none;">
            <img alt="Popover panel" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/popover.png">
        </td>
        <td width='50%' align='center' style="border:none;">
            <img alt="Virtual keyboard" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/virtualKeyboard.png">
        </td>
    </tr>
    <tr style="background-color: initial; border: none;">
        <td colspan="2" align="center" style="border:none;">
            <img width="50%" alt="Loop equation" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/loop-eqn.png">
        </td>
    </tr>
</table>

## Components at a Glance

**`<math-field>`** - The flagship math editor. Provides text-area like APIs
(`value`, `selection`, `executeCommand()`), emits `input` and `change` events,
and exposes a full virtual keyboard UI with custom layouts.

**`<math-span>`** - Inline, lightweight renderer for static math. Ideal for
embedding expressions inside paragraphs without initializing a full mathfield.

**`<math-div>`** - Block-level renderer for static math and display equations.
Useful for articles, assessments, or anywhere you previously called
`renderMathInDocument()`.

Both static components:

- Accept LaTeX by default and support `format="ascii-math"` or
  `format="math-json"`
- Expose a `mode` attribute (`textstyle`/`displaystyle`)
- Lazy-load shared fonts once, defer rendering until visible via Intersection
  Observer, and auto-generate ARIA labels with speech-friendly text
- Provide an imperative `render()` method when you need to update content
  programmatically

```html
<math-span>e^{i\pi} + 1 = 0</math-span>
<math-div format="ascii-math">int_0^oo e^(-x^2) dx</math-div>
```

## 🚀 Quick Start

Install and import the component bundle:

```bash
npm install mathlive
```

```javascript
import 'mathlive';
```

Render a mathfield:

```html
<!DOCTYPE html>
<html lang="en-US">
  <body>
    <math-field virtual-keyboard-mode="auto" smart-fence>f(x)=x+1</math-field>
  </body>
</html>
```

Render static math without the editor chrome:

```html
<math-span id="area">A = \pi r^2</math-span>
<math-div format="math-json" mode="displaystyle">
  {"kind":"Multiply","args":["x",{"kind":"Power","base":"y","exponent":2}]}
</math-div>
<script type="module">
  const formula = document.getElementById('area');
  formula.textContent = 'A = \\pi r^2';
  await formula.render();
</script>
```

Or load MathLive from a CDN:

```html
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/mathlive"></script>
</head>
```

### Framework Guides

- [React](https://cortexjs.io/mathfield/guides/react/)
- [Svelte](https://cortexjs.io/mathfield/guides/svelte/)
- [Interacting with a mathfield](https://cortexjs.io/mathfield/guides/interacting/)

## 📖 Documentation

Comprehensive guides cover customization, command execution, macros, keyboard
shortcuts, speech output, static rendering, and more. Browse everything on
[MathLive.io](https://mathlive.io/) and dig into the
[Mathfield API reference](https://mathlive.io/mathfield/api/) for full typings
and method docs.

## FAQ

**Q: When is the next release?**

MathLive follows a semi-annual cadence with major drops around June and January,
plus patch releases for regression fixes. Sponsor requests or community pull
requests can trigger out-of-band releases when needed.

## Related Projects

<dl>
  <dt><a href="https://mathlive.io/math-json">MathJSON</a> (on <a href="https://github.com/cortex-js/math-json">GitHub</a>)</dt>
  <dd>A lightweight data interchange format for mathematical notation.</dd>
  <dt><a href="https://mathlive.io/compute-engine">Compute Engine</a> (on <a href="https://github.com/cortex-js/math-json/tree/master/src/compute-engine">GitHub</a>)</dt>
  <dd>Performs numeric and symbolic calculations on MathJSON expressions.</dd>
</dl>

## 💬 Contact Us

- Chat with the [MathLive GPT](https://chatgpt.com/g/g-8YgEfR7ig-mathlive-gpt)
- Join our [Discord server](https://discord.gg/yhmvVeJ4Hd)
- Email [arno@arno.org](mailto:arno@arno.org)

## 📃 License

This project is licensed under the [MIT License](LICENSE.txt).
