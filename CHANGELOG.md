

## 0.21 (March 30, 2018)
### Major New Features
- Basic support for Latex macros. Macros can be defined with `MathField.config({macros:'...')` 
- Display alternate keys when a key on the virtual
keyboard is held down.
- Support for AZERTY, QWERTZ, Dvorak and Colemak virtual keyboards. Can be setup with `MathField.config({virtualKeyboardLayout:'...')`. Also, shift clicking on the keyboard icon toggles between layouts.

### Other New Features
- Toggle the virtual keyboard layer when the shift
key is pressed
- New `onVirtualKeyboardToogle` handler will get called when the visibility of the virtual keyboard changes. Useful to scroll into view important content that might be obscured by the keyboard.
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
- Fixed some cases where the layout would shift by a couple of pixels as you navigated into the expression

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
- Added support for wide layouts to virtual keyboard. If space is available, up to four more columns of keys can be displayed.
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
- Additional trig and long functions (`\lb`, `\arsinh`, `\arcosh`, `\artanh`, `\arcsech`, `\arccsh`, `\arcsec`, `\arccsc`)
- MathML: more robust handling of complex `<mo>`
- MathML: improved handling of fences
- Improved Latex output

### Bug Fixes
- Correctly handle latex output for the `\char` command
- Correctly handle invalid Unicode code points in the `\char` command
- Correctly output MathML for extended Unicode characters and `\char` command
- Correctly handle selection in sparse arrays
- Correct spacing issue of selected items
- Fixed #17: correctly extend the selection when the anchor is at the end of the selection
- The caret would not blink in empty supsub
- The last character of the selection would not be copied on the clipboard
- MathML: don't insert `&invisibleTimes;` for factorial, but *do* insert it before a fence.
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