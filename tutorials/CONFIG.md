These configuration options can be passed to {@linkcode module:MathLive#makeMathField MathLive.makeMathField()}
or {@linkcode module:editor/mathfield#MathField#setConfig MathField.\$setConfig()}.

---

**`config.locale`**:`string`

The locale (language + region) to use for string localization.

If not is provided, the locale of the browser is used.

---

**`config.strings`**:`object`

An object whose keys are a locale string, and whose values are an object of
string identifier to localized string.

Example:

```
{
   'fr-CA': {
      'tooltip.undo': 'Annuler',
      'tooltip.redo': 'Refaire',
   }
}
```

This will override the default localized strings.

---

**`config.horizontalSpacingScale=1.0`**:`number`

Scaling factor to be
applied to horizontal spacing between elements of the formula. With a value
greater than 1.0, can be used to improve the legibility.

---

**`config.namespace=''`**:`string`

Namespace that is added to `data-`
attributes to avoid collisions with other libraries.

It is empty by default.

The namespace should be a string of lowercase letters.

---

**`config.substituteTextArea`**:`function`

A function that returns a focusable element that can be used to capture text input.

An (invisible) DOM element is used to capture the keyboard events. By default,
this element is a `<textarea>` on desktop and a `<span>` on mobile devices,
to prevent the device virtual keyboard from being displayed.

This function provides the option of substituting the DOM element used for
keyboard capture

---

**`config.defaultMode`**:`string`

One of `"math"` or `"text"`. Indicate the input mode that the mathfield
will be in when created.

---

**`config.onFocus`**:`function(mathfield:MathField)`

Invoked when the mathfield has
gained focus

---

**`config.onBlur`**:`function(mathfield:MathField)`

Invoked when the mathfield has
lost focus

---

**`config.onKeystroke`**:`function(mathfield:MathField, keystroke:string, ev:Event):boolean`

Invoked when a keystroke is about to be processed.

-   `keystroke`: a string describing the keystroke
-   `ev`: the native keyboard event.

Return `false` to stop the handling of the event.

---

**`config.onAnnounce`**: `function(mathfield:MathField, command: string, before: atoms[], after: atoms[])`

Invoked when a command has modified the selection or content. This is an
opportunity to provide accessible feedback on navigation and editing operations.

If no function is provided, a default implementation is used which uses an
`ARIA-live` region to provide descriptive feedback of the editing operations.

---

**`config.overrideDefaultInlineShortcuts=false`**:`boolean`

If `true` the default inline shortcuts (e.g. `p` + `i` = `π`) are ignored.

---

**`config.inlineShortcuts`**:`Object.<string, string>`

A map of shortcuts → replacement value.

For example `{ 'pi': '\\pi'}`.
If `overrideDefaultInlineShortcuts` is false, these shortcuts are applied
after any default ones, and can therefore override them.

---

**`config.inlineShortcutTimeout=0`**:`number`

Maximum time, in milliseconds,
between consecutive characters for them to be considered part of the same
shortcut sequence.

A value of 0 is the same as infinity: any consecutive
character will be candidate for an inline shortcut, regardless of the
interval between this character and the previous one.

A value of 250 will indicate that the maximum interval between two
characters to be considered part of the same inline shortcut sequence is
1/4 of a second.

This is useful to enter "+-" as a sequence of two characters, while also
supporting the "±" shortcut with the same sequence.
The first result can be entered by pausing slightly between the first and
second character if this option is set to a value of 250 or so.

---

** `macros`** ?: `object<string, string>`

A dictionary of LaTeX macros to be used to interpret and render the content.

For example:

```javascript
mf.$setConfig({
    macros: {
        smallfrac: '^{#1}\\!\\!/\\!_{#2}',
    },
});
```

The code above will support the following notation:

```tex
\smallfrac{5}{16}
```

---

**`config.smartFence=true`**:`boolean`

If `true`, when an open fence is
entered via `typedText()` it will generate a contextually appropriate markup,
for example using `\left...\right` if applicable.

If `false`, the literal value of the character will be inserted instead.

---

**`config.smartMode=false`**:`boolean`

If `config.smartMode = true`, during text input the field will switch automatically between 'math' and 'text' mode depending on what is typed and the context of the formula. If necessary, what was previously typed will be 'fixed' to account for the new info.

For example, when typing "if x >0":

-   "i" -> math mode, imaginary unit
-   "if" -> text mode, english word "if"
-   "if x" -> all in text mode, maybe the next word is xylophone?
-   "if x >" -> "if" stays in text mode, but now "x >" is in math mode
-   "if x > 0" -> "if" in text mode, "x > 0" in math mode

Smart Mode is off by default.

Manually switching mode (by typing `alt/option+=`) will temporarily turn off smart mode.

**Examples**

-   slope = rise/run
-   If x > 0, then f(x) = sin(x)
-   x^2 + sin (x) when x > 0
-   When x<0, x^{2n+1}<0
-   Graph x^2 -x+3 =0 for 0<=x<=5
-   Divide by x-3 and then add x^2-1 to both sides
-   Given g(x) = 4x – 3, when does g(x)=0?
-   Let D be the set {(x,y)|0<=x<=1 and 0<=y<=x}
-   \int\_{the unit square} f(x,y) dx dy
-   For all n in NN

---

**`config.smartSuperscript=true`**:`boolean`

If `true`, when a digit is entered in an empty superscript, the cursor
leaps automatically out of the superscript. This makes entry of common
polynomials easier and faster. If entering other characters (for example "n+1")
the navigation out of the superscript must be done manually (by using the cursor
keys or the spacebar to leap to the next insertion point).

If `false`, the navigation out of the superscript must always be done manually.

---

**`config.scriptDepth=Infinity`**:`number`

This controls how many levels of subscript/superscript can be entered.
For example, if `scriptDepth` is "1", there can be one level of superscript or
subscript. Attempting to enter a superscript while inside a superscript will be
rejected. Setting a value of 0 will prevent entry of any superscript or subscript
(but not limits for sum, integrals, etc...)

This can make it easier to enter equations that fit what's expected for the
domain where the mathfield is used.

To control the depth of superscript and subscript independently, provide an array:
the first element indicate the maximum depth for subscript and the second element
the depth of superscript. Thus, a value of `[0, 1]` would suppress the entry of
subscripts, and allow one level of superscripts.

---

**`config.removeExtraneousParentheses=true`**:`boolean`

If `true`, extra parentheses around a numerator or denominator are removed automatically.

---

**`config.ignoreSpacebarInMathMode=true`**:`boolean`

If `true`, when the spacebar is pressed, no space is inserted.

If `false`, a space is inserted when the spacebar is pressed.

---

**`config.virtualKeyboardToggleGlyph`**:`string`

If specified, the markup
to be used to display the virtual keyboard toggle glyph. If none is specified
a default keyboard icon is used.

---

**`config.virtualKeyboardMode=''`**:`string`

-   `'manual'`: pressing the virtual keyboard toggle button will show or hide
    the virtual keyboard. If hidden, the virtual keyboard is not shown when the
    field is focused until the toggle button is pressed.
-   `'onfocus'`: the virtual keyboard will be displayed whenever the field is
    focused and hidden when the field loses focus. In that case, the virtual
    keyboard toggle button is not displayed.
-   `'off'`: the virtual keyboard toggle button is not displayed, and the
    virtual keyboard is never triggered.

If the setting is empty, it will default to `'onfocus'` on touch-capable
devices and to `'off'` otherwise.

---

**`config.virtualKeyboards='all'`**:`string`

A space separated list of
the keyboards that should be available. The keyboard `'all'` is synonym with
`'numeric'`, `'roman'`, `'greek'`, `'functions'` and `'command'`

The keyboards will be displayed in the order indicated.

---

**`config.virtualKeyboardRomanLayout='qwerty'`**:`string`

The
arrangement of the keys for the layers of the roman virtual keyboard.

One of `'qwerty'`, `'azerty'`, `'qwertz'`, `'dvorak'` or `'colemak'`.

---

**`config.customVirtualKeyboardLayers`**:`Object.<string, string>`

Some additional
custom virtual keyboard layers.

A keyboard is made up of one or more
layers (think of the main layer and the shift layer on a hardware keyboard).
Each key in this object define a new keyboard layer (or replace an existing
one). The value of the key should be some HTML markup.

**See** {@link https://github.com/arnog/mathlive/tree/master/examples/virtual_keyboard virtual keyboard example}

---

**`config.customVirtualKeyboards`**:`object`

An object describing
additional keyboards.

Each key in the object is an ID for a separate keyboard.

The key should have a value made up of an object with the following keys:

-   `tooltip`: a string label describing the keyboard.
-   `label`: a string, displayed in the keyboard switcher to identify this
    keyboard
-   `layers`: an array of strings, the ID of the layers used by this keyboard.
    These layers should be defined using `customVirtualKeyboardLayers`.
-   `classes`: a string, the classes to be added to the label for this keyboard
    Possible values are 'tex' to use a TeX font to display the label.
-   `layer`: optional, the ID of the layer to switch to when the label of this
    keyboard is clicked on in the keyboard switcher.
-   `command`: optional, a selector to perform when the label is clicked.
    Either the `command` or `layer` key must be present.

**See** {@link https://github.com/arnog/mathlive/tree/master/examples/virtual_keyboard virtual keyboard example}

---

**`config.virtualKeyboardTheme='apple'`**:`boolean`

The visual theme used
for the virtual keyboard.

If empty, the theme will switch automatically based on the device it's
running on. The two supported themes are 'material' and 'apple' (the default).

---

**`config.keypressVibration='true'`**:`boolean`

When a key on the virtual
keyboard is pressed, produce a short haptic feedback, if the device supports
it.

---

**`config.keypressSound=''`**:`string`

When a key on the virtual
keyboard is pressed, produce a short audio feedback.
The value should be either a URL to a sound file or an object with the following keys:

-   `delete` URL to a sound file played when the delete key is pressed
-   `return` ... when the return/tab key is pressed
-   `spacebar` ... when the spacebar is pressed
-   `default` ... when any other key is pressed. This key is required, the
    others are optional. If they are missing, this sound is played as well.

---

**`config.plonkSound=''`**:`string`

Path to a URL to a sound file
which will be played to provide feedback when a command has no effect,
for example when pressing the spacebar at the root level.

---

**`config.readOnly='false'`**:`boolean`

If true, the mathfield cannot be edited.

---

**`config.textToSpeechRules='mathlive'`**:`string`

Specify which
set of text to speech rules to use.

A value of `mathlive` indicates that the simple rules built into MathLive
should be used.

A value of `sre` indicates that the Speech Rule Engine from Volker Sorge
should be used.

Note that SRE is not included or loaded by MathLive and for this option to
work SRE should be loaded separately.

**See** {@link https://github.com/arnog/mathlive/tree/master/examples/speech speech example}

---

**`config.textToSpeechMarkup=''`**:`string`

The markup syntax to use
for the output of conversion to spoken text.

Possible values are `ssml` for the SSML markup or `mac` for the macOS
markup, i.e. `[[ltr]]`.

---

**`config.textToSpeechRulesOptions={}`**:`object`

A set of key/value pairs
that can be used to configure the speech rule engine.

Which options are available depends on the speech rule engine in use.
There are no options available with MathLive's built-in engine. The options
for the SRE engine are documented
[here]{@link:https://github.com/zorkow/speech-rule-engine}

---

**`config.speechEngine='local'`**:`string`

Indicates which speech engine
to use for speech output.

Use `local` to use the OS-specific TTS engine.

Use `amazon` for Amazon Text-to-Speech cloud API. You must include the AWS
API library and configure it with your API key before use.

**See** {@link https://github.com/arnog/mathlive/tree/master/examples/speech speech example}

---

**`config.speechEngineVoice=''`**:`string`

Indicates the voice to use with
the speech engine.

This is dependent on the speech engine. For Amazon Polly,
see here: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

---

**`config.speechEngineRate=''`**:`string`

Sets the speed of the selected
voice.

One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a percentage.

Range is `20%` to `200%`
For example `200%` to indicate a speaking rate twice the default rate.

---

**`config.onMoveOutOf`**:`function(mathfield, direction:string):boolean`

A handler
invoked when keyboard navigation would cause the insertion point to leave the
mathfield.

The argument indicates the direction of the navigation, either
`"forward"` or `"backward"`.

Return `false` to prevent the move, `true` to wrap around to the start of the field.

By default, the insertion point will wrap around.

---

**`config.onTabOutOf`**:`function(mathfield, direction:string)`

A handler invoked when
pressing tab (or shift-tab) would cause the insertion point to leave the mathfield.

The argument indicates the direction of the navigation, either
`"forward"` or `"backward"`.

By default, the insertion point jumps to the next/previous focussable element.

---

**`config.onContentWillChange`**:`function(mathfield)`

A handler invoked
just before the content is about to be changed.

---

**`config.onContentDidChange`**:`function(mathfield)`

A handler invoked
just after the content has been changed.

---

**`config.onSelectionWillChange`**:`function(mathfield)`

A handler invoked
just before the selection is about to be changed.

---

**`config.onSelectionDidChange`**:`function(mathfield)`

A handler invoked
just after the selection has been changed.

---

**`config.onUndoStateWillChange`**:`function(mathfield, command:string)`

A handler invoked
before a change in the undo stack state. The `command` argument is a string
indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.

---

**`config.onUndoStateDidChange`**:`function(mathfield, command:string)`

A handler invoked
after a change in the undo stack state. The `command` argument is a string
indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.

---

**`config.onModeChange`**:`function(mathfield, mode:string)`

A handler invoked when the mode has changed.

The `mode` argument is the new mode, `"math"`, `"text"` or `"command"`.

---

**`config.onVirtualKeyboardToggle`**:`function(mathfield, visible:boolean, keyboard:HTMLDivElement)`

A handler
invoked after the virtual keyboard visibility has changed.

The `visible` argument is true if the virtual keyboard is visible.

The second argument is a DOM
element containing the virtual keyboard, which can be used to determine its
size, and therefore the portion of the screen it obscures.

---

**`config.onReadAloudStatus`**:`function(mathfield, status:string)`

A handler invoked
when the status of read aloud changes.

The `status` argument is a string denoting the status:

-   `"playing"` when reading begins
-   `"done"` when reading has been completed,
-   `"paused"` when reading has been temporarily paused by the user

---

**`config.handleSpeak`**:`function(string, config:object)`

A callback invoked to produce speech from
a string.

---

**`config.handleReadAloud`**:`function(string)`

A callback invoked to produce speech
and highlight the relevant atoms in an equation.

The input is SSML markup with appropriate `<mark>` tags.
