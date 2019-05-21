## 0.29.1 (May 19, 2019)

### Bug fixes
- #201: the popover button was not responsive
- #195: (partial fix) improve support for Edge (still requires Babelization)
- Fixed an issue while dragging to select across elements of different depths
- Fixed issue with smartMode for expressions including "x^2", "xyz" and "\pi"
- Fixed an issue with styling, where the Latex output could sometimes include the non-existent `\mathup` command. The correct command is `\upshape`
- Fixed issues with enclose layout
- Avoid triggering spurious notifications while inserting an inline shortcut


## 0.29 (May 9, 2019)

### Major New Features
- Scrollable mathfield. The mathfield now behaves like a text area: the content
that does not fit withing the bounds of the mathfield will not overflow
but will be scrollable. The scrolling can be done using the mouse wheel or 
trackpad gestures, or by dragging while selecting. The AP

### Improvements
- When smartFence is on, and a new smart fence is inserted (by typing 
`(` for example), the closing 'phantom' fence would be displayed immediately
after the opening fence. The closing fence will now be inserted after
the end of the expression.
- The heuristics for determining implicit arguments, for example the implicit
numerator when typing `/` have been improved. For example, typing `/` after
`3 + 2sin x` will result in `3 + (2sin x)/(...)` instead of `3 + sin (x)/(...)`.
- When `config.removeExtraneousParentheses` is true (default), if a frac is 
inserted inside parentheses, the parens will be removed. So, if a `/` is typed 
after `1` in `(1)` it will become `1/(...)`.
- When smartMode is on, textual operators are eligible for conversion to text.
Previously, if an inline shortcuts for `rad` was defined to `\operatorname{rad}`
and 'radius' was typed, only `ius` would be turned to text.
- Smartmode is now applied when there is a selection. That is, if some text is 
selected and the `/` is pressed the selection will become the numerator. Previously
the selection was deleted and replaced with an empty fraction
- Improved layout of surds, particularly when the surd is empty
- Made `\mathbb{}` et al. apply to the argument only, and not affect the style
of following characters. Previously, if a `\mathbb{R}` was inserted, the following
typed character would also be in Blackboard style.
- Improved build system on Windows. That is, it now works.
- Merge speak and readAloud APIs into one (contribution from Neil. Thanks Neil!)
- Switched to using `npm ci` for CI builds. Even for local builds,
it is recommended to use `npm ci` to ensure the correct version of the dependencies
are installed.
- In smartMode, the currency symbols are handled better. "One apple is $3.14" 
will result in the "$" being in math mode.
- Switching to/from command mode will not suppress smart mode.

### Bug fixes
- Fixed a crash when using smartFence with `sin(x^2/`
- Fixed `alt+=` keyboard shortcut on Windows.
- Fixed some layout issues with `box` and `enclose`
- Smart Fences will now work when invoked from the virtual keyboard.
- Fixed #177: custom localization strings are now handled correctly.
- Fixed some issues toggling style when selection is empty.

## 0.28 (Apr 22, 2019)
This release contains some small bug fixes and improvements.

- Reduced Node version required (for dev builds) to Node LTS
- Fixed some issues with focus state of mathfields, particularly with multiple mathfields on a page
- Fixed an issue with some keys (such as /) on international keyboards (such as QWERTZ)
- Made `moveToOpposite` correctly select the opposite superscript/subscript
- Use the correct font for `\operatorname`, even for single character operators
- Send content change notifications when array cells are created
- Fixed a layout issue with upsized (`\huge`) content in fractions
- More accurate layout for `box` atoms (with `\bbox`, `\colorbox`, `\boxed` and `\fcolorbox`)
- Fixed an issue where units after an exponent were not recognized
- Fixed an issue displaying virtual keyboard on narrow Android phones

### New Features
- Added support for applying size to the selection with `applyStyle({size:'size9'})` (default size is `size5`, smallest is `size1`, largest is `size10`).
- Added support for `npm run start` which will start a local web server for ease of debugging (some features, such as using JavaScript native modules, require a local server)

## 0.27 (Apr 8, 2019)
### Breaking Changes
- The syntax that MathJSON/MASTON can recognized has been significantly expanded. It also has been made more consistent, and in some cases it may be different than what was previously returned.
- Future breaking change: the selector `enterCommandMode` will be deprecated and replaced by the more general `switchMode('command')`. The selector `switchMode('command')` is available in this release, and `enterCommandMode` is supported as well but it will be removed in a future release and you should migrate to `switchMode()` as soon as possible.

### Major New Features
#### Text Mode (#153)
It was previously possible to enter text in an equation using the `\text{}` command and its family using the command mode. However, this feature was only suitable for advanced users, and had many limitations (text could not include spaces, for example).

MathLive now fully support a dedicated text mode. 

To switch between math and text mode, use the `alt/option+=` keyboard shortcut, or programmatically using `mf.$perform(['apply-style', {mode: 'math'}])`.
If there is a selection it will be converted to the specified mode (math is converted to ASCII Math). If there's no selection, the next user input will be considered to be in the specified mode. 

The current mode can also be changed using `mf.$perform(['switch-mode', {mode: 'math'}])` without affecting the selection.

To indicate the current mode, a (slightly) different cursor is used (it's thinner in text mode). The text zones are also displayed on a light gray background when the field is focused.

A notification is invoked when the mode changes: `config.onModeChange(mf, mode)` with mode either `"text"`, `"math"` or `"command"`.

#### Smart Mode
If `config.smartMode = true`, during text input the field will switch automatically between 'math' and  'text' mode depending on what is typed and the context of the formula. If necessary, what was previously typed will be 'fixed' to account for the new info.

For example, when typing "if x >0":
- "i" -> math mode, imaginary unit
- "if" -> text mode, english word "if"
- "if x" -> all in text mode, maybe the next word is xylophone?
- "if x >" -> "if" stays in text mode, but now "x >" is in math mode
- "if x > 0" -> "if" in text mode, "x > 0" in math mode

Smart Mode is off by default.

Manually switching mode (by typing `alt/option+=`) will temporarily turn off smart mode.

**Examples**
- slope = rise/run
- If x > 0, then f(x) = sin(x)
- x^2 + sin (x) when x > 0
- When x<0, x^{2n+1}<0
- Graph x^2 -x+3 =0 for 0<=x<=5
- Divide by x-3 and then add x^2-1 to both sides
- Given g(x) = 4x – 3, when does g(x)=0?
- Let D be the set {(x,y)|0<=x<=1 and 0<=y<=x}
- \int_{the unit square} f(x,y) dx dy
- For all n in NN

#### Styling
It is now possible to apply styling: font family, bold, italic, color and background color. This information is rendered correctly across math and text mode, and preserved in the LaTeX output.

The key to control styling is the `$applyStyle(style)` method:

If there is a selection, the style is applied to the selection.

If the selection already has this style, it will be removed from it. If the selection has the style partially applied, i.e. only on some portions of the selection), it is removed from those sections, and applied to the entire selection.

If there is no selection, the style will apply to the next character typed.

- **style**  an object with the following properties. All the 
properties are optional, but they can be combined.
- **style.mode** - Either `'math'`, `'text'` or `'command'`
- **style.color** - The text/fill color, as a CSS RGB value or a string for some 'well-known' colors, e.g. 'red', '#f00', etc...
- **style.backgroundColor** - The background color.
- **style.fontFamily** - The font family used to render text.
This value can the name of a locally available font, or a CSS font stack, e.g.
"Avenir", "Georgia, Times, serif", etc...
This can also be one of the following TeX-specific values:
    - `'cmr'`: Computer Modern Roman, serif
    - `'cmss'`: Computer Modern Sans-serif, latin characters only
    - `'cmtt'`: Typewriter, slab, latin characters only
    - `'cal'`: Calligraphic style, uppercase latin letters and digits only
    - `'frak'`: Fraktur, gothic, uppercase, lowercase and digits
    - `'bb'`: Blackboard bold, uppercase only
    - `'scr'`: Script style, uppercase only
- **style.fontSeries** - The font 'series', i.e. weight and 
stretch ("series" is TeX terminology). The following values can be combined, for example: "ebc": extra-bold, condensed. These attributes may not have visible effect if the font family does not support this style:
    - `'ul'` ultra-light weight
    - `'el'`: extra-light
    - `'l'`: light
    - `'sl'`: semi-light
    - `'m'`: medium (default)
    - `'sb'`: semi-bold
    - `'b'`: bold
    - `'eb'`: extra-bold
    - `'ub'`: ultra-bold
    - `'uc'`: ultra-condensed
    - `'ec'`: extra-condensed
    - `'c'`: condensed
    - `'sc'`: semi-condensed
    - `'n'`: normal (default)
    - `'sx'`: semi-expanded
    - `'x'`: expanded
    - `'ex'`: extra-expanded
    - `'ux'`: ultra-expanded
- **style.fontShape** - The font 'shape' (again, TeX terminology), i.e. italic or condensed.
    - `'it'`: italic
    - `'sl'`: slanted or oblique (often the same as italic)
    - `'sc'`: small caps
    - `'ol'`: outline
 


#### Contextual Inline Shortcuts

Previously, some shortcuts would get triggered too frequently, for example when typing "find", the "\in" shortcut would get triggered.

Now, a shortcut can be defined with some pre-conditions. It is still possible to define a shortcut unconditionally, and thus if you are using custom inline shortcuts, they do not need to be updated:

```javascript
    config.inlineShortcuts = {
        'in': '\\in'
    }
```

However, a shortcut can now be specified with an object:

```javascript
    config.inlineShortcuts = {
        'in': {
            mode: 'math',
            after: 'space+letter+digit+symbol+fence',
            value: '\\in',
        },
    }
```

The `value` key is required an indicate the shortcut substitution.

The `mode` key, if present, indicate in which mode this shortcut should apply, either `'math'` or `'text'`. If the key is not present the shortcut apply in both modes.

The `'after'` key, if present, indicate in what context the shortcut should apply. One or more values can be specified, separated by a '+' sign. If any of the values match, the shortcut will be applicable. Possible values are:
- `'space'`     A spacing command, such as `\quad`
- `'nothing'`   The begining of a group
- `'surd'`      A square root or n-th root
- `'frac'`      A fraction
- `'function'`  A function such as `\sin` or `f` 
- `'letter'`    A letter, such as `x` or `n`
- `'digit'`     `0` through `9`
- `'binop'`     A binary operator, such as `+`
- `'relop'`     A relational operator, such as `=`
- `'punct'`     A punctuation mark, such as `,`
- `'array'`     An array, such as a matrix or cases statement
- `'openfence'` An opening fence, such as `(`
- `'closefence'` A closing fence such as `}`
- `'text'`      Some plain text




#### Other Features
- Arrays, matrices and cases can now be edited. To create a a matrix, after a `(` or a `[`, type some content then `[RETURN]`: a second row will be added to the matrix. Similarly, typing `[RETURN]` after a `{` will create a cases statements.
    - To insert a new row, type `[RETURN]`
    - To insert a new column, type `alt/option+,` (comma), the Excel shortcut for this operation.
- Support for `\emph` (emphasis) command, which can be used to (semantically) highlight an element. This command works both in text and math mode (it only works in text mode in TeX). For example: 
```tex
\text{In the formula}\emph{x}+1=0\text{x is the \emph{unknown}}
```
- Support for `\cssId` and `\class` commands. These are non-standard TeX commands which are supported by MathJax.
    - `\cssId{id}{content}` Attaches an id attribute with value `id` to the output associated with content when it is included in the HTML page. This allows your CSS to style the element, or your javascript to locate it on the page.
    - `\class{name}{content}` Attaches the CSS class `name` to the output associated with content when it is included in the HTML page. This allows your CSS to style the element.
- `config.removeExtraneousParentheses` (true by default) extra parentheses, for example around a numerator or denominator are removed automatically. 
Particularly useful when pasting content.
- Improvements to clipboard handling, pasting and copying. Now supports pasting of ASCIIMath and UnicodeMath (from MS Word) and LaTeX.
- Support for output of ASCIIMath using `mf.$text('ASCIIMath')` and 
`mf.$selectedText('ASCIIMath')` 
- `config.smartSuperscript` If `true` (default), when a digit is entered in an empty superscript, the cursor leaps automatically out of the superscript. This makes entry of common polynomials easier and faster. 
- `config.scriptDepth` Controls how many levels of subscript/superscript can be entered. By restricting, this can help avoid unwanted entry of superscript and subscript. By default, there are no restrictions.
- #156: localization support, including French, Italian, Spanish, Polish and Russian.
- New visual appearance for selected elements.


### Other Improvements
- When in command mode (after pressing the '\' or 'ESC' key), pressing these keys will have the indicated effect:
    - `[ESC]`: discards entry and return to math mode
    - `[TAB]`: accept suggestion and enter it
    - `[RETURN]`: enter characters typed so far, ignoring any suggestion.
- #132: Support for smart fence with `{}`, and `\langle`. 
- Pressing the spacebar next to a closing smartfence will close it. Useful
for semi-open fences.
- Improved rendering performance by 8%
- Updated SRE support
- Improvements to undo/redo support. Fix #137, #139 and #140.
- Significant improvements to the Abstract Syntax Tree generation 
(MASTON/MathJSON), including #147
- Keyboard shortcuts that override inline shortcuts and Smart Fence: `option/alt+|`, `option/alt+\`. Also available are `option/alt+(` and `option/alt+)`

### Bug Fixes
- #155: A cases statement (or a matrix) can now be deleted. The rows and columns inside a cases statement (or a matrix) can also be deleted.
- #133: Clicking on a placeholder selects it.
- Fixed issue with positioning of Popover panel.
- Correctly render `\ulcorner`, `\urcorner`, `\llcorner` and `\rrcorner`
- #141: Improved interaction of placeholders and smart fences
- #136: Close open smart fence with moveAfterParent only when at the closing 
of a smart fence
- #142: MathML output: supports sup/sub applied to a function
- Improved handling of shortcuts.
- #149: Fix handling of `\prime` and `\doubleprime`
- #111: Fix issue where a subscript followed a superscript and were not 
properly combined.
- #118. Improved navigating out of inferior limits
- Improve visual blinking when selecting with the mouse to the left

## 0.26 (Feb 4, 2019)

### Breaking Changes
- Public method now start with `$`. This convention is also used, for example, 
by the Vue.js project. For now, aliases exist that begin with '_' (the previous
convention), however you are encourage to migrate as soon as possible. The 
function that are affected are: `_el()`, `_insert()`, `_keystroke()`, `_latex()`,
 `_perform()`, `_revertToOriginalContent()`, `_selectedText()`, 
 `_selectionAtEnd()`, `_selectionAtStart()`, `_selectionDepth()`, 
 `_selectionIsCollapsed()`, `_setConfig()`, `_text()`, `_typedText()` (this was initially implemented in 0.25)

### Major New Features
- Support for dark mode. Triggered automatically by the browser or
by setting `theme="dark"` on the `<body>` tag.
- New implementation for inline shortcuts. Now support complex inline 
shortcuts including `_`, `(` and other keys.
- Virtual Keyboards can now be described using a JSON data structure. Contribution from @rpdiss. Thanks!
- New `MathLive.toSpeakableText()` function
- New `config.onAnnounce` handler


### Other Improvements
- The `$perform()` function now accepts selector both in camelCase
or kebab-case.
- Improved display of some keys in the keyboard caption panel
- New logo!
- Improved documentation, including adding pages for keyboard shortcuts,
examples, macros, selectors and config options.
- Better support for IE11 via transpiling (thanks @synergycodes!)

### Bug fixes
- #103 - Fixed issues where the math path could become invalid. Also made the 
code more resilient to invalid paths.
- #128 - Properly cleanup event handlers on destruction

### Codebase Health and Performance
- Some minor optimizations and performance improvements, including
lazy loading of sounds and some other resources.
- Moved some modules to classes.

## 0.25 (December 29, 2018)

### Major New Features
- A Vue.js wrapper and example is available in `examples/vue`

### Bug fixes
- #104 - Numeric keypard "/" was ignored.
- #91 - Handling of '~' as an operator and a shortcut.

## 0.24 (December 16, 2018)

### Breaking Changes
- Several handlers had some inconsistent signatures, or in some cases passed
invalid values as their arguments. This has been fixed, but it 
required changing the signature of some handlers. For consistency, the first 
argument of the handlers now refers to the mathfield to which it applies.

```javascript
    MathLive.makeMathField('input', {
        onContentDidChange: mf => {
            document.getElementById('output').innerHTML = mf.latex();
        }
    });
```

Keep in mind that arrow functions lexically bind their context, so `this` 
actually refers to the originating context (not to the mathfield).

The affected handlers are:
- `onFocus`
- `onBlur`
- `onKeystroke`
- `onMoveOutOf`
- `onTabOutOf`
- `onContentWillChange`
- `onContentDidChange`
- `onSelectionWillChange`
- `onSelectionDidChange`
- `onUndoStateWillChange`
- `onUndoStateDidChange`
- `onVirtualKeyboardToggle`
- `onReadAloudStatus`

It is recommended that you check if you use any of those handlers and 
validate their signatures.

### Major New Features
- Support for native JavaScript modules, contributed by 
Jason Boxman (https://github.com/jboxman). Thanks, Jason!

The previous method, using a `<script>` tag, is still supported:
```html
    <script src="../../dist/mathlive.js"></script>
```
but it is recommended to use native JavaScript modules:
```html
    <script type='module'> 
        import MathLive from '../../dist/mathlive.mjs';
    </script>
```
(note the `.mjs` extension indicating this is a JavaScript module).

A few caveats about using modules:
- JavaScript modules are automatically in strict mode
- To use JavaScript modules you need to be in your own module. With a `<script>`
tag, this is indicated by adding the `type='module'` attribute. The code inside
a module is not leaked to the global scope, the module has its own scope. As a
result, functions defined inside the module (inside your `<script>` tag) will
not be visible outside the module. You will need to either attach them to a 
global object (such as `window`) or in the case of even handlers, attach them
to the relevant element, using `addEventListener`.

See `examples/basic/index.esm.html` for a complete example.

If you were previously loading the non-minified version, that is the raw sources,
which can be useful to debug issues, you need to use modules to load them, while
you may have used `requirejs` previously. The sources are now included in the 
distribution for this purpose.

Instead of:
```javascript
    define(['mathlive/src/mathlive'], function(MathLive) {
        MathLive.makeMathField(/*...*/);
    }
```
use:
```javascript
    import MathLive from '../../dist/src/mathlive.js';
    MathLive.makeMathField(/*...*/);
```
- Support for SRE (Speech Rule Engine) from Volker Sorge. Optional, and needs
to be installed separately.
- Improved text to speech support, including karaoke mode (read aloud with 
synchronized highlighting)
- New configuration setting to control the spacing between elements, 
`horizontalSpacingScale`. Supplying a value > 1.0 can improve readability for 
some users.
- Added notifications when undo state change, `onUndoStateWillChange` and 
`onUndoStateDidChange`
- Added support for correctly inserting rows and columns in arrays.

### Other Improvements
- Fixes in MASTON
- Improved cross-browser accessibility support
- Fix MathML output for superscripts
- Fix issue #75 (autoconvert would fail in some cases)
- Fix issue #114. Incorrect selection when shift-select at the end.
- Fix issue #78. Cross-out positioning issue


## 0.22 (April 11, 2018)

### Major New Features
- Support for styling in the virtual keyboard UI: the text and highlight 
color can be adjusted to emphasize a portion of a formula
- Smart Fences. When a fence ("(", "{", etc...) is inserted, a matching 
closing fence is automatically inserted, displayed as a greyed out placeholder.<br>
The Latex code inserted will vary depending on the context where the insertion
is made, either standalone characters (`(`) or `\left...\right`. This feature
is on by default and can be turned off with `config.smartFence`. <br>Option-9 
and Option-0, as well as `\(` and `\)` will override the setting and insert
a plain old parenthesis.
- `\mleft...\mright`. Similar to `\left...\right` (i.e. grow in height depending
on its content) but with vertical spacing before and after similar to `\mathopen`
and `\mathclose`. Used automatically by smart fences after a function such
as `\sin` or `f`.
- Haptic and audio feedback for the virtual keyboard.<br>Haptic feedback is available on 
Android only. <br> Two new config options to control it. `config.keypressVibration`,
which is on by default, control the haptic feedback. `config.keypressSound`
control the audio feedback (off by default). Specify the URL to a sound file 
to be played when a key on the virtual keyboard is pressed, or an object with 
a `delete`, `return`, `spacebar` and `default` (required) keys to specify
different sounds for those keys.

### Other New Features
- When a fraction is inserted, for example by pressing '/', the items before
the insertion point are considered as potential numerator. This now include 
parenthesized expressions and roots. In the case of parenthesized expressions,
the parentheses are removed before being adoped for the numerator.
- MASTON: Use Unicode to represent math-variant letters (e.g. ℂ)
- Convert math-variant letters encoded in Unicode to Latex when pasting (e.g. ℂ
becomes `\C`, 𝕰 becomes `\mathord{\mathbf{\mathfrak{E}}}`
- MASTON: Commutativity support. a + b + c -> add(a, b, c)
- MASTON: Right and left-associativity support ('=' and '=>' are right associative)
- Improvements to the delete behavior: when to the right of a `\left...\right`
deletes remove the closing fence, not the whole expression. Same for root,
fractions, and other groups. When at the beginning of a denominator, pressing
delete will remove the fraction, but keep numerator and denominator, etc...
- When using the command virtual keyboard, switch to command mode as necessary.
- Added `MathAtom.skipBoundary`. When true, navigating into/out of the atom 
the last/first element will be skipped. For example, with `\textcolor{}` this
implements a behavior similar to word processors.

### Bug fixes
- Fixed #63: improved displayed of `\enclose` over stacked atoms such as 
fractions and `\overset`
- Fixed issue with selecting sparse arrays
- Make `\bigl` et al. properly selectable

### Code Maintenance and Performance
- Moved operator precedence and canonical names from Definitions to MASTON.
- Improved rendering performance by eliminating hotspots through profiling.

## 0.21 (March 30, 2018)
### Major New Features
- Basic support for Latex macros. Macros can be defined with `MathField.$setConfig({macros:'...')` 
- Display alternate keys when a key on the virtual
keyboard is held down.
- Support for AZERTY, QWERTZ, Dvorak and Colemak virtual keyboards. Can be 
setup with `MathField.$setConfig({virtualKeyboardLayout:'...')`. Also, shift 
clicking on the keyboard icon toggles between layouts.

### Other New Features
- Toggle the virtual keyboard layer when the shift
key is pressed
- New `onVirtualKeyboardToogle` handler will get called when the visibility of 
the virtual keyboard changes. Useful to scroll into view important content that 
might be obscured by the keyboard.
- Some common functions added as inline shortcuts:
`limsup`, `liminf`, `argmin`, `argmax`, `bessel`, `mean`, `median`, `fft`.
- Added `\rd` command (synonym with `\differentialD` and used by Proof Wiki)
- Added a format option (`latex-expanded`) to `MathField.text()` and `MathField.selectedText()` to return Latex with macros expanded.
- Removed restrictions on charset in `text`
- Support shift + arrows to extend the selection with the virtual keyboard


### Bug Fixes
- More accurate operator precedence. Follow the [MathML](www.w3.org/TR/MathML3/appendixc.html) recommendation, except for arrows that are given a way too high priority in MathML.
- Correctly output to Latex the `\unicode` command
- When undoing, correctly restore the selection
- Improved behavior when inserting superscript and
subscript on a selected item
- Fixed handling of unbalanced `\left`...`\right` sequences
- Correctly output the minus sign to Latex (as U+002D not as U+2212)
- Fixed some cases where the layout would shift by a couple of pixels as you 
navigated into the expression

### Code Maintenance and Performance
- Use `.test()` instead of `.match()` whenever possible
- Eliminated `.value` and `.children` in Math Atoms. It's only `.body` now.
- Avoid unnecessary rendering while tracking the pointer
- Refactored the Popover code into `Popover.js`
- Moved some content from `Definitions.js` and into `Popover.js`


## 0.20 (March 24, 2018)
### Major New Features
- Virtual keyboards with multi-touch support
- BREAKING CHANGE: the command bar is no longer supported. Use virtual keyboards instead.

### Other New Features
- Added support for wide layouts to virtual keyboard. If space is available, up 
to four more columns of keys can be displayed.
- Added Copy button to virtual keyboard
- Allow 'space' in command mode
- MASTON: improved parsing of numbers
- Handle Unicode pseudo-superscript characters as exponents

## 0.19 (March 19, 2018)
### Majore New Features
- MASTON: first implementation
- Support selecting cells in arrays

### Other New Features
- MASTON: handle complex numbers and modulo
- Added option for styling of keyboard glyph
- Improved output to Latex for arrays
- Additional trig and long functions (`\lb`, `\arsinh`, `\arcosh`, `\artanh`, 
`\arcsech`, `\arccsh`, `\arcsec`, `\arccsc`)
- MathML: more robust handling of complex `<mo>`
- MathML: improved handling of fences
- Improved Latex output

### Bug Fixes
- Correctly handle latex output for the `\char` command
- Correctly handle invalid Unicode code points in the `\char` command
- Correctly output MathML for extended Unicode characters and `\char` command
- Correctly handle selection in sparse arrays
- Correct spacing issue of selected items
- Fixed #17: correctly extend the selection when the anchor is at the end of 
the selection
- The caret would not blink in empty supsub
- The last character of the selection would not be copied on the clipboard
- MathML: don't insert `&invisibleTimes;` for factorial, but *do* insert it 
before a fence.
- Going up from a numerator longer than the denominator could hang.
- MathML and Latex output: better handling of `\Big` (etc...) delimiters
- MathML: do not render `\text` as `<mi>`
- Latex output: handle the `\math...` (`\mathop`, `\mathbin`...) family of functions
- Properly parse custom operators
- Commands with multiple keyboard shortcuts would not display correctly in the Popover panel


### Code Maintenance and Performance
- Reduce the amount of markup generated, avoid generating markup for empty spans.
- Updated fonts from KaTeX


## 0.18 (March 4, 2018)
### Bug Fixes
- Fixed issue where `\underset` annotation was not selectable
### Code Maintenance and Performance
- Reverted back to WebPack 3
- Simplified CSS and streamlined markup for `vlist` spans.

## 0.0.17 (February 27, 2018)
### New Features
- Improved accessibility support (major contribution from Neil Soiffer)
- Support for MathML output and Latex to MathML conversion.

### Bug Fixes
- #26 Fixed issue with Chrome 62 where fraction lines and other thin lines would
  intermittently not render.
- #20, #51. Ensure that a placeholder is always present for numerator, 
    denominator.
- #21. Do not allow sub-elements of an enclose element to be selected.
- Font-size will now respect font-size specified by the parent element. As
a result of this non-backward compatible change, the size of the equation
may now be different than it was. To ensure that the size remains the same
as before, specify a font-size property on the parent element with a 
value of 16px.
- #29. Correctly handle $ and @ as inlineShortcuts
- Improved handling of undo.
- New implementation of \enclose notations.


## 0.0.16 (September 13, 2017)

### Deprecated Features
- `MathField.write()` has been deprecated. Use `MathField.insert()` instead.

### New Features

- Added `MathField.selectedText()` which returns the textual content of the 
selection.

### Bug Fixes
- Perform a snapshot with the undo manager when invoking `MathField.insert()`.
- Documentation improvements.

## 0.0.15 (July 1, 2017)

### New Features
- Properly exported public API, including `renderMathInDocument()` and 
`renderMathInElement()`
- Added \enclose command, implementing the [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose) equivalent.
- Added \cancel, \bcancel and \xcancel commands
- Added  `preserveOriginalContent` option to `MathLive.renderMathIn...()`
- Made `\backslash` work in text mode, for example when an argument of `\rlap{}`
- Added `MathField.revertToOriginalContent()` when a math field is no longer 
needed for an element
- Added customization of the command bar. See `MathField.$setConfig()` and 
`config.commands`
- Added `MathLive.revertToOriginalContent()` and `MathLive.getOriginalContent()`
- Added optional namespacing of `data-` attributes
- Added `onContentWillChange` and `onContentDidChange` handlers in the math 
field config object.
- Added tutorials and improved documentation

### Bug Fixes
- Fixed #5: AZERTY keyboard input was misbehaving, particularly for the `^` key
- Dead keys (`´`, `^`, `¨`, `˜` and others on some keyboards) were not properly 
handled
- Complex emojis (emojis made of multiple codepoints, such as emojis with skin 
tone modifiers, or emojis with a ZERO WIDTH JOINER, such as the David Bowie 
emoji) would be incorrectly recognized as multiple symbols
- Fixed the `\color` command
- Properly roundtrip to LaTeX `\rlap`, `\color` and many other commands. Now, 
copying content using these commands in a math field will result in the correct 
LaTeX code to be generated.