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