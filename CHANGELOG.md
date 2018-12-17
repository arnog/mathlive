## 0.24

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
- Basic support for Latex macros. Macros can be defined with `MathField.config({macros:'...')` 
- Display alternate keys when a key on the virtual
keyboard is held down.
- Support for AZERTY, QWERTZ, Dvorak and Colemak virtual keyboards. Can be 
setup with `MathField.config({virtualKeyboardLayout:'...')`. Also, shift 
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
- Added customization of the command bar. See `MathField.config()` and 
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