#### horizontalSpacingScale
@param {number} [config.horizontalSpacingScale=1.0] - Scaling factor to be
applied to horizontal spacing between elements.

#### namespace 
@param {string} [config.namespace=''] - Namespace that is added to `data-`
attributes to avoid collisions with other libraries. It is empty by default.
The namespace should be a string of lowercase letters.

#### substituteTextArea
@param {function} [config.substituteTextArea] - A function that returns a
focusable element that can be used to capture text input. This can be
useful when a `<textarea>` element would be undesirable. Note that by default
on mobile devices the TextArea is automatically replaced with a `<span>` to
prevent the device virtual keyboard from being displayed.

#### onFocus
@param {function(mathfield)} [config.onFocus] - Invoked when the mathfield has gained focus

@param {function(mathfield)} [config.onBlur] - Invoked when the mathfield has
lost focus

@param {function(mathfield, keystroke:string, ev:Event):boolean} [config.onKeystroke] - Invoked when a keystroke is
about to be processed. 
- `keystroke` is a string describing the keystroke
- `ev` is the keyboard event. 

Return false to stop handling of the event.

@param {boolean} [config.overrideDefaultInlineShortcuts=false] - If true
the default inline shortcuts (e.g. 'p' + 'i' = 'π') are ignored.

@param {Object.<string, string>} [config.inlineShortcuts] - A map of 
shortcuts → replacement value. For example `{ 'pi': '\\pi'}`. 
If `overrideDefaultInlineShortcuts` is false, these shortcuts are applied 
after any default ones, and can therefore override them.

@param {number} [config.inlineShortcutTimeout=0] - Maximum time, in milliseconds, 
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

@param {number|string} [config.inlineShortcutConversionDelay=0] - Time, in 
milliseconds, before an inline shortcut is converted. 

If the value is 0, the inline shortcut is converted as soon as it is 
recognized. This can cause issues if there are overlapping shortcuts. 
For example, if there is a 'del' shortcut, the 'delta' shortcut would never 
get triggered. 

Setting a small value, for example 250 ms, ensures that the longer shortcut 
can be typed without triggering the first one. 

The value can also be set to 'auto', in which case the delay is 0 if the 
shortcut sequence is unambiguous and a small delay otherwise.

@param {boolean} [config.smartFence=true] - If true, when an open fence is
entered via `typedText()` it will generate a contextually appropriate markup,
for example using `\left...\right` if applicable. If false, the literal
value of the character will be inserted instead.

@param {boolean} [config.ignoreSpacebarInMathMode=true] - If true, when the 
spacebar is pressed, no space is inserted. If false, a space is inserted
when the spacebar is pressed.

@param {string} [config.virtualKeyboardToggleGlyph] - If specified, the markup 
to be used to display the virtual keyboard toggle glyph.

@param {string} [config.virtualKeyboardMode=''] - If `'manual'`, pressing the
command bar toggle will display a virtual keyboard instead of the command bar.
If `'onfocus'`, the virtual keyboard will be displayed whenever the field is
focused. In that case, the command bar toggle is not displayed.
When this setting is not empty, `config.overrideDefaultCommands` and
`config.commands` are ignored.

@param {string} [config.virtualKeyboards='all'] - A space separated list of
the keyboards that should be available. The keyboard `'all'` is synonym with:

`'numeric'`, `'roman'`, `'greek'`, `'functions'` and `'command'`

The keyboards will be displayed in the order indicated.

@param {string} [config.virtualKeyboardRomanLayout='qwerty'] - The
arrangement of the keys for the layers of the roman virtual keyboard.
One of `'qwerty'`, `'azerty'`, '`qwertz'`, '`dvorak`' or '`colemak`'.

@param {Object} [config.customVirtualKeyboardLayers] - Some additional
custom virtual keyboard layers. A keyboard is made up of one or more
layers (think of the main layer and the shift layer on a hardware keyboard).
Each key in this object define a new keyboard layer (or replace an existing
one). The value of the key should be some HTML markup.

@param {Object} [config.customVirtualKeyboards] - An object describing
additional keyboards. Each key in the object is an ID for a separate keyboard.
The key should have a value made up of an object with the following keys:
   tooltip: a string label describing the keyboard.
   label: a string, displayed in the keyboard switcher to identify this 
     keyboard
   layers: an array of strings, the ID of the layers used by this keyboard.
    These layers should be defined using `customVirtualKeyboardLayers`.
   classes: a string, the classes to be added to the label for this keyboard
Possible values are 'tex' to use a TeX font to display the label.
   layer: optional, the ID of the layer to switch to when the label of this
keyboard is clicked on in the keyboard switcher.
   command: optional, a selector to perform when the label is clicked.
Either the `command` or `layer` key must be present.


@param {boolean} [config.virtualKeyboardTheme=''] - The visual theme used
for the virtual keyboard. If empty, the theme will switch automatically
based on the device it's running on. The two supported themes are
'material' and 'apple' (the default).

@param {boolean} [config.keypressVibration='on'] When a key on the virtual 
keyboard is pressed, produce a short haptic feedback, if the device supports
it.

@param {boolean} [config.keypressSound=''] When a key on the virtual 
keyboard is pressed, produce a short audio feedback. The value should be 
either a URL to a sound file or an object with the following keys:
   `delete` URL to a sound file played when the delete key is pressed
   `return` ... when the return/tab key is pressed
   `spacebar` ... when the spacebar is pressed
   `default` ... when any other key is pressed. This key is required, the
others are optional. If they are missing, this sound is played as well.

@param {string} [config.plonkSound=''] Path to a URL to a sound file
which will be played to provide feedback when a command has no effect,
for example when pressing the spacebar at the root level.

@param {string} [config.textToSpeechRules='mathlive'] Specify which
set of text to speech rules to use. A value of `mathlive` indicates that
the simple rules built into MathLive should be used. A value of `sre`
indicates that the Speech Rule Engine from Volker Sorge should be used.
Note that SRE is not included or loaded by MathLive and for this option to
work SRE should be loaded separately.

@param {string} [config.textToSpeechMarkup=''] The markup syntax to use 
for the output of conversion to spoken text. Possible values are `ssml` for 
the SSML markup or `mac` for the MacOS markup (e.g. `[[ltr]]`)

@param {*} [config.textToSpeechRulesOptions={}] A set of value/pair that can
be used to configure the speech rule engine. Which options are available
depends on the speech rule engine in use. There are no options available with
MathLive's built-in engine. The options for the SRE engine are documented
[here]{@link:https://github.com/zorkow/speech-rule-engine}

@param {string} [config.speechEngine='local'] Indicates which speech engine
to use for speech output. Use `local` to use the OS-specific TTS engine.
Use `amazon` for Amazon Text-to-Speech cloud API. You must include the AWS
API library and configure it with your API key before use. See the 'speech'
example project for more details.

@param {string} [config.speechEngineVoice=''] Indicates the voice to use with
 the speech engine. This is dependent on the speech engine. For Amazon Polly,
see here: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

@param {string} [config.speechEngineRate=''] Sets the speed of the selected
voice. One of `x-slow, slow, medium, fast,x-fast` or a value as a percentage.
For example `200%` to indicate a speaking rate twice the default rate. Range
is `20%` to `200%`

@param {function(mathfield, direction:string):boolean} [config.onMoveOutOf] - A handler
invoked when keyboard navigation would cause the insertion point to leave the
mathfield. 

The argument indicates the direction of the navigation, either 
`"forward"` or `"backward"`. 

Return `false` to prevent the move, `true` to
wrap around to the start of the field.

By default, the insertion point will wrap around.

@param {function(mathfield, direction:string)} [config.onTabOutOf] - A handler invoked when
pressing tab (or shift-tab) would cause the insertion point to leave the mathfield.

The argument indicates the direction of the navigation, either 
`"forward"` or `"backward"`. 

By default, the insertion point jumps to the next/previous focussable element.

@param {function(mathfield)} [config.onContentWillChange] - A handler invoked
just before the content is about to be changed.

@param {function(mathfield)} [config.onContentDidChange] - A handler invoked
just after the content has been changed.

@param {function(mathfield)} [config.onSelectionWillChange] - A handler invoked
just before the selection is about to be changed.

@param {function(mathfield)} [config.onSelectionDidChange] - A handler invoked
just after the selection has been changed.

@param {function(mathfield, command:string)} [config.onUndoStateWillChange] - A handler invoked
before a change in the undo stack state. The `command` argument is a string
indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.

@param {function(mathfield, command:string)} [config.onUndoStateDidChange] - A handler invoked
after a change in the undo stack state. The `command` argument is a string
indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.

@param {function(mathfield, visible:boolean, keyboard:HTMLDivElement)} [config.onVirtualKeyboardToggle] - A handler
invoked after the virtual keyboard visibility has changed. 

The `visible` argument is true if the virtual keyboard is visible.

The second argument is a DOM
element containing the virtual keyboard, which can be used to determine its
size, and therefore the portion of the screen it obscures.

@param {function(mathfield, status:string)} [config.onReadAloudStatus] - A handler invoked
when the status of read aloud changes. 

The `status` argument is a string denoting the status:
- `"playing"` when reading begins
- `"done"` when reading has been completed,
- `"paused"` when reading has been temporarily paused by the user

@param {function(string, config:object)} [config.handleSpeak] - A callback invoked to produce speech from
a string.

@param {*} [config.handleReadAloud] - A callback invoked to produce speech
and highlight the relevant atoms in an equation. The input is SSML markup
with appropriate `<mark>` tags.