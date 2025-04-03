## [Unreleased]

### Resolved Issues

- **#2657** Avoid potential race condition when changing the focus of the
  mathfield.
- Additional Italian localized strings.

### Improvements

- Added support for the `\strut` and `\mathstrut` commands. These commands are
  used to insert a strut, which is an invisible element that takes up space in
  the math expression. This is useful for aligning expressions or for creating
  space between elements.

## 0.105.0 _2025-03-27_

### Breaking Changes

In order to support alternate CDNs, in particular `jsdelivr`, the file layout of
the **npm** package has changed. The files that were previously in the `./dist/`
directory are now in the root of the package. This should not affect most users,
but if you are importing the library or auxiliary files from the `dist`
directory, you will need to update your paths.

To use `jsdelivr`, use:

```js
import { MathfieldElement } from "https://esm.run/mathlive";
```

or:

```html
<script defer src="https://cdn.jsdelivr.net/npm/mathlive"></script>
```

### Issues Resolved

- **#2647**, **#2634**, **#2562** Some accents (`\hat{}`, `\vec{}`) where not
  rendered correctly in some cases.

- **#2635** In Chrome (and Firefox), clicking on the padding area of the
  mathfield would not result in the focus getting into a zombie state and
  keyboard event no longer being dispatched.

## 0.104.2 _2025-03-23_

### Issues Resolved

- **#2588** With Chrome 133+ input with the physical keyboard was disabled after
  showing the virtual keyboard.

## 0.104.1 _2025-03-18_

### Improvements

- Improved support for the `jsdelivr` CDN. To use it, use:

```js
import { MathfieldElement } from "https://esm.run/mathlive";
```

### Issues Resolved

- **#2628** Attempting to delete an empty line in a multiline environment would
  not delete the line.
- **#2585** In some cases, the arguments of a macro were not serialized
  correctly. This could happen when using a macro in conjunction with a inline
  shortcut.
- **#2586** The `\pdiff{}{}` command was not properly serialized to LaTeX.

## 0.104.0 _2025-02-08_

### Security Advisories

As a reminder, if you are handling untrusted input, you should consider using
the `MathfieldElement.createHTML()` method to sanitize content. The
`createHTML()` method follows the recommendations from the
[Trusted Type](https://www.w3.org/TR/trusted-types/) specification.

For example, using the DOMPurify library (there are other HTML sanitizers
available):

```html
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.3/purify.min.js"></script>
```

```js
MathfieldElement.createHTML = (html) => DOMPurify.sanitize(html);
```

- [**security advisory**](https://github.com/advisories/GHSA-qwj6-q94f-8425)
  Untrusted input could be used to inject arbitrary HTML or JavaScript code in a
  page using a mathfield or math content rendered by the library, if the content
  included an `\htmlData{}` command with maliciously crafted input and no DOM
  sanitizer was used.

  The content of the `\htmlData{}` command is now sanitized and the 🚫 emoji is
  displayed instead in the mathfield if the content is unsafe. When using
  `convertLatexToMarkup()`, an exception is thrown.

- The `\href{}{}` command now only allows URLs with the `http` or `https`
  protocol.

### Issues Resolved

- Generate only standard trigonometric functions, i.e. those available in the
  `amsmath` package. Use `\operatorname{}` for the others. The standard commands
  are:

  - `\arccos`
  - `\arcsin`
  - `\arctan`
  - `\arg`
  - `\cos`
  - `\cosh`
  - `\cot`
  - `\coth`
  - `\csc`
  - `\sec`
  - `\sin`
  - `\sinh`
  - `\tan`
  - `\tanh`

- Added support for `\dddot` and `\ddddot` commands.

- **#2573** The `\operatorname{}` command when round-tripped would incldue an
  extraneous `\mathrm{}` command.

- **#2132**, **#2548** Improved handling of multi-line mathfields. To use a
  multi-line mathfield, include a multi-line environment:
  - `\displaylines{}`: single column of left-aligned equations
  - `gather`: single column of centered equations
  - `multline`: centered equations with the first line aligned left and the last
    line aligned to the right
  - `align`: two columns, the first column right-aligned, the second column
    left-aligned; used for one equation per line
  - `split`: two columns of equations, the first column right-aligned, the
    second column left-aligned; used for a single equation split over multiple
    lines

For example:

```html
<math-field>\displaylines{x=1 \\y = 2}</math-field>
```

```html
<math-field>\begin{align}
  f(0) &= 1 \\
  f(x + 1) &= f(x-1) + f(x)
\end{align}
</math-field>
```

- When in a multi-line environment, the **Return** key will move to the next
  line. The **Backspace** key will delete the current line if the cursor is at
  the beginning of the line. Note that no placeholder is inserted on a new line:
  the line is simply blank.

- The **Add Row Before**, **Add Row After**, **Add Column Before**, **Add Column
  After**, **Delete Row** and **Delete Columns** commands are available in the
  context menu when the cursor is inside a matrix. They are not available in
  multi-line environments.

- **#2574** The commands `\coloneq`, `\Coloneq`, `\Coloneqq`, `\eqcolon` and
  `\Eqcolon` were mapped to incorrect symbols (some of them used obsolete
  definitions of those commands from the mathtools package that changed in the
  Summer of 2022). They are now correctly mapped to the corresponding symbols.

- **#2576** The command `\perp` was mapped to the wrong symbol (U+22A5). It is
  now mapped to the correct symbol (U+27C2)

- Improved ASCIIMath serialization.

## 0.103.0 _2024-12-10_

### Issues Resolved

- **#2530** The AsciiMath `1/2` is now parsed as `\frac{1}{2}`
- The `\displaylines` command is now correctly parsed as a command with an
  argument, not as a group command.

## 0.102.0 _2024-11-29_

### Issues Resolved

- **#2550** The subpath exports in the main package.json have been updated to
  comply with Node.js's subpath patterns, which utilize "direct static matching
  and replacement.

### Improvements

- **#2554** **Option for sticky virtual keyboard variant panel**

  When long pressing a key on the virtual keyboard, a variant panel is displayed
  that offers alternatives (variants) for that key. The panel is only displayed
  while your finger is pressing the key (like a smartphone keyboard). This new
  options allows the variant panel to remain displayed even if you lift your
  finger from the screen.

  Add the `stickyVariantPanel` property to a virtual keyboard keycap definition
  to make the variant panel sticky.

  See `./examples/sticky-variant-panel/` for an example.

## 0.101.2 _2024-11-15_

### Issues Resolved

- Correctly display the caret following a `\mathop{}` command.
- **#2540** When using `renderMathInElement()` some white space was occasionally
  incorrectly removed.
- **#2545** (?) Use `\rightarrow` instead of `\rarr` in the virtual keyboard.
- **#2543** The `MathfieldElement.fractionNavigationOrder` was not respected
  when navigating in a fraction with the arrow keys.
- **#2251** Fixed the serialization of `\displaylines{}`

## 0.101.1 _2024-10-15_

### Issues Resolved

- **#2533** When using the virtual keyboard to insert a character with a
  blackboard style followed by a non-alphabetic symbol without a blackboard
  style, the second symbol would incorrectly be serialized with a blackboard
  style.
- In some cases, the `placeholder` attribute would not be displayed when the
  mathfield was empty.
- When using static math, the font-familly for text content was not correctly
  inherited from the parent element.
- In some cases, the inherent style of a macro could get overriden. For example
  typing the "RR" inline shortcut resulted in an unstyled R instead of the
  expected blackboard R.

## 0.101.0 _2024-07-17_

### Breaking Changes

- The properties `mathVirtualKeyboard.actionKeycap`,
  `mathVirtualKeyboard.shiftKeycap`, `mathVirtualKeyboard.backspaceKeycap`, and
  `mathVirtualKeyboard.tabKeycap` have been removed. Use the more general
  `mathVirtualKeyboard.setKeycap()` method to customize these keycaps, that is
  `mathVirtualKeyboard.setKeycap('[action]', {...})` etc...

### Improvements and New Features

- Macros can now be specified with `renderMathInElement()` and
  `renderMathInDocument()` using the `macros` option. For example:

  ```js
  renderMathInElement(element, {macros: {RR: '\\mathbb{R}'}})
  ```

- Performance improvements for pages with many mathfields. The initial rendering
  can be up to 2x as fast.
- Some keycaps in the virtual keyboard can be customized without having to
  define an entire virtual keyboard layout.

  The `mathVirtualKeyboard.getKeycap()` give access to the definition of special
  keycaps and `mathVirtualKeyboard.setKeycap()` can be used to change that
  definition.

  The keycaps are one of these special shortcuts:

  - `[left]`, `[right]`, `[up]`, `[down]`, `[return]`, `[action]`,
  - `[space]`, `[tab]`, `[backspace]`, `[shift]`,
  - `[undo]`, `[redo]`, `[foreground-color]`, `[background-color]`,
  - `[hide-keyboard]`,
  - `[.]`, `[,]`,
  - `[0]`, `[1]`, `[2]`, `[3]`, `[4]`,
  - `[5]`, `[6]`, `[7]`, `[8]`, `[9]`,
  - `[+]`, `[-]`, `[*]`, `[/]`, `[^]`, `[_]`, `[=]`, `[.]`,
  - `[(]`, `[)]`

  For example, to change the LaTeX inserted when the multiplication key is
  pressed use:

  ```js
  mathVirtualKeyboard.setKeycap('[*]', {latex: '\\times'});
  ```

### Issues Resolved

- **#2455** Serialization to ASCII Math of brackets and braces is now correct.
- When using Chrome in some locale (such as `es-419`), the context menu would
  not be displayed.
- When the `MathfieldElement.isFunction` handler is updated, re-render all the
  mathfields on the page to take it into account.
- **#2415** A content change event is now dispatched when the value of the
  mathfield is changed as a result of switch from LaTeX mode to math mode by
  changing the selection.
- Dispatch a `contextmenu` event any time the context menu is about to be
  displayed. This allows the event to be canceled.
- **#2413** When setting the `alphabeticLayout`, the current keyboard would not
  be updated in some cases.
- **#2412** The serialization of some expressions to LaTeX could result in some
  spaces being omitted. For example, `\lnot p` would serialize as `\lnotp`.
- **#2403** The virtual keyboard Keycap Variants panel was positioned
  incorrectly when the page used a RTL layout direction.
- In the virtual keyboard, the background of the variant panel was sometimes
  displayed transparently.
- **#2402** Characters inserted after a `\mathbb{}` command were not styled
  correctly.
- The `math-virtual-keyboard-command` event was not dispatched when a mathfield
  was focused and a keycap was pressed.
- There are now CSS selectors to customize the size of glyphs in the virtual
  keyboard (shift, enter, etc...):
  - `--keycap-glyph-size`
  - `--keycap-glyph-size-lg`
  - `--keycap-glyph-size-xl`
- **#2397** When a `beforeinput` event was canceled, the text would still be
  inserted when using the physical keyboard.
- **#2398** When a placeholder was the only element in a group, i.e.
  `{\placeholder{}}`, the placeholder was not automatically selected.

## 0.100.0 _2024-06-12_

### Issues Resolved

- **#2396** Pressing the arrow keys in the virtual keyboard would not move the
  selection in the mathfield and display a runtime error in the console.
- **#2392** Pressing the backspace key after typing several digits would delete
  all the digits.

- **#2395** Added a `dispatchEvent` command which can be attached to a custom
  keycap.

  Its first argument is the name of the dispatched event, and the second
  argument is an object with the `detail` property, which is the data associated
  with the event.

  ```ts
    {
      label: "✨",
      command: "dispatchEvent('customEvent', {detail: 'some data'})"
    }
  ```

  To handle the event, add an event listener to the mathfield element:

  ```js
  mf.addEventListener('customEvent', (ev) => {
    console.log(ev.detail);
  });
  ```

## 0.99.0 _2024-06-10_

### Breaking Changes

- The `mf.offsetFromPoint()` method has been renamed `mf.getOffsetFromPoint()`

- The `mf.setCaretPoint()` method has been replaced with
  `mf.position = mf.getOffsetFromPoint()`

- The `mf.scriptDepth()` and `mf.hitboxFromOffset()` methodds have been replaced
  with `mf.getElementInfo()`.

  The `getElementInfo()` method provides more information including any id that
  may have been applied with `\htmlId{}`.

  It is useful from within a `click` handler to get more information about the
  element that was clicked, e.g.

  ```js
    mf.getElementInfo(mf.getOffsetFromPoint(ev.clientX, ev.clientY))
  ```

  The info returned is an object with the following properties:

  ```ts
  export type ElementInfo = {
    /** The depth in the expression tree. 0 for top-level elements */
    depth?: number;

    /** The bounding box of the element */
    bounds?: DOMRect;

    /** id associated with this element or its ancestor, set with `\htmlId` or
       `\cssId`
    */
    id?: string;

    /** HTML attributes associated with element or its ancestores, set with
     * `\htmlData`
     */
    data?: Record<string, string | undefined>;

    /** The mode (math, text or LaTeX) */
    mode?: ParseMode;

    /** A LaTeX representation of the element */
    latex?: string;

    /** The style (color, weight, variant, etc...) of this element. */
    style?: Style;
  };
  ```

### Bold

The way bold is handled in LaTeX is particularly confusing, reflecting
limitations of the text rendering technology of the time.

Various attempts have been made over the years to improve the rendering of bold,
but this has resulted in inconsistent behavior. Furthermore, various
implementations of LaTeX and LaTeX-like systems have implemented bold in
different ways.

This release introduces a more consistent and intuitive handling of bold,
although it may result in different rendering of some formulas compared to some
implementations of LaTeX.

The original bold command in LaTeX is `\mathbf`. This command renders its
argument using a bold variant of the current font. However, only letters and
numbers can be rendered by this command. It does not affect symbols, operators,
or greek characters.

For example, `\mathbf{a+b}` will render as `𝐚+𝐛`, with the `a` and `b` in bold,
but the `+` in normal weight. Characters rendered by `\mathbf` are rendered
upright, even if they would have been rendered as italic otherwise.

The `\boldsymbol` command is an alternative to `\mathbf` that affects more
characters, including Greek letters and symbols. It does not affect the style of
the characters, so they remain italic if they were italic before. However, the
inter-character spacing and italic correction may not be rendered correctly.

The `\bm` command from the `bm` package is a more modern alternative that
affects even more characters. It also preserves the style of the characters, so
they remain italic if they were italic before. The inter-character spacing and
italic correction are handled correctly.

The `\bm` command is recommended over `\boldsymbol` and `\mathbf`. However, it
is not part of the standard LaTeX distribution, so it may not always be
available.

When serializing to LaTeX, MathLive will now use `\mathbf` when possible, and
fall back to `\bm` when not. This should result in more consistent rendering of
bold text.

When parsing, MathLive will interpret both `\mathbf`, `\boldsymbol` and `\bm` as
bold.

The bold style is now consistently inherited by sub-expressions.

Similarly, when applying a bold style using `mf.applyStyle({weight: "bold"})`,
the bold attribute is applied to the entire selection, not just the letters and
numbers.

### Mode Switching

- **#2375** The `switch-mode` command has two optionals arguments, a prefix and
  suffix. The prefix is inserted before the mode switch, and the suffix after.
  The command was behaving incorrectly. It now behaves as expected.
- It is now possible to roundtrip between math and text mode. For example,
  selecting a fraction `\frac{a}{b}` and pressing `alt+shift+T` will convert the
  selection to `(a)/(b)`. Pressing `alt+shift+T` again will convert it back to
  `\frac{a}{b}`.
- When in LaTeX mode, changing the selection would sometimes unexpectedly exit
  LaTeX mode, for example after the Select All command. This has been fixed.

### New Features

- **`\href`**

  The `\href{url}{content}` command, a MathJax extension that allows a link to
  be associated with some content, is now supported.

  Clicking on the content will open the link. By default, the link is opened in
  a new window, and only links with a HTTP, HTTPS or FILE protocol are allowed.
  This can be controlled by the new `MathfieldElement.openUrl` property. This
  property is a function with a single argument, the URL to be opened, that is
  called when the content of the `\href` command is clicked on.

- **Tooltip appearance**

  Added CSS variables to control the appearance of the toolip displayed with
  `\mathtip` and `\texttip`:

  - `--tooltip-border`
  - `--tooltip-color`
  - `--tooltip-background-color`
  - `--tooltip-box-shadow`
  - `--tooltip-border-radius`.

- The `maxMatrixCols` property has been added that specifies the maximum number
  of columns that a matrix may have. The default value is 10, which follows the
  default value from the amsmath package. The property applies to all of the
  matrix environments (`matrix`, `pmatrix`, `bmatrix`, etc.). This property is
  also accessible via the `max-matrix-cols` attribute.
- The virtual keyboard now supports variants for shifted-keys. This includes
  support for Swedish specific characters such as `å`, `ä`, and `ö` and their
  uppercase variants.
- Accept `"true"` and `"false"` as values for on/off attributes in the
  `<math-field>` element, for example `<math-field smart-fence="true">`.
- Added a `target` property (a `MathfieldElement`) to the `onMenuSelect`
  arguments.
- **#2337** Added an option `MathfieldElement.restoreFocusWhenDocumentFocused`
  to control whether a mathfield that was previously focused regains focus when
  the tab or window regains focus. This is true by default and matches the
  previous behavior, and the behavior of the `<textarea>` element.
- An alternate syntax for selectors with arguments. Selectors are used for
  example to associate actions with a keycap, such as `switchKeyboardLayer`. The
  previous syntax was `command: ["switchKeyboardLayer", "alt-layer"]`, the new
  syntax is `command: 'switchKeyboardLayer("alt-layer")'`. This is more concise
  and easier to read.

### Issues Resolved

- **#2387** When using a macro, the spacing around the macro was incorrect in
  some cases.
- **#2370** The order of the `keydown` and `input` event is now consistent with
  the `<textarea>` element.
- **#2369** After typing a shortcut, using the backspace key could result in
  unexpected behavior. Now, pressing the backspace key after a shortcut has been
  typed will undo the conversion of the shortcut.
- **#2380** In some cases, when using the menu, some spurious focus/blur events
  would be dispatched.
- **#2384** When using repeating decimals after a comma (i.e. `123{,}4(1)`), do
  not use a `\left...\right` command in order to get the proper spacing.
- **#2349** The positioning of subscripts for extensible symbols, such as `\int`
  was incorrect.
- **#2326** The Cut and Copy commands in the context menu are now working
  correctly in Safari.
- **#2309** When using styled text (e.g. `\textit{}`), the content could
  sometimes be serialized with an unnecessary `\text{}` command, i.e.
  `\text{\textit{...}}`.
- **#2376** When `smart-fence` was off, the `{` and `}` keys would not insert
  braces.
- **#2273** Using one of the Chinese locales would result in a runtime error.
- **#2355** When pressing the down arrow key in `\sqrt[#?]{1}` from the `#?`
  position, a runtime exception would occur.
- **#2298** When using screen readers, pressing the spacebar would not always
  correctly focus the mathfield.
- **#2297** In some cases, when using touch input, the previously selected item
  in a context menu would appear to be selected.
- **#2289** When changing the value of the mathfield, the selection is now
  preserved. In addition, when using a controlled component with React an
  unnecessary update is avoided.
- **#2282** Don't display selection when the mathfield is not focused
- **#2280** Handle better very deeply nested expressions
- **#2261** When a style was applied to an empty range, the style was ignored.
- **#2208** When setting a variant style (i.e. blackboard, fraktur, etc...) the
  style is no longer adopted by subsequent characters.
- **#2104**, **#2260** When replacing the selection by typing, the new content
  would not always be correctly styled. The content now inherits the style of
  the selection, or the style of the insertion point if the selection is
  collapsed.
- Better handle the case where the mathlive library gets loaded before the DOM
  is constructed.
- On Safari, the Insert Matrix submenu was displayed incorrectly.
- When the mathfield is an iframe, the `before-virtual-keyboard-toggle` and
  `virtual-keyboard-toggle` events are now dispatched on the
  `window.mathVirtualKeyboard` object of the iframe. This can be used to detect
  a request (and prevent) for the virtual keyboard to be displayed.
- If the unknown in an expression was a complex identifier, such as
  `\mathcal{C}` it would not be displayed correctly in the "Solve for" menu.
- The `\mathrlap` command was incorrectly rendering like `\mathllap`.

## 0.98.6 _2024-01-27_

### New Features

- Added `StaticRenderOptions.TeX.className` to specify that an element with the
  specified class name should be rendered as a LaTeX formula.
- **#2273** Added a `--keycap-width` CSS variable to specify the width of a
  keycap in a virtual-keyboard. By default, if the CSS variable is not
  specified, the width of the keycap is calculated based on the width of the
  parent container. However, this requires browser that support the `cq` CSS
  unit. If the browser does not support the `cq` CSS unit, this CSS variable can
  be used to specify the width of the keycap. (See **#2028**, **#2133**)
- **#2255** Support for `gather*` environment
- **#2242** A virtual keyboard keycap can now include a tooltip for its shifted
  variant.

### Issues Resolved

- When using some APIs such as `renderToMarkup()` or `renderToMathML()` in a
  server-side environment, a runtime error would occur.
- When tabbing in a mathfield with multiple prompts, tab out of the mathfield
  when the last or first prompt is reached.
- **#2243##, **#2245\*\* Unicode characters such as `²` or `ℂ` are now
  interpreted as their LaTeX equivalent only when in math mode.
- **#2237** The command `\iff` now renders correctly
- **#2246** Changing the `mf.value` property would not always update the value
  of the mathfield.
- **#2244** Worked around an issue in Safari on iOS where doing a double-tap on
  the virtual keyboard would result in the mathfield losing focus and the
  virtualy keyboard closing.
- **#2252** At some viewport sizes, the integral sign in the symbols virtual
  keyboard would be clipped.
- **#2235** Improved serialization to ASCIIMath.
- Avoid conflicts with some class names when rendering static math.
- When using `renderMathToElement()` or `renderMathInDocument()`, coalesce
  adjacent text nodes.
- Correctly parse the `\cfrac` optional alignment argument
- The commands `\bf`, `\bfseries`, `\mdseries`, `\upshape`, `\itshape`,
  `\slshape`, `\scshape`, `\rmfamily`, `\sffamily`, `\ttfamily` are now
  interpreted correctly.
- The command `\operatorname` is now spoken correctly
- **#2152** On Safari, fill-in-the-blank prompts containing a fraction were
  rendered incorrectly.
