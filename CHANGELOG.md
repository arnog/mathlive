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