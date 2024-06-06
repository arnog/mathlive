
<a name="readmemd"></a>

## Commands

<a id="commands" name="commands"></a>

### Commands

To perform editing commands on a mathfield, use [`MathfieldElement.executeCommand`](#executecommand) with the commands below.

```ts
const mf = document.getElementById('mathfield');
mf.executeCommand('selectAll');
mf.executeCommand('copyToClipboard');
```

Commands return true if they resulted in a dirty state.

#### Command

executeCommand

#### Array

<a id="addcolumnafter" name="addcolumnafter"></a>

<MemberCard>

##### Commands.addColumnAfter()

```ts
addColumnAfter: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="addcolumnbefore" name="addcolumnbefore"></a>

<MemberCard>

##### Commands.addColumnBefore()

```ts
addColumnBefore: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="addrowafter" name="addrowafter"></a>

<MemberCard>

##### Commands.addRowAfter()

```ts
addRowAfter: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="addrowbefore" name="addrowbefore"></a>

<MemberCard>

##### Commands.addRowBefore()

```ts
addRowBefore: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="removecolumn" name="removecolumn"></a>

<MemberCard>

##### Commands.removeColumn()

```ts
removeColumn: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="removerow" name="removerow"></a>

<MemberCard>

##### Commands.removeRow()

```ts
removeRow: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="setenvironment" name="setenvironment"></a>

<MemberCard>

##### Commands.setEnvironment()

```ts
setEnvironment: (model, environment) => boolean;
```

• **model**: `Model`

• **environment**: `TabularEnvironment`

`boolean`

</MemberCard>

#### Auto-complete

<a id="complete" name="complete"></a>

<MemberCard>

##### Commands.complete()

```ts
complete: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="nextsuggestion" name="nextsuggestion"></a>

<MemberCard>

##### Commands.nextSuggestion()

```ts
nextSuggestion: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="previoussuggestion" name="previoussuggestion"></a>

<MemberCard>

##### Commands.previousSuggestion()

```ts
previousSuggestion: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

#### Clipboard

<a id="copytoclipboard" name="copytoclipboard"></a>

<MemberCard>

##### Commands.copyToClipboard()

```ts
copyToClipboard: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="cuttoclipboard" name="cuttoclipboard"></a>

<MemberCard>

##### Commands.cutToClipboard()

```ts
cutToClipboard: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="pastefromclipboard" name="pastefromclipboard"></a>

<MemberCard>

##### Commands.pasteFromClipboard()

```ts
pasteFromClipboard: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

#### Deleting

<a id="deleteall" name="deleteall"></a>

<MemberCard>

##### Commands.deleteAll()

```ts
deleteAll: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletebackward" name="deletebackward"></a>

<MemberCard>

##### Commands.deleteBackward()

```ts
deleteBackward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deleteforward" name="deleteforward"></a>

<MemberCard>

##### Commands.deleteForward()

```ts
deleteForward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletenextword" name="deletenextword"></a>

<MemberCard>

##### Commands.deleteNextWord()

```ts
deleteNextWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletepreviousword" name="deletepreviousword"></a>

<MemberCard>

##### Commands.deletePreviousWord()

```ts
deletePreviousWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletetogroupend" name="deletetogroupend"></a>

<MemberCard>

##### Commands.deleteToGroupEnd()

```ts
deleteToGroupEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletetogroupstart" name="deletetogroupstart"></a>

<MemberCard>

##### Commands.deleteToGroupStart()

```ts
deleteToGroupStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletetomathfieldend" name="deletetomathfieldend"></a>

<MemberCard>

##### Commands.deleteToMathFieldEnd()

```ts
deleteToMathFieldEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="deletetomathfieldstart" name="deletetomathfieldstart"></a>

<MemberCard>

##### Commands.deleteToMathFieldStart()

```ts
deleteToMathFieldStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

#### Other

<a id="applystyle-1" name="applystyle-1"></a>

<MemberCard>

##### Commands.applyStyle()

```ts
applyStyle: (mathfield, style) => boolean;
```

• **mathfield**: `Mathfield`

• **style**: [`Style`](#style-1)

`boolean`

</MemberCard>

<a id="commit" name="commit"></a>

<MemberCard>

##### Commands.commit()

```ts
commit: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="insert-1" name="insert-1"></a>

<MemberCard>

##### Commands.insert()

```ts
insert: (mathfield, s, options) => boolean;
```

• **mathfield**: `Mathfield`

• **s**: `string`

• **options**: [`InsertOptions`](#insertoptions)

`boolean`

</MemberCard>

<a id="insertdecimalseparator" name="insertdecimalseparator"></a>

<MemberCard>

##### Commands.insertDecimalSeparator()

```ts
insertDecimalSeparator: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="performwithfeedback" name="performwithfeedback"></a>

<MemberCard>

##### Commands.performWithFeedback()

```ts
performWithFeedback: (mathfield, command) => boolean;
```

Perform a command and include interactive feedback such as sound and
haptic feedback. This is useful to simulate user interaction,
for example for commands from the virtual keyboard

• **mathfield**: `Mathfield`

• **command**: `string`

`boolean`

</MemberCard>

<a id="plonk" name="plonk"></a>

<MemberCard>

##### Commands.plonk()

```ts
plonk: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="speak" name="speak"></a>

<MemberCard>

##### Commands.speak()

```ts
speak: (mathfield, scope, options) => boolean;
```

• **mathfield**: `Mathfield`

• **scope**: [`SpeechScope`](#speechscope)

How much of the formula should be spoken:
| | |
|---:|:---|
| `all` | the entire formula |
| `selection` | the selection portion of the formula |
| `left` | the element to the left of the selection |
| `right` | the element to the right of the selection |
| `group` | the group (numerator, root, etc..) the selection is in |
| `parent` | the parent of the selection |

• **options**

• **options.withHighlighting**: `boolean`

In addition to speaking the requested portion of the formula,
visually highlight it as it is read (read aloud functionality)

`boolean`

</MemberCard>

<a id="switchmode" name="switchmode"></a>

<MemberCard>

##### Commands.switchMode()

```ts
switchMode: (mathfield, mode) => boolean;
```

• **mathfield**: `Mathfield`

• **mode**: `ParseMode`

`boolean`

</MemberCard>

<a id="togglecontextmenu" name="togglecontextmenu"></a>

<MemberCard>

##### Commands.toggleContextMenu()

```ts
toggleContextMenu: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="togglekeystrokecaption" name="togglekeystrokecaption"></a>

<MemberCard>

##### Commands.toggleKeystrokeCaption()

```ts
toggleKeystrokeCaption: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="typedtext" name="typedtext"></a>

<MemberCard>

##### Commands.typedText()

```ts
typedText: (text, options) => boolean;
```

• **text**: `string`

• **options**

• **options.feedback**: `boolean`

If true, provide audio and haptic feedback

• **options.focus**: `boolean`

If true, the mathfield will be focused

• **options.simulateKeystroke**: `boolean`

If true, generate some synthetic
keystrokes (useful to trigger inline shortcuts, for example).

`boolean`

</MemberCard>

#### Prompt

<a id="insertprompt" name="insertprompt"></a>

<MemberCard>

##### Commands.insertPrompt()

```ts
insertPrompt: (mathfield, id?, options?) => boolean;
```

• **mathfield**: `Mathfield`

• **id?**: `string`

• **options?**: [`InsertOptions`](#insertoptions)

`boolean`

</MemberCard>

#### Scrolling

<a id="scrollintoview" name="scrollintoview"></a>

<MemberCard>

##### Commands.scrollIntoView()

```ts
scrollIntoView: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="scrolltoend" name="scrolltoend"></a>

<MemberCard>

##### Commands.scrollToEnd()

```ts
scrollToEnd: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="scrolltostart" name="scrolltostart"></a>

<MemberCard>

##### Commands.scrollToStart()

```ts
scrollToStart: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

#### Selection

<a id="extendselectionbackward" name="extendselectionbackward"></a>

<MemberCard>

##### Commands.extendSelectionBackward()

```ts
extendSelectionBackward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendselectiondownward" name="extendselectiondownward"></a>

<MemberCard>

##### Commands.extendSelectionDownward()

```ts
extendSelectionDownward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendselectionforward" name="extendselectionforward"></a>

<MemberCard>

##### Commands.extendSelectionForward()

```ts
extendSelectionForward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendselectionupward" name="extendselectionupward"></a>

<MemberCard>

##### Commands.extendSelectionUpward()

```ts
extendSelectionUpward: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtogroupend" name="extendtogroupend"></a>

<MemberCard>

##### Commands.extendToGroupEnd()

```ts
extendToGroupEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtogroupstart" name="extendtogroupstart"></a>

<MemberCard>

##### Commands.extendToGroupStart()

```ts
extendToGroupStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtomathfieldend" name="extendtomathfieldend"></a>

<MemberCard>

##### Commands.extendToMathFieldEnd()

```ts
extendToMathFieldEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtomathfieldstart" name="extendtomathfieldstart"></a>

<MemberCard>

##### Commands.extendToMathFieldStart()

```ts
extendToMathFieldStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtonextboundary" name="extendtonextboundary"></a>

<MemberCard>

##### Commands.extendToNextBoundary()

```ts
extendToNextBoundary: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtonextword" name="extendtonextword"></a>

<MemberCard>

##### Commands.extendToNextWord()

```ts
extendToNextWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtopreviousboundary" name="extendtopreviousboundary"></a>

<MemberCard>

##### Commands.extendToPreviousBoundary()

```ts
extendToPreviousBoundary: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="extendtopreviousword" name="extendtopreviousword"></a>

<MemberCard>

##### Commands.extendToPreviousWord()

```ts
extendToPreviousWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="moveafterparent" name="moveafterparent"></a>

<MemberCard>

##### Commands.moveAfterParent()

```ts
moveAfterParent: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movebeforeparent" name="movebeforeparent"></a>

<MemberCard>

##### Commands.moveBeforeParent()

```ts
moveBeforeParent: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movedown" name="movedown"></a>

<MemberCard>

##### Commands.moveDown()

```ts
moveDown: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetogroupend" name="movetogroupend"></a>

<MemberCard>

##### Commands.moveToGroupEnd()

```ts
moveToGroupEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetogroupstart" name="movetogroupstart"></a>

<MemberCard>

##### Commands.moveToGroupStart()

```ts
moveToGroupStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetomathfieldend" name="movetomathfieldend"></a>

<MemberCard>

##### Commands.moveToMathfieldEnd()

```ts
moveToMathfieldEnd: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetomathfieldstart" name="movetomathfieldstart"></a>

<MemberCard>

##### Commands.moveToMathfieldStart()

```ts
moveToMathfieldStart: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetonextchar" name="movetonextchar"></a>

<MemberCard>

##### Commands.moveToNextChar()

```ts
moveToNextChar: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetonextgroup" name="movetonextgroup"></a>

<MemberCard>

##### Commands.moveToNextGroup()

```ts
moveToNextGroup: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetonextplaceholder" name="movetonextplaceholder"></a>

<MemberCard>

##### Commands.moveToNextPlaceholder()

```ts
moveToNextPlaceholder: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetonextword" name="movetonextword"></a>

<MemberCard>

##### Commands.moveToNextWord()

```ts
moveToNextWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetoopposite" name="movetoopposite"></a>

<MemberCard>

##### Commands.moveToOpposite()

```ts
moveToOpposite: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetopreviouschar" name="movetopreviouschar"></a>

<MemberCard>

##### Commands.moveToPreviousChar()

```ts
moveToPreviousChar: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetopreviousgroup" name="movetopreviousgroup"></a>

<MemberCard>

##### Commands.moveToPreviousGroup()

```ts
moveToPreviousGroup: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetopreviousplaceholder" name="movetopreviousplaceholder"></a>

<MemberCard>

##### Commands.moveToPreviousPlaceholder()

```ts
moveToPreviousPlaceholder: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetopreviousword" name="movetopreviousword"></a>

<MemberCard>

##### Commands.moveToPreviousWord()

```ts
moveToPreviousWord: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetosubscript" name="movetosubscript"></a>

<MemberCard>

##### Commands.moveToSubscript()

```ts
moveToSubscript: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="movetosuperscript" name="movetosuperscript"></a>

<MemberCard>

##### Commands.moveToSuperscript()

```ts
moveToSuperscript: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="moveup" name="moveup"></a>

<MemberCard>

##### Commands.moveUp()

```ts
moveUp: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="selectall" name="selectall"></a>

<MemberCard>

##### Commands.selectAll()

```ts
selectAll: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

<a id="selectgroup" name="selectgroup"></a>

<MemberCard>

##### Commands.selectGroup()

```ts
selectGroup: (model) => boolean;
```

• **model**: `Model`

`boolean`

</MemberCard>

#### Undo/Redo

<a id="redo" name="redo"></a>

<MemberCard>

##### Commands.redo()

```ts
redo: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="undo" name="undo"></a>

<MemberCard>

##### Commands.undo()

```ts
undo: (mathfield) => boolean;
```

• **mathfield**: `Mathfield`

`boolean`

</MemberCard>

<a id="virtualkeyboardcommands" name="virtualkeyboardcommands"></a>

### VirtualKeyboardCommands

<a id="hidevirtualkeyboard" name="hidevirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.hideVirtualKeyboard()

```ts
hideVirtualKeyboard: () => boolean;
```

`boolean`

</MemberCard>

<a id="showvirtualkeyboard" name="showvirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.showVirtualKeyboard()

```ts
showVirtualKeyboard: () => boolean;
```

`boolean`

</MemberCard>

<a id="switchkeyboardlayer" name="switchkeyboardlayer"></a>

<MemberCard>

##### VirtualKeyboardCommands.switchKeyboardLayer()

```ts
switchKeyboardLayer: (mathfield, layer) => boolean;
```

• **mathfield**: `undefined`

• **layer**: `string`

`boolean`

</MemberCard>

<a id="togglevirtualkeyboard" name="togglevirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.toggleVirtualKeyboard()

```ts
toggleVirtualKeyboard: () => boolean;
```

`boolean`

</MemberCard>

<a id="selector" name="selector"></a>

### Selector

```ts
type Selector: Keys<Commands>;
```

## Conversion

<a id="convertasciimathtolatex" name="convertasciimathtolatex"></a>

<MemberCard>

### convertAsciiMathToLatex()

```ts
function convertAsciiMathToLatex(ascii): string
```

Convert an AsciiMath string to a LaTeX string.

```js
convertAsciiMathToLatex("1/2");
// -> "\\frac{1}{2}"
```

• **ascii**: `string`

`string`

</MemberCard>

<a id="convertlatextoasciimath" name="convertlatextoasciimath"></a>

<MemberCard>

### convertLatexToAsciiMath()

```ts
function convertLatexToAsciiMath(latex, parseMode): string
```

Convert a LaTeX string to a string of AsciiMath.

```js
convertLatexToAsciiMath("\\frac{1}{2}");
// -> "1/2"
```

• **latex**: `string`

• **parseMode**: `ParseMode`= `'math'`

`string`

</MemberCard>

<a id="convertlatextomarkup" name="convertlatextomarkup"></a>

<MemberCard>

### convertLatexToMarkup()

```ts
function convertLatexToMarkup(text, options?): string
```

Convert a LaTeX string to a string of HTML markup.

:::info[Note]

This function does not interact with the DOM. It does not load fonts or
inject stylesheets in the document. It can safely be used on the server side.
:::

To get the output of this function to correctly display
in a document, use the mathlive static style sheet by adding the following
to the `<head>` of the document:

```html
<link
 rel="stylesheet"
 href="https://unpkg.com/mathlive/dist/mathlive-static.css"
/>
```

• **text**: `string`

A string of valid LaTeX. It does not have to start
with a mode token such as `$$` or `\(`.

• **options?**

• **options.context?**: `unknown`

• **options.letterShapeStyle?**: `"tex"` \| `"iso"` \| `"french"` \| `"upright"`

• **options.mathstyle?**: `"displaystyle"` \| `"textstyle"`

If `"displaystyle"` the "display" mode of TeX
is used to typeset the formula, which is most appropriate for formulas that are
displayed in a standalone block.

If `"textstyle"` is used, the "text" mode of TeX is used, which is most
appropriate when displaying math "inline" with other text (on the same line).

`string`

#### Keywords

convert, latex, markup

</MemberCard>

<a id="convertlatextomathml" name="convertlatextomathml"></a>

<MemberCard>

### convertLatexToMathMl()

```ts
function convertLatexToMathMl(latex, options): string
```

Convert a LaTeX string to a string of MathML markup.

• **latex**: `string`

A string of valid LaTeX. It does not have to start
with a mode token such as a `$$` or `\(`.

• **options**= `{}`

• **options.generateID?**: `boolean`

If true, add an `"extid"` attribute
to the MathML nodes with a value matching the `atomID`. This can be used
to map items on the screen with their MathML representation or vice-versa.

`string`

</MemberCard>

<a id="convertlatextospeakabletext" name="convertlatextospeakabletext"></a>

<MemberCard>

### convertLatexToSpeakableText()

```ts
function convertLatexToSpeakableText(latex): string
```

Convert a LaTeX string to a textual representation ready to be spoken

• **latex**: `string`

A string of valid LaTeX. It does not have to start
with a mode token such as a `$$` or `\(`.

`string`

The spoken representation of the input LaTeX.

#### Example

```ts
console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
// 'half'
```

#### Keywords

convert, latex, speech, speakable, text, speakable text

</MemberCard>

<a id="convertmathjsontolatex" name="convertmathjsontolatex"></a>

<MemberCard>

### convertMathJsonToLatex()

```ts
function convertMathJsonToLatex(json): string
```

Convert a MathJSON expression to a LaTeX string.

```js
convertMathJsonToLatex(["Add", 1, 2]);
// -> "1 + 2"
```

• **json**: [`Expression`](#expression-1)

`string`

</MemberCard>

## Macros

<a id="macrodefinition" name="macrodefinition"></a>

### MacroDefinition

```ts
type MacroDefinition: object;
```

**See Also**
* [`MacroDictionary`](#macrodictionary)
* mathfield/guides/macros/|Macros Guide

#### Type declaration

<a id="args" name="args"></a>

<MemberCard>

##### MacroDefinition.args?

```ts
optional args: number;
```

</MemberCard>

<a id="captureselection" name="captureselection"></a>

<MemberCard>

##### MacroDefinition.captureSelection?

```ts
optional captureSelection: boolean;
```

</MemberCard>

<a id="def" name="def"></a>

<MemberCard>

##### MacroDefinition.def

```ts
def: string;
```

Definition of the macro as a LaTeX expression

</MemberCard>

<a id="expand" name="expand"></a>

<MemberCard>

##### MacroDefinition.expand?

```ts
optional expand: boolean;
```

</MemberCard>

<a id="macrodictionary" name="macrodictionary"></a>

### MacroDictionary

```ts
type MacroDictionary: Record<string, string | Partial<MacroDefinition> | MacroPackageDefinition>;
```

A dictionary of LaTeX macros to be used to interpret and render the content.

For example:
```javascript
mf.macros = { smallfrac: "^{#1}\\!\\!/\\!_{#2}" };
```
The code above will support the following notation:
```latex
\smallfrac{5}{16}
```
**See Also**
* [Macros Example](/mathfield/guides/macros/)

<a id="macropackagedefinition" name="macropackagedefinition"></a>

### MacroPackageDefinition

```ts
type MacroPackageDefinition: object;
```

#### Type declaration

<a id="captureselection-1" name="captureselection-1"></a>

<MemberCard>

##### MacroPackageDefinition.captureSelection?

```ts
optional captureSelection: boolean;
```

</MemberCard>

<a id="package" name="package"></a>

<MemberCard>

##### MacroPackageDefinition.package

```ts
package: Record<string, string | MacroDefinition>;
```

</MemberCard>

<a id="primitive" name="primitive"></a>

<MemberCard>

##### MacroPackageDefinition.primitive?

```ts
optional primitive: boolean;
```

</MemberCard>

<a id="normalizedmacrodictionary" name="normalizedmacrodictionary"></a>

### NormalizedMacroDictionary

```ts
type NormalizedMacroDictionary: Record<string, MacroDefinition>;
```

## MathJSON

<a id="expression-1" name="expression-1"></a>

### Expression

```ts
type Expression: number | string | object | [Expression, ...Expression[]];
```

## Options

<a id="mathfieldhooks" name="mathfieldhooks"></a>

### MathfieldHooks

These hooks provide an opportunity to intercept or modify an action.
When their return value is a boolean, it indicates if the default handling
should proceed.

<a id="onexport-1" name="onexport-1"></a>

<MemberCard>

##### MathfieldHooks.onExport()

```ts
onExport: (from, latex, range) => string;
```

This hook is invoked when the user has requested to export the content
of the mathfield, for example when pressing ctrl/command+C.

This hook should return as a string what should be exported.

The `range` argument indicates which portion of the mathfield should be
exported. It is not always equal to the current selection, but it can
be used to export a format other than LaTeX.

By default this is:

```js
 return `\\begin{equation*}${latex}\\end{equation*}`;
```

• **from**: `Mathfield`

• **latex**: `string`

• **range**: [`Range`](#range-1)

`string`

</MemberCard>

<a id="oninlineshortcut-1" name="oninlineshortcut-1"></a>

<MemberCard>

##### MathfieldHooks.onInlineShortcut()

```ts
onInlineShortcut: (sender, symbol) => string;
```

A hook invoked when a string of characters that could be
interpreted as shortcut has been typed.

If not a special shortcut, return the empty string `""`.

Use this handler to detect multi character symbols, and return them wrapped appropriately,
for example `\mathrm{${symbol}}`.

• **sender**: `Mathfield`

• **symbol**: `string`

`string`

</MemberCard>

<a id="onscrollintoview-1" name="onscrollintoview-1"></a>

<MemberCard>

##### MathfieldHooks.onScrollIntoView()

```ts
onScrollIntoView: (sender) => void;
```

A hook invoked when a scrolling the mathfield into view is necessary.

Use when scrolling the page would not solve the problem, e.g.
when the mathfield is in another div that has scrollable content.

• **sender**: `Mathfield`

`void`

</MemberCard>

<a id="contentchangeoptions" name="contentchangeoptions"></a>

### ContentChangeOptions

```ts
type ContentChangeOptions: object;
```

#### Type declaration

<a id="data" name="data"></a>

<MemberCard>

##### ContentChangeOptions.data?

```ts
optional data: string | null;
```

</MemberCard>

<a id="datatransfer" name="datatransfer"></a>

<MemberCard>

##### ContentChangeOptions.dataTransfer?

```ts
optional dataTransfer: DataTransfer | null;
```

</MemberCard>

<a id="inputtype" name="inputtype"></a>

<MemberCard>

##### ContentChangeOptions.inputType?

```ts
optional inputType: ContentChangeType;
```

</MemberCard>

<a id="contentchangetype" name="contentchangetype"></a>

### ContentChangeType

```ts
type ContentChangeType: 
  | "insertText"
  | "insertLineBreak"
  | "insertFromPaste"
  | "historyUndo"
  | "historyRedo"
  | "deleteByCut"
  | "deleteContent"
  | "deleteContentBackward"
  | "deleteContentForward"
  | "deleteWordBackward"
  | "deleteWordForward"
  | "deleteSoftLineBackward"
  | "deleteSoftLineForward"
  | "deleteHardLineBackward"
  | "deleteHardLineForward";
```

<a id="editingoptions" name="editingoptions"></a>

### EditingOptions

```ts
type EditingOptions: object;
```

#### Type declaration

<a id="contentplaceholder" name="contentplaceholder"></a>

<MemberCard>

##### EditingOptions.contentPlaceholder

```ts
contentPlaceholder: string;
```

A LaTeX string displayed inside the mathfield when there is no content.

</MemberCard>

<a id="environmentpopoverpolicy-1" name="environmentpopoverpolicy-1"></a>

<MemberCard>

##### EditingOptions.environmentPopoverPolicy

```ts
environmentPopoverPolicy: "auto" | "on" | "off";
```

If `"auto"` a popover with commands to edit an environment (matrix)
is displayed when the virtual keyboard is displayed.

**Default**: `"auto"`

</MemberCard>

<a id="isimplicitfunction" name="isimplicitfunction"></a>

<MemberCard>

##### EditingOptions.isImplicitFunction()

```ts
isImplicitFunction: (name) => boolean;
```

Return true if the latex command is a function that could take
implicit arguments. By default, this includes trigonometric function,
so `\sin x` is interpreted as `\sin(x)`.

This affects editing, for example how the `/` key is interpreted after
such as symbol.

• **name**: `string`

`boolean`

</MemberCard>

<a id="mathmodespace-1" name="mathmodespace-1"></a>

<MemberCard>

##### EditingOptions.mathModeSpace

```ts
mathModeSpace: string;
```

The LaTeX string to insert when the spacebar is pressed (on the physical or
virtual keyboard).

Use `"\;"` for a thick space, `"\:"` for a medium space, `"\,"` for a
thin space.

Do not use `" "` (a regular space), as whitespace is skipped by LaTeX
so this will do nothing.

**Default**: `""` (empty string)

</MemberCard>

<a id="mathvirtualkeyboardpolicy-1" name="mathvirtualkeyboardpolicy-1"></a>

<MemberCard>

##### EditingOptions.mathVirtualKeyboardPolicy

```ts
mathVirtualKeyboardPolicy: "auto" | "manual" | "sandboxed";
```

</MemberCard>

<a id="placeholdersymbol-1" name="placeholdersymbol-1"></a>

<MemberCard>

##### EditingOptions.placeholderSymbol

```ts
placeholderSymbol: string;
```

The symbol used to represent a placeholder in an expression.

**Default**: `▢` `U+25A2 WHITE SQUARE WITH ROUNDED CORNERS`

</MemberCard>

<a id="popoverpolicy-1" name="popoverpolicy-1"></a>

<MemberCard>

##### EditingOptions.popoverPolicy

```ts
popoverPolicy: "auto" | "off";
```

If `"auto"` a popover with suggestions may be displayed when a LaTeX
command is input.

**Default**: `"auto"`

</MemberCard>

<a id="readonly-2" name="readonly-2"></a>

<MemberCard>

##### EditingOptions.readOnly

```ts
readOnly: boolean;
```

When `true`, the user cannot edit the mathfield. The mathfield can still
be modified programatically.

**Default**: `false`

</MemberCard>

<a id="removeextraneousparentheses-1" name="removeextraneousparentheses-1"></a>

<MemberCard>

##### EditingOptions.removeExtraneousParentheses

```ts
removeExtraneousParentheses: boolean;
```

If `true`, extra parentheses around a numerator or denominator are
removed automatically.

**Default**: `true`

</MemberCard>

<a id="scriptdepth-1" name="scriptdepth-1"></a>

<MemberCard>

##### EditingOptions.scriptDepth

```ts
scriptDepth: number | [number, number];
```

This option controls how many levels of subscript/superscript can be entered. For
example, if `scriptDepth` is "1", there can be one level of superscript or
subscript. Attempting to enter a superscript while inside a superscript will
be rejected. Setting a value of 0 will prevent entry of any superscript or
subscript (but not limits for sum, integrals, etc...)

This can make it easier to enter equations that fit what's expected for the
domain where the mathfield is used.

To control the depth of superscript and subscript independently, provide an
array: the first element indicate the maximum depth for subscript and the
second element the depth of superscript. Thus, a value of `[0, 1]` would
suppress the entry of subscripts, and allow one level of superscripts.

</MemberCard>

<a id="smartfence-1" name="smartfence-1"></a>

<MemberCard>

##### EditingOptions.smartFence

```ts
smartFence: boolean;
```

When `true` and an open fence is entered via `typedText()` it will
generate a contextually appropriate markup, for example using
`\left...\right` if applicable.

When `false`, the literal value of the character will be inserted instead.

</MemberCard>

<a id="smartmode-1" name="smartmode-1"></a>

<MemberCard>

##### EditingOptions.smartMode

```ts
smartMode: boolean;
```

When `true`, during text input the field will switch automatically between
'math' and 'text' mode depending on what is typed and the context of the
formula. If necessary, what was previously typed will be 'fixed' to
account for the new info.

For example, when typing "if x >0":

| Type  | Interpretation |
|---:|:---|
| `i` | math mode, imaginary unit |
| `if` | text mode, english word "if" |
| `if x` | all in text mode, maybe the next word is xylophone? |
| `if x >` | "if" stays in text mode, but now "x >" is in math mode |
| `if x > 0` | "if" in text mode, "x > 0" in math mode |

**Default**: `false`

Manually switching mode (by typing `alt/option+=`) will temporarily turn
off smart mode.

**Examples**

- `slope = rise/run`
- `If x > 0, then f(x) = sin(x)`
- `x^2 + sin (x) when x > 0`
- `When x&lt;0, x^{2n+1}&lt;0`
- `Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5`
- `Divide by x-3 and then add x^2-1 to both sides`
- `Given g(x) = 4x – 3, when does g(x)=0?`
- `Let D be the set {(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x}`
- `\int\_{the unit square} f(x,y) dx dy`
- `For all n in NN`

</MemberCard>

<a id="smartsuperscript-1" name="smartsuperscript-1"></a>

<MemberCard>

##### EditingOptions.smartSuperscript

```ts
smartSuperscript: boolean;
```

When `true` and a digit is entered in an empty superscript, the cursor
leaps automatically out of the superscript. This makes entry of common
polynomials easier and faster. If entering other characters (for example
"n+1") the navigation out of the superscript must be done manually (by
using the cursor keys or the spacebar to leap to the next insertion
point).

When `false`, the navigation out of the superscript must always be done
manually.

</MemberCard>

<a id="inlineshortcutdefinition" name="inlineshortcutdefinition"></a>

### InlineShortcutDefinition

```ts
type InlineShortcutDefinition: string | object;
```

An inline shortcut can be specified as a simple string or as
an object literal with additional options:

```javascript
    config.inlineShortcuts = {
     half: '\\frac{1}{2}',
     in: {
         after: 'space+letter+digit+symbol+fence',
         value: '\\in',
     },
 };
```

When using a string, the shortcut applies regardless of the characters
surrounding it.

When using an object literal the `value` key is required an indicate the
shortcut substitution.

The `"after"` key, if present, indicate in what context (preceding characters)
the shortcut will apply. One or more values can be specified, separated by a '|'
character. If any of the values match, the shortcut is applicable.

Possible values are:

 | | |
 | :----- | :----- |
 | `"space"` |  A spacing command, such as `\quad` |
 | `"nothing"`|  The begining of a group |
 | `"surd"` | A square root or n-th root |
 | `"frac"` | A fraction|
 | `"function"` |A  function such as `\sin` or `f`|
 | `"letter"` | A letter, such as `x` or `n`|
 | `"digit"` |`0` through `9`|
 | `"binop"` | A binary operator, such as `+`|
 | `"relop"` | A relational operator, such as `=`|
 | `"punct"` | A punctuation mark, such as `,`|
 | `"array"` | An array, such as a matrix or cases statement|
 | `"openfence"` | An opening fence, such as `(`|
 | `"closefence"` | A closing fence such as `}`|
 | `"text"`| Some plain text|

<a id="inlineshortcutdefinitions" name="inlineshortcutdefinitions"></a>

### InlineShortcutDefinitions

```ts
type InlineShortcutDefinitions: Record<string, InlineShortcutDefinition>;
```

<a id="inlineshortcutsoptions" name="inlineshortcutsoptions"></a>

### InlineShortcutsOptions

```ts
type InlineShortcutsOptions: object;
```

#### Type declaration

<a id="inlineshortcuttimeout-1" name="inlineshortcuttimeout-1"></a>

<MemberCard>

##### InlineShortcutsOptions.inlineShortcutTimeout

```ts
inlineShortcutTimeout: number;
```

Maximum time, in milliseconds, between consecutive characters for them to be
considered part of the same shortcut sequence.

A value of 0 is the same as infinity: any consecutive character will be
candidate for an inline shortcut, regardless of the interval between this
character and the previous one.

A value of 750 will indicate that the maximum interval between two
characters to be considered part of the same inline shortcut sequence is
3/4 of a second.

This is useful to enter "+-" as a sequence of two characters, while also
supporting the "±" shortcut with the same sequence.

The first result can be entered by pausing slightly between the first and
second character if this option is set to a value of 250 or so.

Note that some operations, such as clicking to change the selection, or
losing the focus on the mathfield, will automatically timeout the
shortcuts.

</MemberCard>

<a id="inlineshortcuts-1" name="inlineshortcuts-1"></a>

<MemberCard>

##### InlineShortcutsOptions.inlineShortcuts

```ts
inlineShortcuts: InlineShortcutDefinitions;
```

The keys of this object literal indicate the sequence of characters
that will trigger an inline shortcut.

</MemberCard>

<a id="keybinding" name="keybinding"></a>

### Keybinding

```ts
type Keybinding: object;
```

A keybinding associates a combination of physical keyboard keys with a
command.

For example:

```javascript
{
     "key": "cmd+a",
     "command": "selectAll",
},
{
     "key": 'ctrl+[Digit2]',
     "ifMode": 'math',
     "command": ['insert', '\\sqrt{#0}'],
}
```

#### Type declaration

<a id="command-1" name="command-1"></a>

<MemberCard>

##### Keybinding.command

```ts
command: 
  | Selector
  | string[]
  | [string, any]
  | [string, any, any]
  | [string, any, any, any];
```

The command is a single selector, or a selector with arguments

</MemberCard>

<a id="iflayout" name="iflayout"></a>

<MemberCard>

##### Keybinding.ifLayout?

```ts
optional ifLayout: string[];
```

</MemberCard>

<a id="ifmode" name="ifmode"></a>

<MemberCard>

##### Keybinding.ifMode?

```ts
optional ifMode: ParseMode;
```

If specified, this indicates in which mode this keybinding will apply.
If none is specified, the keybinding will apply in every mode.

</MemberCard>

<a id="ifplatform" name="ifplatform"></a>

<MemberCard>

##### Keybinding.ifPlatform?

```ts
optional ifPlatform: 
  | "macos"
  | "!macos"
  | "windows"
  | "!windows"
  | "linux"
  | "!linux"
  | "ios"
  | "!ios"
  | "android"
  | "!android"
  | "chromeos"
  | "!chromeos";
```

If specified, this indicates the OS platform to which this keybinding
apply.

For example, if set to `!macos` this key binding will apply to every
platform, except macOS.

</MemberCard>

<a id="key-1" name="key-1"></a>

<MemberCard>

##### Keybinding.key

```ts
key: string;
```

The pressed keys that will trigger this keybinding.

The `key` is made up of modifiers and the key itself.

The following modifiers can be used:

 | Platform | Modifiers |
 | :----- | :----- |
 | macOS, iOS |  `ctrl`, `shift`, `alt`, `cmd` |
 | Windows |  `ctrl`, `shift`, `alt`, `win` |
 | Linux, Android, ChromeOS |  `ctrl`, `shift`, `alt`, `meta` |

If the `cmd` modifier is used, the keybinding will only apply on macOS.
If the `win` modifier is used, the keybinding will only apply to Windows.
If the `meta` modifier is used, the keybinding will apply to platforms
other than macOS or Windows.

The `alt` key is the `option` key on Apple keyboards.

The following values for keys can be used:
* `a`&ndash;`z`, `0`&ndash;`9`
* `` ` ``, `-`, `=`, `[`, `]`, `\`, `;`, `'`, `,`, `.`, `/`
* `left`, `up`, `right`, `down`, `pageup`, `pagedown`, `end`, `home`
* `tab`, `enter`, `escape`, `space`, `backspace`, `delete`
* `f1`&ndash;`f19`
* `pausebreak`, `capslock`, `insert`
* `numpad0`&ndash;`numpad9`, `numpad_multiply`, `numpad_add`, `numpad_separator`
* `numpad_subtract`, `numpad_decimal`, `numpad_divide`

The values will be remapped based on the current keyboard layout. So, for
example if `a` is used, on a French AZERTY keyboard the keybinding will be
associated with the key labeled 'A' (event though it corresponds to the
key labeled 'Q' on a US QWERTY keyboard).

To associate keybindings with physical keys independent of the keyboard
layout, use the following keycodes:

- `[KeyA]`&ndash;`[KeyZ]`, `[Digit0]`&ndash;`[Digit9]`
- `[Backquote]`, `[Minus]`, `[Equal]`, `[BracketLeft]`, `[BracketRight]`, `[Backslash]`, `[Semicolon]`, `[Quote]`, `[Comma]`, `[Period]`, `[Slash]`
- `[ArrowLeft]`, `[ArrowUp]`, `[ArrowRight]`, `[ArrowDown]`, `[PageUp]`, `[PageDown]`, `[End]`, `[Home]`
- `[Tab]`, `[Enter]`, `[Escape]`, `[Space]`, `[Backspace]`, `[Delete]`
- `[F1]`&ndash;`[F19]`
- `[Pause]`, `[CapsLock]`, `[Insert]`
- `[Numpad0]`&ndash;`[Numpad9]`, `[NumpadMultiply]`, `[NumpadAdd]`, `[NumpadComma]`
- `[NumpadSubtract]`, `[NumpadDecimal]`, `[NumpadDivide]`

For example, using `[KeyQ]` will map to the the key labeled 'Q' on a QWERTY
keyboard, and to the key labeled 'A' on an AZERTY keyboard.

As a general guideline, it is preferable to use the key values `a`&ndash;`z`
for keybinding that are pseudo-mnemotechnic. For the other, it is generally
preferable to use the keycodes.

Consider the key combination: `alt+2`. With an AZERTY (French) layout,
the digits (i.e. '2') are only accessible when shifted. The '2' key produces
'é' when not shifted. It is therefore impossible on an AZERTY keyboard to
produce the `alt+2` key combination, at best it would be `alt+shift+2`.
To indicate that the intended key combination should be `alt` and the
key on the keyboard which has the position of the `2` key on a US keyboard,
a key code should be used instead: `alt+[Digit2]`. This will correspond
to a key combination that can be generated on any keyboard.

</MemberCard>

<a id="keyboardlayoutname" name="keyboardlayoutname"></a>

### KeyboardLayoutName

```ts
type KeyboardLayoutName: 
  | "apple.en-intl"
  | "apple.french"
  | "apple.german"
  | "apple.spanish"
  | "dvorak"
  | "windows.en-intl"
  | "windows.french"
  | "windows.german"
  | "windows.spanish"
  | "linux.en"
  | "linux.french"
  | "linux.german"
  | "linux.spanish";
```

See [`setKeyboardLayout`](#setkeyboardlayout).

 | Name | Platform | Display name |
 | :----- | :----- | :----- |
 | `"apple.en-intl"`         |  Apple    | English (International) |
 | `"apple.french"`          |  Apple    | French (AZERTY) |
 | `"apple.german"`          |  Apple    | German (QWERTZ) |
 | `"dvorak"`                |           | English (Dvorak) |
 | `"windows.en-intl"`       |  Windows  | English (International) |
 | `"windows.french"`        |  Windows  | French (AZERTY) |
 | `"windows.german"`        |  Windows  | German (QWERTZ) |
 | `"linux.en"`              |  Linux    | English |
 | `"linux.french"`          |  Linux    | French (AZERTY) |
 | `"linux.german"`          |  Linux    | German (QWERTZ) |

<a id="keyboardoptions" name="keyboardoptions"></a>

### KeyboardOptions

```ts
type KeyboardOptions: object;
```

#### Type declaration

<a id="keybindings-1" name="keybindings-1"></a>

<MemberCard>

##### KeyboardOptions.keybindings

```ts
keybindings: readonly Keybinding[];
```

</MemberCard>

<a id="layoutoptions" name="layoutoptions"></a>

### LayoutOptions

```ts
type LayoutOptions: object;
```

#### Type declaration

<a id="backgroundcolormap-1" name="backgroundcolormap-1"></a>

<MemberCard>

##### LayoutOptions.backgroundColorMap()

```ts
backgroundColorMap: (name) => string | undefined;
```

• **name**: `string`

`string` \| `undefined`

</MemberCard>

<a id="colormap-1" name="colormap-1"></a>

<MemberCard>

##### LayoutOptions.colorMap()

```ts
colorMap: (name) => string | undefined;
```

Map a color name as used in commands such as `\textcolor{}{}` or
`\colorbox{}{}` to a CSS color value.

Use this option to override the standard mapping of colors such as "yellow"
or "red".

If the name is not one you expected, return `undefined` and the default
color mapping will be applied.

If a `backgroundColorMap()` function is not provided, the `colorMap()`
function will be used instead.

If `colorMap()` is not provided, default color mappings are applied.

The following color names have been optimized for a legible foreground
and background values, and are recommended:
- `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `blue`, `indigo`,
`purple`, `magenta`, `black`, `dark-grey`, `grey`, `light-grey`, `white`

• **name**: `string`

`string` \| `undefined`

</MemberCard>

<a id="defaultmode-1" name="defaultmode-1"></a>

<MemberCard>

##### LayoutOptions.defaultMode

```ts
defaultMode: "inline-math" | "math" | "text";
```

The mode of the element when it is empty:
- `"math"`: equivalent to `\displaystyle` (display math mode)
- `"inline-math"`: equivalent to `\inlinestyle` (inline math mode)
- `"text"`: text mode

</MemberCard>

<a id="lettershapestyle-1" name="lettershapestyle-1"></a>

<MemberCard>

##### LayoutOptions.letterShapeStyle

```ts
letterShapeStyle: 
  | "auto"
  | "tex"
  | "iso"
  | "french"
  | "upright";
```

Control the letter shape style:

 | `letterShapeStyle` | xyz | ABC | αβɣ | ΓΔΘ |
 | ------------------ | --- | --- | --- | --- |
 | `iso`              | it  | it  | it  | it  |
 | `tex`              | it  | it  | it  | up  |
 | `french`           | it  | up  | up  | up  |
 | `upright`          | up  | up  | up  | up  |

 (it) = italic (up) = upright

 * The default letter shape style is `auto`, which indicates that `french`
 * should be used if the locale is "french", and `tex` otherwise.
 *
 * **Historical Note**
 *
 * Where do the "french" rules come from? The
 * TeX standard font, Computer Modern, is based on Monotype 155M, itself
 * based on the Porson greek font which was one of the most widely used
 * Greek fonts in english-speaking countries. This font had upright
 * capitals, but slanted lowercase. In France, the traditional font for
 * greek was Didot, which has both upright capitals and lowercase.
 *
 * As for roman uppercase, they are recommended by "Lexique des règles
 * typographiques en usage à l’Imprimerie Nationale". It should be noted
 * that this convention is not universally followed.

</MemberCard>

<a id="macros-1" name="macros-1"></a>

<MemberCard>

##### LayoutOptions.macros

```ts
macros: MacroDictionary;
```

A dictionary of LaTeX macros to be used to interpret and render the content.

For example, to add a new macro to the default macro dictionary:

```javascript
mf.macros = {
...mf.macros,
smallfrac: '^{#1}\\!\\!/\\!_{#2}',
};
```

Note that `...mf.macros` is used to keep the existing macros and add to
them.
Otherwise, all the macros are replaced with the new definition.

The code above will support the following notation:

 ```tex
 \smallfrac{5}{16}
 ```

</MemberCard>

<a id="maxmatrixcols-1" name="maxmatrixcols-1"></a>

<MemberCard>

##### LayoutOptions.maxMatrixCols

```ts
maxMatrixCols: number;
```

Sets the maximum number of columns for the matrix environment. The default is
10 columns to match the behavior of the amsmath matrix environment.
**Default**: `10`

</MemberCard>

<a id="minfontscale-1" name="minfontscale-1"></a>

<MemberCard>

##### LayoutOptions.minFontScale

```ts
minFontScale: number;
```

Set the minimum relative font size for nested superscripts and fractions. The value
should be a number between `0` and `1`. The size is in releative `em` units relative to the
font size of the `math-field` element. Specifying a value of `0` allows the `math-field`
to use its default sizing logic.

**Default**: `0`

</MemberCard>

<a id="registers-1" name="registers-1"></a>

<MemberCard>

##### LayoutOptions.registers

```ts
registers: Registers;
```

LaTeX global registers override.

</MemberCard>

<a id="mathfieldoptions" name="mathfieldoptions"></a>

### MathfieldOptions

```ts
type MathfieldOptions: LayoutOptions & EditingOptions & InlineShortcutsOptions & KeyboardOptions & MathfieldHooks & object;
```

#### Keywords

security, trust, sanitize, errors

#### Type declaration

<MemberCard>

##### MathfieldOptions.originValidator

```ts
originValidator: OriginValidator;
```

Specify how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
should be validated.

**Default**: `"none"`

</MemberCard>

<MemberCard>

##### MathfieldOptions.virtualKeyboardTargetOrigin

```ts
virtualKeyboardTargetOrigin: string;
```

Specify the `targetOrigin` parameter for
[postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
to send control messages from child to parent frame to remote control
of mathfield component.

**Default**: `window.origin`

</MemberCard>

<a id="originvalidator-2" name="originvalidator-2"></a>

### OriginValidator

```ts
type OriginValidator: (origin) => boolean | "same-origin" | "none";
```

Specify behavior for origin validation.

<div className='symbols-table' style={{"--first-col-width":"32ex"}}>

| Value | Description |
| ----- | ----------- |
| `"same-origin"` | The origin of received message must be the same of hosted window, instead exception will throw. |
| `(origin: string) => boolean` | The callback to verify origin to be expected validation. When callback return `false` value, message will rejected and exception will throw. |
| `"none"` | No origin validation for post messages. |

</div>

<a id="setkeyboardlayout" name="setkeyboardlayout"></a>

<MemberCard>

### setKeyboardLayout()

```ts
function setKeyboardLayout(name): void
```

Change the current physical keyboard layout.

Note that this affects some keybindings, but not general text input.

If set to `auto` the keyboard layout is guessed.

• **name**: `"auto"` \| [`KeyboardLayoutName`](#keyboardlayoutname)

`void`

</MemberCard>

<a id="setkeyboardlayoutlocale" name="setkeyboardlayoutlocale"></a>

<MemberCard>

### setKeyboardLayoutLocale()

```ts
function setKeyboardLayoutLocale(locale): void
```

Change the current physical keyboard layout to a layout that matches the
specified locale, if one is available.

Note that this affects some keybindings, but not general text input.

• **locale**: `string`

`void`

</MemberCard>

## Other

<a id="style-1" name="style-1"></a>

### Style

Use a `Style` object  literal to modify the visual appearance of a
mathfield or a portion of a mathfield.

You can control the color ("ink") and background color ("paper"),
the font variant, weight (`FontSeries`), size and more.

**See Also**
* `applyStyle()`
* [Interacting with a Mathfield](mathfield/guides/interacting/)

<a id="backgroundcolor" name="backgroundcolor"></a>

<MemberCard>

##### Style.backgroundColor?

```ts
optional backgroundColor: string;
```

</MemberCard>

<a id="color" name="color"></a>

<MemberCard>

##### Style.color?

```ts
optional color: string;
```

</MemberCard>

<a id="fontfamily" name="fontfamily"></a>

<MemberCard>

##### Style.fontFamily?

```ts
optional fontFamily: FontFamily;
```

</MemberCard>

<a id="fontseries" name="fontseries"></a>

<MemberCard>

##### Style.fontSeries?

```ts
optional fontSeries: FontSeries;
```

</MemberCard>

<a id="fontshape" name="fontshape"></a>

<MemberCard>

##### Style.fontShape?

```ts
optional fontShape: FontShape;
```

</MemberCard>

<a id="fontsize" name="fontsize"></a>

<MemberCard>

##### Style.fontSize?

```ts
optional fontSize: "auto" | FontSize;
```

</MemberCard>

<a id="variant" name="variant"></a>

<MemberCard>

##### Style.variant?

```ts
optional variant: Variant;
```

</MemberCard>

<a id="variantstyle" name="variantstyle"></a>

<MemberCard>

##### Style.variantStyle?

```ts
optional variantStyle: VariantStyle;
```

</MemberCard>

<a id="applystyleoptions" name="applystyleoptions"></a>

### ApplyStyleOptions

```ts
type ApplyStyleOptions: object;
```

#### Type declaration

<a id="operation" name="operation"></a>

<MemberCard>

##### ApplyStyleOptions.operation?

```ts
optional operation: "set" | "toggle";
```

</MemberCard>

<a id="range" name="range"></a>

<MemberCard>

##### ApplyStyleOptions.range?

```ts
optional range: Range;
```

</MemberCard>

<a id="silencenotifications" name="silencenotifications"></a>

<MemberCard>

##### ApplyStyleOptions.silenceNotifications?

```ts
optional silenceNotifications: boolean;
```

</MemberCard>

<a id="elementinfo" name="elementinfo"></a>

### ElementInfo

```ts
type ElementInfo: object;
```

Some additional information about an element in the formula

#### Type declaration

<a id="bounds" name="bounds"></a>

<MemberCard>

##### ElementInfo.bounds?

```ts
optional bounds: DOMRect;
```

The bounding box of the element

</MemberCard>

<a id="data-1" name="data-1"></a>

<MemberCard>

##### ElementInfo.data?

```ts
optional data: Record<string, string | undefined>;
```

HTML attributes associated with element or its ancestores, set with
`\htmlData`

</MemberCard>

<a id="depth" name="depth"></a>

<MemberCard>

##### ElementInfo.depth?

```ts
optional depth: number;
```

The depth in the expression tree. 0 for top-level elements

</MemberCard>

<a id="id-2" name="id-2"></a>

<MemberCard>

##### ElementInfo.id?

```ts
optional id: string;
```

id associated with this element or its ancestor, set with `\htmlId` or 
`\cssId`

</MemberCard>

<a id="latex-1" name="latex-1"></a>

<MemberCard>

##### ElementInfo.latex?

```ts
optional latex: string;
```

</MemberCard>

<a id="mode-1" name="mode-1"></a>

<MemberCard>

##### ElementInfo.mode?

```ts
optional mode: ParseMode;
```

The mode (math, text or latex)

</MemberCard>

<a id="fontfamily-1" name="fontfamily-1"></a>

### FontFamily

```ts
type FontFamily: "none" | "roman" | "monospace" | "sans-serif";
```

<a id="fontseries-1" name="fontseries-1"></a>

### FontSeries

```ts
type FontSeries: 
  | "auto"
  | "m"
  | "b"
  | "l"
  | "";
```

<a id="fontshape-1" name="fontshape-1"></a>

### FontShape

```ts
type FontShape: 
  | "auto"
  | "n"
  | "it"
  | "sl"
  | "sc"
  | "";
```

<a id="fontsize-1" name="fontsize-1"></a>

### FontSize

```ts
type FontSize: 
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;
```

<a id="insertoptions" name="insertoptions"></a>

### InsertOptions

```ts
type InsertOptions: object;
```

#### Type declaration

<a id="feedback" name="feedback"></a>

<MemberCard>

##### InsertOptions.feedback?

```ts
optional feedback: boolean;
```

If `true`, provide audio and haptic feedback

</MemberCard>

<a id="focus-1" name="focus-1"></a>

<MemberCard>

##### InsertOptions.focus?

```ts
optional focus: boolean;
```

If `true`, the mathfield will be focused after
the insertion

</MemberCard>

<a id="format" name="format"></a>

<MemberCard>

##### InsertOptions.format?

```ts
optional format: OutputFormat | "auto";
```

The format of the input string:

| | |
|:------------|:------------|
|`"auto"`| The string is LaTeX fragment or command) (default)|
|`"latex"`| The string is a LaTeX fragment|

</MemberCard>

<a id="insertionmode" name="insertionmode"></a>

<MemberCard>

##### InsertOptions.insertionMode?

```ts
optional insertionMode: "replaceSelection" | "replaceAll" | "insertBefore" | "insertAfter";
```

</MemberCard>

<a id="mode-2" name="mode-2"></a>

<MemberCard>

##### InsertOptions.mode?

```ts
optional mode: ParseMode | "auto";
```

If `"auto"` or omitted, the current mode is used

</MemberCard>

<a id="scrollintoview-1" name="scrollintoview-1"></a>

<MemberCard>

##### InsertOptions.scrollIntoView?

```ts
optional scrollIntoView: boolean;
```

If `true`, scroll the mathfield into view after insertion such that the
insertion point is visible

</MemberCard>

<a id="selectionmode" name="selectionmode"></a>

<MemberCard>

##### InsertOptions.selectionMode?

```ts
optional selectionMode: "placeholder" | "after" | "before" | "item";
```

Describes where the selection
will be after the insertion:

| | |
| :---------- | :---------- |
|`"placeholder"`| The selection will be the first available placeholder in the text that has been inserted (default)|
|`"after"`| The selection will be an insertion point after the inserted text|
|`"before"`| The selection will be an insertion point before the inserted text|
|`"item"`| The inserted text will be selected|

</MemberCard>

<a id="silencenotifications-1" name="silencenotifications-1"></a>

<MemberCard>

##### InsertOptions.silenceNotifications?

```ts
optional silenceNotifications: boolean;
```

</MemberCard>

<a id="style-3" name="style-3"></a>

<MemberCard>

##### InsertOptions.style?

```ts
optional style: Style;
```

</MemberCard>

<a id="latexsyntaxerrort" name="latexsyntaxerrort"></a>

### LatexSyntaxError\<T\>

```ts
type LatexSyntaxError<T>: object;
```

#### Type parameters

• **T** = [`ParserErrorCode`](#parsererrorcode)

#### Type declaration

<a id="after" name="after"></a>

<MemberCard>

##### LatexSyntaxError.after?

```ts
optional after: string;
```

</MemberCard>

<a id="arg" name="arg"></a>

<MemberCard>

##### LatexSyntaxError.arg?

```ts
optional arg: string;
```

</MemberCard>

<a id="before" name="before"></a>

<MemberCard>

##### LatexSyntaxError.before?

```ts
optional before: string;
```

</MemberCard>

<a id="code" name="code"></a>

<MemberCard>

##### LatexSyntaxError.code

```ts
code: T;
```

</MemberCard>

<a id="latex-2" name="latex-2"></a>

<MemberCard>

##### LatexSyntaxError.latex?

```ts
optional latex: string;
```

</MemberCard>

<a id="mathstylename" name="mathstylename"></a>

### MathstyleName

```ts
type MathstyleName: "displaystyle" | "textstyle" | "scriptstyle" | "scriptscriptstyle";
```

<a id="offset" name="offset"></a>

### Offset

```ts
type Offset: number;
```

A position of the caret/insertion point from the beginning of the formula.

<a id="outputformat" name="outputformat"></a>

### OutputFormat

```ts
type OutputFormat: 
  | "ascii-math"
  | "latex"
  | "latex-expanded"
  | "latex-unstyled"
  | "latex-without-placeholders"
  | "math-json"
  | "math-ml"
  | "plain-text"
  | "spoken"
  | "spoken-text"
  | "spoken-ssml"
  | "spoken-ssml-with-highlighting";
```

| Format                | Description             |
| :-------------------- | :---------------------- |
| `"ascii-math"`        | A string of [ASCIIMath](http://asciimath.org/). |
| `"latex"`             | LaTeX rendering of the content, with LaTeX macros not expanded. |
| `"latex-expanded"`    | All macros are recursively expanded to their definition. |
| `"latex-unstyled"`    | Styling (background color, color) is ignored |
| `"latex-without-placeholders"`    | Replace `\placeholder` commands with their body |
| `"math-json"`         | A MathJSON abstract syntax tree, as an object literal formated as a JSON string. Note: you must import the CortexJS Compute Engine to obtain a result. |
| `"math-ml"`           | A string of MathML markup. |
' `"plain-text"`        | A plain text rendering of the content. |
| `"spoken"`            | Spoken text rendering, using the default format defined in config, which could be either text or SSML markup. |
| `"spoken-text"`       | A plain spoken text rendering of the content. |
| `"spoken-ssml"`       | A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS. |
| `"spoken-ssml-with-highlighting"`| Like `"spoken-ssml"` but with additional annotations necessary for synchronized highlighting (read aloud). |

  * To use the`"math-json"` format the Compute Engine library must be loaded. Use for example:
  *
```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```
  *

<a id="parsererrorcode" name="parsererrorcode"></a>

### ParserErrorCode

```ts
type ParserErrorCode: 
  | "unknown-command"
  | "invalid-command"
  | "unbalanced-braces"
  | "unknown-environment"
  | "unbalanced-environment"
  | "unbalanced-mode-shift"
  | "missing-argument"
  | "too-many-infix-commands"
  | "unexpected-command-in-string"
  | "missing-unit"
  | "unexpected-delimiter"
  | "unexpected-token"
  | "unexpected-end-of-string"
  | "improper-alphabetic-constant";
```

Error codes returned by the `mf.errors` property.

   |  | |
   | ------------------ | ---      |
   | `unknown-command`             | There is no definition available for this LaTeX command, e.g. `\zin`  |
   | `unknown-environment`         | There is no definition available for this environment, e.g. `\begin{foo}`  |
   | `invalid-command`             | This command is not valid in the current context (e.g. text command in math mode)  |
   | `unbalanced-braces`           |  There are too many or too few `{` or `}`  |
   | `unbalanced-environment`      |  An environment was open but never closed (`\begin{array}`) or the `\end` command does not match the `\begin` command (`\begin{array*}\end{array}`)  |
   | `unbalanced-mode-shift`       |  A `$`, `$$`, `\(` or `\[` was not balanced  |
   | `missing-argument`            |  A required argument is missing, e.g. `\frac{2}` |
   | `too-many-infix-commands`     | A group can include only one infix command (i.e. `\choose`, `\atop`). In general it's best to avoid infix commands.  |
   | `unexpected-command-in-string`| A command expected a string argument, but there was a command instead  |
   | `missing-unit`                |  An argument requiring a dimension was missing an unit.  |
   | `unexpected-delimiter`        |  An invalid symbol or command was used as a delimiter.  |
   | `unexpected-token`            |  An unexpected character was encountered.  |
   | `unexpected-end-of-string`    |  The end of the string was reached, but some required arguments were missing. |
   | `improper-alphabetic-constant`    | The alphabetic constant prefix `` ` `` was not followed by a letter or single character command. |

<a id="range-1" name="range-1"></a>

### Range

```ts
type Range: [Offset, Offset];
```

A pair of offsets (boundary points) that can be used to denote a fragment
of an expression.

A range is said to be collapsed when start and end are equal.

When specifying a range, a negative offset can be used to indicate an
offset from the last valid offset, i.e. -1 is the last valid offset, -2
is one offset before that, etc...

A normalized range will always be such that start <= end, start >= 0,
end >= 0,  start < lastOffset, end < lastOffset. All the methods return
a normalized range.

**See Also**
* [`Selection`](#selection-1)

<a id="selection-1" name="selection-1"></a>

### Selection

```ts
type Selection: object;
```

A selection is a set of ranges (to support discontinuous selection, for
example when selecting a column in a matrix).

If there is a single range and that range is collapsed, the selection is
collapsed.

A selection can also have a direction. While many operations are insensitive
to the direction, a few are. For example, when selecting a fragment of an
expression from left to right, the direction of this range will be "forward".
Pressing the left arrow key will sets the insertion at the start of the range.
Conversely, if the selection is made from right to left, the direction is
"backward" and pressing the left arrow key will set the insertion point at
the end of the range.

**See Also**
* [`Range`](#range-1)

#### Type declaration

<a id="direction-1" name="direction-1"></a>

<MemberCard>

##### Selection.direction?

```ts
optional direction: "forward" | "backward" | "none";
```

</MemberCard>

<a id="ranges" name="ranges"></a>

<MemberCard>

##### Selection.ranges

```ts
ranges: Range[];
```

</MemberCard>

<a id="variant-1" name="variant-1"></a>

### Variant

```ts
type Variant: 
  | "ams"
  | "double-struck"
  | "calligraphic"
  | "script"
  | "fraktur"
  | "sans-serif"
  | "monospace"
  | "normal"
  | "main"
  | "math";
```

Variants indicate a stylistic alternate for some characters.

Typically, those are controlled with explicit commands, such as
`\mathbb{}` or `\mathfrak{}`. This type is used with the
[`MathfieldElement.applyStyle`](#applystyle) method to change the styling of a range of
selected characters.

In mathematical notation these variants are used not only for visual
presentation, but they may have semantic significance.

For example,
- the set ℂ should not be confused with
- the physical unit 𝖢 (Coulomb).

When rendered, these variants can map to some built-in fonts.

LaTeX supports a limited set of characters. However, MathLive will
map characters not supported by LaTeX  fonts (double-stuck variant for digits
for example) to a Unicode character (see [Mathematical Alphanumeric Symbols on Wikipedia](https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols) ).

`normal` is a synthetic variant that maps either to `main` (upright) or
`math` (italic) depending on the symbol and the `letterShapeStyle`.

The `math` variant has italic characters as well as slightly different
letter shape and spacing (a bit more space after the "f" for example), so
it's not equivalent to a `main` variant with `italic` variant style applied.

**See Also**
* [`Style`](#style-1)

<a id="variantstyle-1" name="variantstyle-1"></a>

### VariantStyle

```ts
type VariantStyle: 
  | "up"
  | "bold"
  | "italic"
  | "bolditalic"
  | "";
```

Some variants support stylistic variations.

Note that these stylistic variations support a limited set of characters,
typically just uppercase and lowercase letters, and digits 0-9 in some cases.

| variant            | `up`       | `bold`       | `italic` | `bolditalic` |
| ------------------ | ---        | ---          | ---      | --- |
| `normal`    | ABCabc012 | 𝐀𝐁𝐂𝐚𝐛𝐜𝟎𝟏𝟐  | 𝐴𝐵𝐶𝑎𝑏𝑐  |𝑨𝑩𝑪𝒂𝒃𝒄  |
| `double-struck`    | 𝔸𝔹ℂ𝕒𝕓𝕔𝟘𝟙𝟚  | n/a          | n/a      | n/a  |
| `calligraphic`     | 𝒜ℬ𝒞𝒶𝒷𝒸   | 𝓐𝓑𝓒𝓪𝓫𝓬      | n/a      | n/a  |
| `fraktur`          | 𝔄𝔅ℭ𝔞𝔟𝔠     | 𝕬𝕭𝕮𝖆𝖇𝖈       | n/a      | n/a  |
| `sans-serif`| 𝖠𝖡𝖢𝖺𝖻𝖼𝟢𝟣𝟤 | 𝗔𝗕𝗖𝗮𝗯𝗰𝟬𝟭𝟮 | 𝘈𝘉𝘊𝘢𝘣𝘤 | 𝘼𝘽𝘾𝙖𝙗𝙘  |
| `monospace`        | 𝙰𝙱𝙲𝚊𝚋𝚌     | n/a          | n/a      | n/a  |

<a id="version-1" name="version-1"></a>

<MemberCard>

### version

```ts
const version: object;
```

Current version: `0.98.6`

The version string of the SDK using the [semver](https://semver.org/) convention:

`MAJOR`.`MINOR`.`PATCH`

* **`MAJOR`** is incremented for incompatible API changes
* **`MINOR`** is incremented for new features
* **`PATCH`** is incremented for bug fixes

#### Type declaration

<a id="mathlive" name="mathlive"></a>

<MemberCard>

##### version.mathlive

```ts
mathlive: string = '0.98.6';
```

</MemberCard>

</MemberCard>

<a id="validatelatex" name="validatelatex"></a>

<MemberCard>

### validateLatex()

```ts
function validateLatex(s): LatexSyntaxError[]
```

• **s**: `string`

[`LatexSyntaxError`](#latexsyntaxerrort)[]

</MemberCard>

## Registers

<a id="dimension" name="dimension"></a>

### Dimension

```ts
type Dimension: object;
```

A dimension is used to specify the size of things

#### Type declaration

<a id="dimension-1" name="dimension-1"></a>

<MemberCard>

##### Dimension.dimension

```ts
dimension: number;
```

</MemberCard>

<a id="unit" name="unit"></a>

<MemberCard>

##### Dimension.unit?

```ts
optional unit: DimensionUnit;
```

</MemberCard>

<a id="dimensionunit" name="dimensionunit"></a>

### DimensionUnit

```ts
type DimensionUnit: 
  | "pt"
  | "mm"
  | "cm"
  | "ex"
  | "px"
  | "em"
  | "bp"
  | "dd"
  | "pc"
  | "in"
  | "mu"
  | "fil"
  | "fill"
  | "filll";
```

<a id="glue" name="glue"></a>

### Glue

```ts
type Glue: object;
```

Glue represents flexible spacing, that is a dimension that
can grow (by the `grow` property) or shrink (by the `shrink` property).

#### Type declaration

<a id="glue-1" name="glue-1"></a>

<MemberCard>

##### Glue.glue

```ts
glue: Dimension;
```

</MemberCard>

<a id="grow" name="grow"></a>

<MemberCard>

##### Glue.grow?

```ts
optional grow: Dimension;
```

</MemberCard>

<a id="shrink" name="shrink"></a>

<MemberCard>

##### Glue.shrink?

```ts
optional shrink: Dimension;
```

</MemberCard>

<a id="latexvalue" name="latexvalue"></a>

### LatexValue

```ts
type LatexValue: object & 
  | Dimension
  | Glue
  | object
  | object
  | object;
```

A LaTeX expression represent a sequence of tokens that can be evaluated to
a value, such as a dimension.

#### Type declaration

<MemberCard>

##### LatexValue.relax?

```ts
optional relax: boolean;
```

</MemberCard>

<a id="registers-2" name="registers-2"></a>

### Registers

```ts
type Registers: Record<string, number | string | LatexValue>;
```

TeX registers represent "variables" and "constants".

Changing the values of some registers can modify the layout
of math expressions.

The following registers might be of interest:

- `thinmuskip`: space between items of math lists
- `medmuskip`: space between binary operations
- `thickmuskip`: space between relational operators
- `nulldelimiterspace`: minimum space to leave blank in delimiter constructions, for example around a fraction
- `delimitershortfall`: maximum space to overlap adjacent elements when a delimiter is too short
- `jot`: space between lines in an array, or between rows in a multiline construct
- `arraycolsep`: space between columns in an array
- `arraystretch`: factor by which to stretch the height of each row in an array

To modify a register, use:

```javascript
mf.registers.arraystretch = 1.5;
mf.registers.thinmuskip = { dimension: 2, unit: "mu" };
mf.registers.medmuskip = "3mu";
```

## Speech

<a id="speechscope" name="speechscope"></a>

### SpeechScope

```ts
type SpeechScope: 
  | "all"
  | "selection"
  | "left"
  | "right"
  | "group"
  | "parent";
```

How much of the formula should be spoken:
| | |
|---:|:---|
| `all` | the entire formula |
| `selection` | the selection portion of the formula |
| `left` | the element to the left of the selection |
| `right` | the element to the right of the selection |
| `group` | the group (numerator, root, etc..) the selection is in |
| `parent` | the parent of the selection |

## Static Rendering

<a id="staticrenderoptions" name="staticrenderoptions"></a>

### StaticRenderOptions

```ts
type StaticRenderOptions: object;
```

#### Type declaration

<a id="tex" name="tex"></a>

<MemberCard>

##### StaticRenderOptions.TeX?

```ts
optional TeX: object;
```

</MemberCard>

<a id="classname" name="classname"></a>

<MemberCard>

##### TeX.className?

```ts
optional className: object;
```

</MemberCard>

<a id="display" name="display"></a>

<MemberCard>

##### TeX.className.display?

```ts
optional display: string;
```

</MemberCard>

<a id="inline" name="inline"></a>

<MemberCard>

##### TeX.className.inline?

```ts
optional inline: string;
```

</MemberCard>

<a id="delimiters" name="delimiters"></a>

<MemberCard>

##### TeX.delimiters?

```ts
optional delimiters: object;
```

Delimiter pairs that will trigger a render of the content in
display style or inline, respectively.

**Default**: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`

</MemberCard>

<a id="display-1" name="display-1"></a>

<MemberCard>

##### TeX.delimiters.display

```ts
display: [string, string][];
```

</MemberCard>

<a id="inline-1" name="inline-1"></a>

<MemberCard>

##### TeX.delimiters.inline

```ts
inline: [string, string][];
```

</MemberCard>

<a id="processenvironments" name="processenvironments"></a>

<MemberCard>

##### TeX.processEnvironments?

```ts
optional processEnvironments: boolean;
```

If true, math expression that start with `\begin{`
will automatically be rendered.

**Default**: true.

</MemberCard>

<a id="asciimath" name="asciimath"></a>

<MemberCard>

##### StaticRenderOptions.asciiMath?

```ts
optional asciiMath: object;
```

</MemberCard>

<a id="delimiters-1" name="delimiters-1"></a>

<MemberCard>

##### asciiMath.delimiters?

```ts
optional delimiters: object;
```

</MemberCard>

<a id="display-2" name="display-2"></a>

<MemberCard>

##### asciiMath.delimiters.display?

```ts
optional display: [string, string][];
```

</MemberCard>

<a id="inline-2" name="inline-2"></a>

<MemberCard>

##### asciiMath.delimiters.inline?

```ts
optional inline: [string, string][];
```

</MemberCard>

<a id="ignoreclass" name="ignoreclass"></a>

<MemberCard>

##### StaticRenderOptions.ignoreClass?

```ts
optional ignoreClass: string;
```

A string used as a regular expression of class names of elements whose
content will not be scanned for delimiter

**Default**: `"tex2jax_ignore"`

</MemberCard>

<a id="processclass" name="processclass"></a>

<MemberCard>

##### StaticRenderOptions.processClass?

```ts
optional processClass: string;
```

A string used as a regular expression of class names of elements whose
content **will** be scanned for delimiters,  even if their tag name or
parent class name would have prevented them from doing so.

**Default**: `"tex2jax_process"`

</MemberCard>

<a id="processmathjsonscripttype" name="processmathjsonscripttype"></a>

<MemberCard>

##### StaticRenderOptions.processMathJSONScriptType?

```ts
optional processMathJSONScriptType: string;
```

`<script>` tags with this type will be processed as MathJSON.

**Default**: `"math/json"`

</MemberCard>

<a id="processscripttype" name="processscripttype"></a>

<MemberCard>

##### StaticRenderOptions.processScriptType?

```ts
optional processScriptType: string;
```

`<script>` tags with this type will be processed as LaTeX.

**Default**: `"math/tex"`

</MemberCard>

<a id="readaloud" name="readaloud"></a>

<MemberCard>

##### StaticRenderOptions.readAloud?

```ts
optional readAloud: boolean;
```

If true, generate markup that can
be read aloud later using speak

**Default**: `false`

</MemberCard>

<a id="renderaccessiblecontent" name="renderaccessiblecontent"></a>

<MemberCard>

##### StaticRenderOptions.renderAccessibleContent?

```ts
optional renderAccessibleContent: string;
```

The format(s) in which to render the math for screen readers:
- `"mathml"` MathML
- `"speakable-text"` Spoken representation

You can pass an empty string to turn off the rendering of accessible content.
You can pass multiple values separated by spaces, e.g `"mathml speakable-text"`

**Default**: `"mathml"`

</MemberCard>

<a id="skiptags" name="skiptags"></a>

<MemberCard>

##### StaticRenderOptions.skipTags?

```ts
optional skipTags: string[];
```

An array of tag names whose content will not be scanned for delimiters
(unless their class matches the `processClass` pattern below).

**Default:** `['math-field', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']`

</MemberCard>

<a id="rendermathindocument" name="rendermathindocument"></a>

<MemberCard>

### renderMathInDocument()

```ts
function renderMathInDocument(options?): void
```

Transform all the elements in the document body that contain LaTeX code
into typeset math.

**Caution**

This is a very expensive call, as it needs to parse the entire
DOM tree to determine which elements need to be processed. In most cases
this should only be called once per document, once the DOM has been loaded.

To render a specific element, use [`renderMathInElement()`](#rendermathinelement)

• **options?**: [`StaticRenderOptions`](#staticrenderoptions)

`void`

#### Example

```ts
import { renderMathInDocument } from 'https://unpkg.com/mathlive?module';
renderMathInDocument();
```

#### Keywords

render, document, autorender

</MemberCard>

<a id="rendermathinelement" name="rendermathinelement"></a>

<MemberCard>

### renderMathInElement()

```ts
function renderMathInElement(element, options?): void
```

Transform all the children of `element` that contain LaTeX code
into typeset math, recursively.

• **element**: `string` \| `HTMLElement`

An HTML DOM element, or a string containing
the ID of an element.

• **options?**: [`StaticRenderOptions`](#staticrenderoptions)

`void`

#### Example

```ts
import { renderMathInElement } from 'https://unpkg.com/mathlive?module';
renderMathInElement("formula");
```

#### Keywords

render, element, htmlelement

</MemberCard>

## Virtual Keyboard

<a id="normalizedvirtualkeyboardlayer" name="normalizedvirtualkeyboardlayer"></a>

### NormalizedVirtualKeyboardLayer

<a id="backdrop" name="backdrop"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.backdrop?

```ts
optional backdrop: string;
```

</MemberCard>

<a id="container" name="container"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.container?

```ts
optional container: string;
```

</MemberCard>

<a id="id" name="id"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.id?

```ts
optional id: string;
```

</MemberCard>

<a id="markup" name="markup"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.markup?

```ts
optional markup: string;
```

</MemberCard>

<a id="rows" name="rows"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.rows?

```ts
optional rows: Partial<VirtualKeyboardKeycap>[][];
```

</MemberCard>

<a id="style" name="style"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.style?

```ts
optional style: string;
```

</MemberCard>

<a id="virtualkeyboardinterface" name="virtualkeyboardinterface"></a>

### VirtualKeyboardInterface

This interface is implemented by:
- `VirtualKeyboard`: when the browsing context is a top-level document
- `VirtualKeyboardProxy`: when the browsing context is an iframe

#### Extends

- [`VirtualKeyboardOptions`](#virtualkeyboardoptions)

<a id="boundingrect" name="boundingrect"></a>

<MemberCard>

##### VirtualKeyboardInterface.boundingRect

```ts
readonly boundingRect: DOMRect;
```

</MemberCard>

<a id="isshifted" name="isshifted"></a>

<MemberCard>

##### VirtualKeyboardInterface.isShifted

```ts
readonly isShifted: boolean;
```

</MemberCard>

<a id="normalizedlayouts" name="normalizedlayouts"></a>

<MemberCard>

##### VirtualKeyboardInterface.normalizedLayouts

```ts
readonly normalizedLayouts: VirtualKeyboardLayoutCore & object[];
```

</MemberCard>

<a id="originvalidator" name="originvalidator"></a>

<MemberCard>

##### VirtualKeyboardInterface.originValidator

```ts
originValidator: OriginValidator;
```

Specify behavior how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
should be validated.

**Default**: `"none"`

</MemberCard>

<a id="targetorigin" name="targetorigin"></a>

<MemberCard>

##### VirtualKeyboardInterface.targetOrigin

```ts
targetOrigin: string;
```

Specify the `targetOrigin` parameter for [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
to send control messages from parent to child frame to remote control of
mathfield component.

**Default**: `globalThis.origin`

</MemberCard>

<a id="visible" name="visible"></a>

<MemberCard>

##### VirtualKeyboardInterface.visible

```ts
visible: boolean;
```

</MemberCard>

<a id="actionkeycap" name="actionkeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.actionKeycap

```ts
set actionKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="alphabeticlayout" name="alphabeticlayout"></a>

<MemberCard>

##### VirtualKeyboardInterface.alphabeticLayout

```ts
set alphabeticLayout(value): void
```

Layout of the alphabetic layers: AZERTY, QWERTY, etc...

• **value**: [`AlphabeticKeyboardLayout`](#alphabetickeyboardlayout)

</MemberCard>

<a id="backspacekeycap" name="backspacekeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.backspaceKeycap

```ts
set backspaceKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="container-1" name="container-1"></a>

<MemberCard>

##### VirtualKeyboardInterface.container

```ts
set container(value): void
```

Element the virtual keyboard element gets appended to.

When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
that contain mathfield, set this property to the full screen element to
ensure the virtual keyboard will be visible.

**Default**: `document.body`

• **value**: `HTMLElement`

</MemberCard>

<a id="edittoolbar" name="edittoolbar"></a>

<MemberCard>

##### VirtualKeyboardInterface.editToolbar

```ts
set editToolbar(value): void
```

Configuration of the action toolbar, displayed on the right-hand side.

Use `"none"` to disable the right hand side toolbar of the
virtual keyboard.

• **value**: [`EditToolbarOptions`](#edittoolbaroptions)

</MemberCard>

<a id="layouts" name="layouts"></a>

<MemberCard>

##### VirtualKeyboardInterface.layouts

```ts
get layouts(): readonly (VirtualKeyboardLayout | VirtualKeyboardName)[]
```

A layout is made up of one or more layers (think of the main layer
and the shift layer on a hardware keyboard).

A layout has a name and styling information.

In addition, a layout can be represented as a standard name which
includes `"numeric"`, `"functions"`, `"symbols"`, `"alphabetic"`
and `"greek".

**See* mathfield/guides/virtual-keyboards | Guide: Virtual Keyboards

```ts
set layouts(value): void
```

• **value**: [`VirtualKeyboardLayout`](#virtualkeyboardlayout) \| [`VirtualKeyboardName`](#virtualkeyboardname) \| VirtualKeyboardLayout \| VirtualKeyboardName[] \| readonly VirtualKeyboardLayout \| VirtualKeyboardName[]

readonly ([`VirtualKeyboardLayout`](#virtualkeyboardlayout) \| [`VirtualKeyboardName`](#virtualkeyboardname))[]

</MemberCard>

<a id="shiftkeycap" name="shiftkeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.shiftKeycap

```ts
set shiftKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="tabkeycap" name="tabkeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.tabKeycap

```ts
set tabKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="connect" name="connect"></a>

<MemberCard>

##### VirtualKeyboardInterface.connect()

```ts
connect(): void
```

`void`

</MemberCard>

<a id="disconnect" name="disconnect"></a>

<MemberCard>

##### VirtualKeyboardInterface.disconnect()

```ts
disconnect(): void
```

`void`

</MemberCard>

<a id="executecommand-1" name="executecommand-1"></a>

<MemberCard>

##### VirtualKeyboardInterface.executeCommand()

```ts
executeCommand(command): boolean
```

• **command**: `string` \| [`string`, `...any[]`]

`boolean`

</MemberCard>

<a id="hide" name="hide"></a>

<MemberCard>

##### VirtualKeyboardInterface.hide()

```ts
hide(options?): void
```

• **options?**

• **options.animate?**: `boolean`

`void`

</MemberCard>

<a id="show" name="show"></a>

<MemberCard>

##### VirtualKeyboardInterface.show()

```ts
show(options?): void
```

• **options?**

• **options.animate?**: `boolean`

`void`

</MemberCard>

<a id="update" name="update"></a>

<MemberCard>

##### VirtualKeyboardInterface.update()

```ts
update(mf): void
```

• **mf**: `MathfieldProxy`

`void`

</MemberCard>

<a id="updatetoolbar" name="updatetoolbar"></a>

<MemberCard>

##### VirtualKeyboardInterface.updateToolbar()

```ts
updateToolbar(mf): void
```

The content or selection of the mathfield has changed and the toolbar
may need to be updated accordingly

• **mf**: `MathfieldProxy`

`void`

</MemberCard>

<a id="virtualkeyboardkeycap" name="virtualkeyboardkeycap"></a>

### VirtualKeyboardKeycap

<a id="aside" name="aside"></a>

<MemberCard>

##### VirtualKeyboardKeycap.aside

```ts
aside: string;
```

Markup displayed with the key label (for example to explain what the
symbol of the key is)

</MemberCard>

<a id="class" name="class"></a>

<MemberCard>

##### VirtualKeyboardKeycap.class

```ts
class: string;
```

CSS classes to apply to the keycap.

- `tex`: use the TeX font for its label.
   Using the tex class is not necessary if using the `latex` property to
   define the label.
- `shift`: a shift key
- `small`: display the label in a smaller size
- `action`: an “action” keycap (for arrows, return, etc…)
- `separator w5`: a half-width blank used as a separator. Other widths
   include `w15` (1.5 width), `w20` (double width) and `w50` (five-wide,
   used for the space bar).
- `bottom`, `left`, `right`: alignment of the label

</MemberCard>

<a id="command" name="command"></a>

<MemberCard>

##### VirtualKeyboardKeycap.command

```ts
command: 
  | string[]
  | [string, any]
  | Selector
  | [string, any, any]
  | [string, any, any, any];
```

Command to perform when the keycap is pressed

</MemberCard>

<a id="insert-2" name="insert-2"></a>

<MemberCard>

##### VirtualKeyboardKeycap.insert

```ts
insert: string;
```

LaTeX fragment to insert when the keycap is pressed
(ignored if command is specified)

</MemberCard>

<a id="key" name="key"></a>

<MemberCard>

##### VirtualKeyboardKeycap.key

```ts
key: string;
```

Key to insert when keycap is pressed
(ignored if `command`, `insert` or `latex` is specified)

</MemberCard>

<a id="label" name="label"></a>

<MemberCard>

##### VirtualKeyboardKeycap.label

```ts
label: string;
```

The HTML markup displayed for the keycap

</MemberCard>

<a id="latex" name="latex"></a>

<MemberCard>

##### VirtualKeyboardKeycap.latex

```ts
latex: string;
```

Label of the key as a LaTeX expression, also the LaTeX
inserted if no `command` or `insert` property is specified.

</MemberCard>

<a id="layer" name="layer"></a>

<MemberCard>

##### VirtualKeyboardKeycap.layer

```ts
layer: string;
```

Name of the layer to shift to when the key is pressed

</MemberCard>

<a id="shift" name="shift"></a>

<MemberCard>

##### VirtualKeyboardKeycap.shift

```ts
shift: string | Partial<VirtualKeyboardKeycap>;
```

Variant of the keycap when the shift key is pressed

</MemberCard>

<a id="tooltip" name="tooltip"></a>

<MemberCard>

##### VirtualKeyboardKeycap.tooltip

```ts
tooltip: string;
```

</MemberCard>

<a id="variants" name="variants"></a>

<MemberCard>

##### VirtualKeyboardKeycap.variants

```ts
variants: string | (string | Partial<VirtualKeyboardKeycap>)[];
```

A set of keycap variants displayed on a long press

```js
variants: [
 '\\alpha',    // Same label as value inserted
 { latex: '\\beta', label: 'beta' }
]

```

</MemberCard>

<a id="width" name="width"></a>

<MemberCard>

##### VirtualKeyboardKeycap.width

```ts
width: 
  | 0.5
  | 1
  | 1.5
  | 2
  | 5;
```

Width of the keycap, as a multiple of the standard keycap width

</MemberCard>

<a id="virtualkeyboardlayer" name="virtualkeyboardlayer"></a>

### VirtualKeyboardLayer

<a id="backdrop-1" name="backdrop-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.backdrop?

```ts
optional backdrop: string;
```

A CSS class name to customize the appearance of the background of the layer

</MemberCard>

<a id="container-2" name="container-2"></a>

<MemberCard>

##### VirtualKeyboardLayer.container?

```ts
optional container: string;
```

A CSS class name to customize the appearance of the container the layer

</MemberCard>

<a id="id-1" name="id-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.id?

```ts
optional id: string;
```

A unique string identifying the layer

</MemberCard>

<a id="markup-1" name="markup-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.markup?

```ts
optional markup: string;
```

</MemberCard>

<a id="rows-1" name="rows-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.rows?

```ts
optional rows: (string | Partial<VirtualKeyboardKeycap>)[][];
```

The rows of keycaps in this layer

</MemberCard>

<a id="style-2" name="style-2"></a>

<MemberCard>

##### VirtualKeyboardLayer.style?

```ts
optional style: string;
```

The CSS stylesheet associated with this layer

</MemberCard>

<a id="virtualkeyboardoptions" name="virtualkeyboardoptions"></a>

### VirtualKeyboardOptions

#### Extended by

- [`VirtualKeyboardInterface`](#virtualkeyboardinterface)

<a id="normalizedlayouts-1" name="normalizedlayouts-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.normalizedLayouts

```ts
readonly normalizedLayouts: VirtualKeyboardLayoutCore & object[];
```

</MemberCard>

<a id="originvalidator-1" name="originvalidator-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.originValidator

```ts
originValidator: OriginValidator;
```

Specify behavior how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
should be validated.

**Default**: `"none"`

</MemberCard>

<a id="targetorigin-1" name="targetorigin-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.targetOrigin

```ts
targetOrigin: string;
```

Specify the `targetOrigin` parameter for [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
to send control messages from parent to child frame to remote control of
mathfield component.

**Default**: `globalThis.origin`

</MemberCard>

<a id="actionkeycap-1" name="actionkeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.actionKeycap

```ts
set actionKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="alphabeticlayout-1" name="alphabeticlayout-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.alphabeticLayout

```ts
set alphabeticLayout(value): void
```

Layout of the alphabetic layers: AZERTY, QWERTY, etc...

• **value**: [`AlphabeticKeyboardLayout`](#alphabetickeyboardlayout)

</MemberCard>

<a id="backspacekeycap-1" name="backspacekeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.backspaceKeycap

```ts
set backspaceKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="container-3" name="container-3"></a>

<MemberCard>

##### VirtualKeyboardOptions.container

```ts
set container(value): void
```

Element the virtual keyboard element gets appended to.

When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
that contain mathfield, set this property to the full screen element to
ensure the virtual keyboard will be visible.

**Default**: `document.body`

• **value**: `HTMLElement`

</MemberCard>

<a id="edittoolbar-1" name="edittoolbar-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.editToolbar

```ts
set editToolbar(value): void
```

Configuration of the action toolbar, displayed on the right-hand side.

Use `"none"` to disable the right hand side toolbar of the
virtual keyboard.

• **value**: [`EditToolbarOptions`](#edittoolbaroptions)

</MemberCard>

<a id="layouts-1" name="layouts-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.layouts

```ts
get layouts(): readonly (VirtualKeyboardLayout | VirtualKeyboardName)[]
```

A layout is made up of one or more layers (think of the main layer
and the shift layer on a hardware keyboard).

A layout has a name and styling information.

In addition, a layout can be represented as a standard name which
includes `"numeric"`, `"functions"`, `"symbols"`, `"alphabetic"`
and `"greek".

**See* mathfield/guides/virtual-keyboards | Guide: Virtual Keyboards

```ts
set layouts(value): void
```

• **value**: [`VirtualKeyboardLayout`](#virtualkeyboardlayout) \| [`VirtualKeyboardName`](#virtualkeyboardname) \| VirtualKeyboardLayout \| VirtualKeyboardName[] \| readonly VirtualKeyboardLayout \| VirtualKeyboardName[]

readonly ([`VirtualKeyboardLayout`](#virtualkeyboardlayout) \| [`VirtualKeyboardName`](#virtualkeyboardname))[]

</MemberCard>

<a id="shiftkeycap-1" name="shiftkeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.shiftKeycap

```ts
set shiftKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="tabkeycap-1" name="tabkeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.tabKeycap

```ts
set tabKeycap(value): void
```

• **value**: `string` \| `Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="alphabetickeyboardlayout" name="alphabetickeyboardlayout"></a>

### AlphabeticKeyboardLayout

```ts
type AlphabeticKeyboardLayout: 
  | "auto"
  | "qwerty"
  | "azerty"
  | "qwertz"
  | "dvorak"
  | "colemak";
```

<a id="edittoolbaroptions" name="edittoolbaroptions"></a>

### EditToolbarOptions

```ts
type EditToolbarOptions: "none" | "default";
```

<a id="normalizedvirtualkeyboardlayout" name="normalizedvirtualkeyboardlayout"></a>

### NormalizedVirtualKeyboardLayout

```ts
type NormalizedVirtualKeyboardLayout: VirtualKeyboardLayoutCore & object;
```

#### Type declaration

<MemberCard>

##### NormalizedVirtualKeyboardLayout.layers

```ts
layers: NormalizedVirtualKeyboardLayer[];
```

</MemberCard>

<a id="virtualkeyboardlayout" name="virtualkeyboardlayout"></a>

### VirtualKeyboardLayout

```ts
type VirtualKeyboardLayout: VirtualKeyboardLayoutCore & object | object | object;
```

<a id="virtualkeyboardlayoutcore" name="virtualkeyboardlayoutcore"></a>

### VirtualKeyboardLayoutCore

```ts
type VirtualKeyboardLayoutCore: object;
```

#### Type declaration

<a id="displayedittoolbar" name="displayedittoolbar"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.displayEditToolbar?

```ts
optional displayEditToolbar: boolean;
```

If false, do not include the edit toolbar in the layout

</MemberCard>

<a id="displayshiftedkeycaps" name="displayshiftedkeycaps"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.displayShiftedKeycaps?

```ts
optional displayShiftedKeycaps: boolean;
```

If false, keycaps that have a shifted variant will be displayed as if they don't

</MemberCard>

<a id="id-3" name="id-3"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.id?

```ts
optional id: string;
```

A unique string identifying the layout

</MemberCard>

<a id="label-1" name="label-1"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.label?

```ts
optional label: string;
```

A human readable string displayed in the layout switcher toolbar

</MemberCard>

<a id="labelclass" name="labelclass"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.labelClass?

```ts
optional labelClass: string;
```

</MemberCard>

<a id="tooltip-1" name="tooltip-1"></a>

<MemberCard>

##### VirtualKeyboardLayoutCore.tooltip?

```ts
optional tooltip: string;
```

A human readable tooltip associated with the label

</MemberCard>

<a id="virtualkeyboardmessage" name="virtualkeyboardmessage"></a>

### VirtualKeyboardMessage

```ts
type VirtualKeyboardMessage: 
  | object
  | object
  | object
  | object
  | object
  | object;
```

<a id="virtualkeyboardmessageaction" name="virtualkeyboardmessageaction"></a>

### VirtualKeyboardMessageAction

```ts
type VirtualKeyboardMessageAction: 
  | "connect"
  | "disconnect"
  | "proxy-created"
  | "execute-command"
  | "show"
  | "hide"
  | "update-setting"
  | "update-toolbar"
  | "synchronize-proxy"
  | "geometry-changed"
  | "update-state"
  | "focus"
  | "blur";
```

<a id="virtualkeyboardname" name="virtualkeyboardname"></a>

### VirtualKeyboardName

```ts
type VirtualKeyboardName: 
  | "default"
  | "compact"
  | "minimalist"
  | "numeric-only"
  | "numeric"
  | "symbols"
  | "alphabetic"
  | "greek";
```

<a id="virtualkeyboardpolicy" name="virtualkeyboardpolicy"></a>

### VirtualKeyboardPolicy

```ts
type VirtualKeyboardPolicy: "auto" | "manual" | "sandboxed";
```

- `"auto"`: the virtual keyboard is triggered when a
mathfield is focused on a touch capable device.
- `"manual"`: the virtual keyboard is not triggered automatically
- `"sandboxed"`: the virtual keyboard is displayed in the current browsing
context (iframe) if it has a defined container or is the top-level browsing
context.

## Web Component

<a id="mathfieldelement" name="mathfieldelement"></a>

### MathfieldElement

The `MathfieldElement` class represent a DOM element that displays
math equations.

It is a subclass of the standard
[`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
class and as such inherits all of its properties and methods.

It inherits many useful properties and methods from `HTMLElement` such
as `style`, `tabIndex`, `addEventListener()`, `getAttribute()`,  etc...

It is typically used to render a single equation.

To render multiple equations, use multiple instances of `MathfieldElement`.

The `MathfieldElement` class provides special properties and methods to
control the display and behavior of `<math-field>` elements.

You will usually instantiate a `MathfieldElement` using the
`<math-field>` tag in HTML. However, if necessary you can also create
it programmatically using `new MathfieldElement()`.

```javascript
// 1. Create a new MathfieldElement
const mf = new MathfieldElement();

// 2. Attach it to the DOM
document.body.appendChild(mf);
```

The `MathfieldElement` constructor has an optional argument of
`MathfieldOptions` to configure the element. The options can also
be modified later:

```javascript
// Setting options during construction
const mf = new MathfieldElement({ smartFence: false });

// Modifying options after construction
mf.smartFence = true;
```

#### MathfieldElement CSS Variables

To customize the appearance of the mathfield, declare the following CSS
variables (custom properties) in a ruleset that applies to the mathfield.

```css
math-field {
 --hue: 10       // Set the highlight color and caret to a reddish hue
}
```

Alternatively you can set these CSS variables programatically:

```js
document.body.style.setProperty("--hue", "10");
```
<div className='symbols-table' style={{"--first-col-width":"25ex"}}>

| CSS Variable | Usage |
|:---|:---|
| `--hue` | Hue of the highlight color and the caret |
| `--contains-highlight-background-color` | Backround property for items that contain the caret |
| `--primary-color` | Primary accent color, used for example in the virtual keyboard |
| `--text-font-family` | The font stack used in text mode |
| `--smart-fence-opacity` | Opacity of a smart fence (default is 50%) |
| `--smart-fence-color` | Color of a smart fence (default is current color) |

</div>

You can customize the appearance and zindex of the virtual keyboard panel
with some CSS variables associated with a selector that applies to the
virtual keyboard panel container.

Read more about [customizing the virtual keyboard appearance](#custom-appearance)

#### MathfieldElement CSS Parts

To style the virtual keyboard toggle, use the `virtual-keyboard-toggle` CSS
part. To use it, define a CSS rule with a `::part()` selector
for example:

```css
math-field::part(virtual-keyboard-toggle) {
 color: red;
}
```

#### MathfieldElement Attributes

An attribute is a key-value pair set as part of the tag:

```html
<math-field letter-shape-style="tex"></math-field>
```

The supported attributes are listed in the table below with their
corresponding property.

The property can also be changed directly on the `MathfieldElement` object:

```javascript
 getElementById('mf').value = "\\sin x";
 getElementById('mf').letterShapeStyle = "text";
```

The values of attributes and properties are reflected, which means you can
change one or the other, for example:

```javascript
getElementById('mf').setAttribute('letter-shape-style',  'french');
console.log(getElementById('mf').letterShapeStyle);
// Result: "french"
getElementById('mf').letterShapeStyle ='tex;
console.log(getElementById('mf').getAttribute('letter-shape-style');
// Result: 'tex'
```

An exception is the `value` property, which is not reflected on the `value`
attribute: for consistency with other DOM elements, the `value` attribute
remains at its initial value.

<div className='symbols-table' style={{"--first-col-width":"32ex"}}>

| Attribute | Property |
|:---|:---|
| `disabled` | `mf.disabled` |
| `default-mode` | `mf.defaultMode` |
| `letter-shape-style` | `mf.letterShapeStyle` |
| `min-font-scale` | `mf.minFontScale` |
| `max-matrix-cols` | `mf.maxMatrixCols` |
| `popover-policy` | `mf.popoverPolicy` |
| `math-mode-space` | `mf.mathModeSpace` |
| `read-only` | `mf.readOnly` |
| `remove-extraneous-parentheses` | `mf.removeExtraneousParentheses` |
| `smart-fence` | `mf.smartFence` |
| `smart-mode` | `mf.smartMode` |
| `smart-superscript` | `mf.smartSuperscript` |
| `inline-shortcut-timeout` | `mf.inlineShortcutTimeout` |
| `script-depth` | `mf.scriptDepth` |
| `value` | `value` |
| `math-virtual-keyboard-policy` | `mathVirtualKeyboardPolicy` |

</div>

See `MathfieldOptions` for more details about these options.

In addition, the following [global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)
can also be used:
- `class`
- `data-*`
- `hidden`
- `id`
- `item*`
- `style`
- `tabindex`

#### MathfieldElement Events

Listen to these events by using `addEventListener()`. For events with
additional arguments, the arguments are available in `event.detail`.

<div className='symbols-table' style={{"--first-col-width":"27ex"}}>

| Event Name  | Description |
|:---|:---|
| `beforeinput` | The value of the mathfield is about to be modified.  |
| `input` | The value of the mathfield has been modified. This happens on almost every keystroke in the mathfield. The `evt.data` property includes a copy of `evt.inputType`. See `InputEvent` |
| `change` | The user has committed the value of the mathfield. This happens when the user presses **Return** or leaves the mathfield. |
| `selection-change` | The selection (or caret position) in the mathfield has changed |
| `mode-change` | The mode (`math`, `text`) of the mathfield has changed |
| `undo-state-change` |  The state of the undo stack has changed. The `evt.detail.type` indicate if a snapshot was taken or an undo performed. |
| `read-aloud-status-change` | The status of a read aloud operation has changed |
| `before-virtual-keyboard-toggle` | The visibility of the virtual keyboard panel is about to change. The `evt.detail.visible` property indicate if the keyboard will be visible or not. Listen for this event on `window.mathVirtualKeyboard` |
| `virtual-keyboard-toggle` | The visibility of the virtual keyboard panel has changed. Listen for this event on `window.mathVirtualKeyboard` |
| `geometrychange` | The geometry of the virtual keyboard has changed. The `evt.detail.boundingRect` property is the new bounding rectangle of the virtual keyboard. Listen for this event on `window.mathVirtualKeyboard` |
| `blur` | The mathfield is losing focus |
| `focus` | The mathfield is gaining focus |
| `move-out` | The user has pressed an **arrow** key or the **tab** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br\> `detail: \{direction: 'forward' | 'backward' | 'upward' | 'downward'\}` **cancellable**|
| `keypress` | The user pressed a physical keyboard key |
| `mount` | The element has been attached to the DOM |
| `unmount` | The element is about to be removed from the DOM |

</div>

#### Keywords

zindex, events, attribute, attributes, property, properties, parts, variables, css, mathfield, mathfieldelement

#### Extends

- `HTMLElement`

#### Implements

- `Mathfield`

#### Accessing and changing the content

<a id="errors" name="errors"></a>

<MemberCard>

##### MathfieldElement.errors

```ts
get errors(): readonly LatexSyntaxError[]
```

Return an array of LaTeX syntax errors, if any.

readonly [`LatexSyntaxError`](#latexsyntaxerrort)[]

</MemberCard>

<a id="expression" name="expression"></a>

<MemberCard>

##### MathfieldElement.expression

```ts
get expression(): any
```

If the Compute Engine library is available, return a boxed MathJSON expression representing the value of the mathfield.

To load the Compute Engine library, use:
```js
import 'https://unpkg.com/@cortex-js/compute-engine?module';
```

```ts
set expression(mathJson): void
```

• **mathJson**: `any`

`any`

</MemberCard>

<a id="value" name="value"></a>

<MemberCard>

##### MathfieldElement.value

```ts
get value(): string
```

The content of the mathfield as a LaTeX expression.
```js
document.querySelector('mf').value = '\\frac{1}{\\pi}'
```

```ts
set value(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="applystyle" name="applystyle"></a>

<MemberCard>

##### MathfieldElement.applyStyle()

```ts
applyStyle(style, options?): void
```

• **style**: `Readonly`\<[`Style`](#style-1)\>

• **options?**: [`Range`](#range-1) \| `object`

`void`

###### Inherit Doc

</MemberCard>

<a id="getvalue" name="getvalue"></a>

<MemberCard>

##### MathfieldElement.getValue()

###### getValue(format)

```ts
getValue(format?): string
```

• **format?**: [`OutputFormat`](#outputformat)

`string`

###### getValue(start, end, format)

```ts
getValue(
   start, 
   end, 
   format?): string
```

• **start**: `number`

• **end**: `number`

• **format?**: [`OutputFormat`](#outputformat)

`string`

###### getValue(range, format)

```ts
getValue(range, format?): string
```

• **range**: [`Range`](#range-1)

• **format?**: [`OutputFormat`](#outputformat)

`string`

###### getValue(selection, format)

```ts
getValue(selection, format?): string
```

• **selection**: [`Selection`](#selection-1)

• **format?**: [`OutputFormat`](#outputformat)

`string`

</MemberCard>

<a id="insert" name="insert"></a>

<MemberCard>

##### MathfieldElement.insert()

```ts
insert(s, options?): boolean
```

• **s**: `string`

• **options?**: [`InsertOptions`](#insertoptions)

`boolean`

###### Inherit Doc

</MemberCard>

<a id="querystyle" name="querystyle"></a>

<MemberCard>

##### MathfieldElement.queryStyle()

```ts
queryStyle(style): "some" | "all" | "none"
```

If there is a selection, return if all the atoms in the selection,
some of them or none of them match the `style` argument.

If there is no selection, return 'all' if the current implicit style
(determined by a combination of the style of the previous atom and
the current style) matches the `style` argument, 'none' if it does not.

• **style**: `Readonly`\<[`Style`](#style-1)\>

`"some"` \| `"all"` \| `"none"`

</MemberCard>

<a id="setvalue" name="setvalue"></a>

<MemberCard>

##### MathfieldElement.setValue()

```ts
setValue(value?, options?): void
```

• **value?**: `string`

• **options?**: [`InsertOptions`](#insertoptions)

`void`

###### Inherit Doc

</MemberCard>

#### Customization

<a id="defaultmode" name="defaultmode"></a>

<MemberCard>

##### MathfieldElement.defaultMode

```ts
get defaultMode(): "text" | "math" | "inline-math"
```

###### Inherit Doc

```ts
set defaultMode(value): void
```

• **value**: `"text"` \| `"math"` \| `"inline-math"`

`"text"` \| `"math"` \| `"inline-math"`

</MemberCard>

<a id="macros" name="macros"></a>

<MemberCard>

##### MathfieldElement.macros

```ts
get macros(): Readonly<MacroDictionary>
```

###### Inherit Doc

```ts
set macros(value): void
```

• **value**: [`MacroDictionary`](#macrodictionary)

`Readonly`\<[`MacroDictionary`](#macrodictionary)\>

</MemberCard>

<a id="menuitems" name="menuitems"></a>

<MemberCard>

##### MathfieldElement.menuItems

```ts
get menuItems(): readonly MenuItem[]
```

```ts
set menuItems(menuItems): void
```

• **menuItems**: readonly `MenuItem`[]

readonly `MenuItem`[]

</MemberCard>

<a id="registers" name="registers"></a>

<MemberCard>

##### MathfieldElement.registers

```ts
get registers(): Readonly<Registers>
```

TeX registers represent "variables" and "constants".

Changing the values of some registers can modify the layout
of math expressions.

The following registers might be of interest:

- `thinmuskip`: space between items of math lists
- `medmuskip`: space between binary operations
- `thickmuskip`: space between relational operators
- `nulldelimiterspace`: minimum space to leave blank in delimiter constructions, for example around a fraction
- `delimitershortfall`: maximum space to overlap adjacent elements when a delimiter is too short
- `jot`: space between lines in an array, or between rows in a multiline construct
- `arraycolsep`: space between columns in an array
- `arraystretch`: factor by which to stretch the height of each row in an array

To modify a register, use:

```javascript
mf.registers.arraystretch = 1.5;
mf.registers.thinmuskip = { dimension: 2, unit: "mu" };
mf.registers.medmuskip = "3mu";
```

```ts
set registers(value): void
```

• **value**: [`Registers`](#registers-2)

`Readonly`\<[`Registers`](#registers-2)\>

</MemberCard>

#### Customization
{@inheritDoc EditingOptions.inlineShortcutTimeout}

<a id="inlineshortcuttimeout" name="inlineshortcuttimeout"></a>

<MemberCard>

##### MathfieldElement.inlineShortcutTimeout

```ts
get inlineShortcutTimeout(): number
```

```ts
set inlineShortcutTimeout(value): void
```

• **value**: `number`

`number`

</MemberCard>

#### Focus

<a id="blur" name="blur"></a>

<MemberCard>

##### MathfieldElement.blur()

```ts
blur(): void
```

Remove the focus from the mathfield (will no longer respond to keyboard
input).

`void`

</MemberCard>

<a id="focus" name="focus"></a>

<MemberCard>

##### MathfieldElement.focus()

```ts
focus(): void
```

Sets the focus to the mathfield (will respond to keyboard input).

`void`

</MemberCard>

<a id="hasfocus" name="hasfocus"></a>

<MemberCard>

##### MathfieldElement.hasFocus()

```ts
hasFocus(): boolean
```

`boolean`

###### Inherit Doc

</MemberCard>

#### Hooks

<a id="onexport" name="onexport"></a>

<MemberCard>

##### MathfieldElement.onExport

```ts
get onExport(): (from, latex, range) => string
```

###### Inherit Doc

```ts
set onExport(value): void
```

• **value**

`Function`

• **from**: `Mathfield`

• **latex**: `string`

• **range**: [`Range`](#range-1)

`string`

</MemberCard>

<a id="oninlineshortcut" name="oninlineshortcut"></a>

<MemberCard>

##### MathfieldElement.onInlineShortcut

```ts
get onInlineShortcut(): (sender, symbol) => string
```

###### Inherit Doc

```ts
set onInlineShortcut(value): void
```

• **value**

`Function`

• **sender**: `Mathfield`

• **symbol**: `string`

`string`

</MemberCard>

<a id="onscrollintoview" name="onscrollintoview"></a>

<MemberCard>

##### MathfieldElement.onScrollIntoView

```ts
get onScrollIntoView(): (sender) => void
```

###### Inherit Doc

```ts
set onScrollIntoView(value): void
```

• **value**

`Function`

• **sender**: `Mathfield`

`void`

</MemberCard>

#### Localization

<a id="fractionnavigationorder" name="fractionnavigationorder"></a>

<MemberCard>

##### MathfieldElement.fractionNavigationOrder

```ts
static fractionNavigationOrder: "numerator-denominator" | "denominator-numerator" = 'numerator-denominator';
```

When using the keyboard to navigate a fraction, the order in which the
numerator and navigator are traversed:
- "numerator-denominator": first the elements in the numerator, then
  the elements in the denominator.
- "denominator-numerator": first the elements in the denominator, then
  the elements in the numerator. In some East-Asian cultures, fractions
  are read and written denominator first ("fēnzhī"). With this option
  the keyboard navigation follows this convention.

**Default**: `"numerator-denominator"`

</MemberCard>

<a id="decimalseparator" name="decimalseparator"></a>

<MemberCard>

##### MathfieldElement.decimalSeparator

```ts
get static decimalSeparator(): "," | "."
```

The symbol used to separate the integer part from the fractional part of a
number.

When `","` is used, the corresponding LaTeX string is `{,}`, in order
to ensure proper spacing (otherwise an extra gap is displayed after the
comma).

This affects:
- what happens when the `,` key is pressed (if `decimalSeparator` is
`","`, the `{,}` LaTeX string is inserted when following some digits)
- the label and behavior of the "." key in the default virtual keyboard

**Default**: `"."`

```ts
set static decimalSeparator(value): void
```

• **value**: `","` \| `"."`

`","` \| `"."`

</MemberCard>

<a id="locale" name="locale"></a>

<MemberCard>

##### MathfieldElement.locale

```ts
get static locale(): string
```

The locale (language + region) to use for string localization.

If none is provided, the locale of the browser is used.

```ts
set static locale(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="strings" name="strings"></a>

<MemberCard>

##### MathfieldElement.strings

```ts
get static strings(): Readonly<Record<string, Record<string, string>>>
```

An object whose keys are a locale string, and whose values are an object of
string identifier to localized string.

**Example**

```js example
mf.strings = {
  "fr-CA": {
      "tooltip.undo": "Annuler",
      "tooltip.redo": "Refaire",
  }
}
```

If the locale is already supported, this will override the existing
strings. If the locale is not supported, it will be added.

```ts
set static strings(value): void
```

• **value**: `Record`\<`string`, `Record`\<`string`, `string`\>\>

`Readonly`\<`Record`\<`string`, `Record`\<`string`, `string`\>\>\>

</MemberCard>

#### Other

<a id="constructors" name="constructors"></a>

<MemberCard>

##### new MathfieldElement()

##### new MathfieldElement()

```ts
new MathfieldElement(options?): MathfieldElement
```

To create programmatically a new mathfield use:

```javascript
let mfe = new MathfieldElement();

// Set initial value and options
mfe.value = "\\frac{\\sin(x)}{\\cos(x)}";

// Options can be set either as an attribute (for simple options)...
mfe.setAttribute("letter-shape-style", "french");

// ... or using properties
mfe.letterShapeStyle = "french";

// Attach the element to the DOM
document.body.appendChild(mfe);
```

• **options?**: `Partial`\<[`MathfieldOptions`](#mathfieldoptions)\>

[`MathfieldElement`](#mathfieldelement)

</MemberCard>

<a id="createhtml" name="createhtml"></a>

<MemberCard>

##### MathfieldElement.createHTML()

```ts
static createHTML: (html) => any;
```

Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).

This optional function will be called before a string of HTML is
injected in the DOM, allowing that string to be sanitized
according to a policy defined by the host.

• **html**: `string`

`any`

</MemberCard>

<a id="readaloudhook" name="readaloudhook"></a>

<MemberCard>

##### MathfieldElement.readAloudHook()

```ts
static readAloudHook: (element, text) => void = defaultReadAloudHook;
```

• **element**: `HTMLElement`

• **text**: `string`

`void`

</MemberCard>

<a id="restorefocuswhendocumentfocused" name="restorefocuswhendocumentfocused"></a>

<MemberCard>

##### MathfieldElement.restoreFocusWhenDocumentFocused

```ts
static restoreFocusWhenDocumentFocused: boolean = true;
```

When switching from a tab to one that contains a mathfield that was
previously focused, restore the focus to the mathfield.

This is behavior consistent with `<textarea>`, however it can be
disabled if it is not desired.

</MemberCard>

<a id="speakhook" name="speakhook"></a>

<MemberCard>

##### MathfieldElement.speakHook()

```ts
static speakHook: (text) => void = defaultSpeakHook;
```

• **text**: `string`

`void`

</MemberCard>

<a id="version" name="version"></a>

<MemberCard>

##### MathfieldElement.version

```ts
static version: string = '0.98.6';
```

</MemberCard>

<a id="backgroundcolormap" name="backgroundcolormap"></a>

<MemberCard>

##### MathfieldElement.backgroundColorMap

```ts
get backgroundColorMap(): (name) => string
```

{@inheritDoc LayoutOptions.backgroundColorMap}

```ts
set backgroundColorMap(value): void
```

• **value**

`Function`

• **name**: `string`

`string`

</MemberCard>

<a id="colormap" name="colormap"></a>

<MemberCard>

##### MathfieldElement.colorMap

```ts
get colorMap(): (name) => string
```

{@inheritDoc LayoutOptions.colorMap}

```ts
set colorMap(value): void
```

• **value**

`Function`

• **name**: `string`

`string`

</MemberCard>

<a id="disabled" name="disabled"></a>

<MemberCard>

##### MathfieldElement.disabled

```ts
get disabled(): boolean
```

```ts
set disabled(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="environmentpopoverpolicy" name="environmentpopoverpolicy"></a>

<MemberCard>

##### MathfieldElement.environmentPopoverPolicy

```ts
get environmentPopoverPolicy(): "auto" | "off" | "on"
```

{@inheritDoc EditingOptions.environmentPopoverPolicy}

```ts
set environmentPopoverPolicy(value): void
```

• **value**: `"auto"` \| `"off"` \| `"on"`

`"auto"` \| `"off"` \| `"on"`

</MemberCard>

<a id="form" name="form"></a>

<MemberCard>

##### MathfieldElement.form

```ts
get form(): HTMLFormElement
```

`HTMLFormElement`

</MemberCard>

<a id="inlineshortcuts" name="inlineshortcuts"></a>

<MemberCard>

##### MathfieldElement.inlineShortcuts

```ts
get inlineShortcuts(): Readonly<InlineShortcutDefinitions>
```

* {@inheritDoc EditingOptions.inlineShortcuts}

```ts
set inlineShortcuts(value): void
```

• **value**: [`InlineShortcutDefinitions`](#inlineshortcutdefinitions)

`Readonly`\<[`InlineShortcutDefinitions`](#inlineshortcutdefinitions)\>

</MemberCard>

<a id="isselectioneditable" name="isselectioneditable"></a>

<MemberCard>

##### MathfieldElement.isSelectionEditable

```ts
get isSelectionEditable(): boolean
```

`boolean`

</MemberCard>

<a id="keybindings" name="keybindings"></a>

<MemberCard>

##### MathfieldElement.keybindings

```ts
get keybindings(): readonly Keybinding[]
```

* {@inheritDoc EditingOptions.keybindings}

```ts
set keybindings(value): void
```

• **value**: readonly [`Keybinding`](#keybinding)[]

readonly [`Keybinding`](#keybinding)[]

</MemberCard>

<a id="lettershapestyle" name="lettershapestyle"></a>

<MemberCard>

##### MathfieldElement.letterShapeStyle

```ts
get letterShapeStyle(): 
  | "auto"
  | "tex"
  | "iso"
  | "french"
  | "upright"
```

{@inheritDoc LayoutOptions.letterShapeStyle}

```ts
set letterShapeStyle(value): void
```

• **value**: 
  \| `"auto"`
  \| `"tex"`
  \| `"iso"`
  \| `"french"`
  \| `"upright"`

  \| `"auto"`
  \| `"tex"`
  \| `"iso"`
  \| `"french"`
  \| `"upright"`

</MemberCard>

<a id="mathmodespace" name="mathmodespace"></a>

<MemberCard>

##### MathfieldElement.mathModeSpace

```ts
get mathModeSpace(): string
```

{@inheritDoc EditingOptions.mathModeSpace}

```ts
set mathModeSpace(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="mathvirtualkeyboardpolicy" name="mathvirtualkeyboardpolicy"></a>

<MemberCard>

##### MathfieldElement.mathVirtualKeyboardPolicy

```ts
get mathVirtualKeyboardPolicy(): VirtualKeyboardPolicy
```

* {@inheritDoc EditingOptions.mathVirtualKeyboardPolicy}

```ts
set mathVirtualKeyboardPolicy(value): void
```

• **value**: [`VirtualKeyboardPolicy`](#virtualkeyboardpolicy)

[`VirtualKeyboardPolicy`](#virtualkeyboardpolicy)

</MemberCard>

<a id="maxmatrixcols" name="maxmatrixcols"></a>

<MemberCard>

##### MathfieldElement.maxMatrixCols

```ts
get maxMatrixCols(): number
```

{@inheritDoc LayoutOptions.maxMatrixCols}

```ts
set maxMatrixCols(value): void
```

• **value**: `number`

`number`

</MemberCard>

<a id="minfontscale" name="minfontscale"></a>

<MemberCard>

##### MathfieldElement.minFontScale

```ts
get minFontScale(): number
```

{@inheritDoc LayoutOptions.minFontScale}

```ts
set minFontScale(value): void
```

• **value**: `number`

`number`

</MemberCard>

<a id="mode" name="mode"></a>

<MemberCard>

##### MathfieldElement.mode

```ts
get mode(): ParseMode
```

```ts
set mode(value): void
```

• **value**: `ParseMode`

`ParseMode`

</MemberCard>

<a id="name" name="name"></a>

<MemberCard>

##### MathfieldElement.name

```ts
get name(): string
```

`string`

</MemberCard>

<a id="placeholdersymbol" name="placeholdersymbol"></a>

<MemberCard>

##### MathfieldElement.placeholderSymbol

```ts
get placeholderSymbol(): string
```

{@inheritDoc EditingOptions.placeholderSymbol}

```ts
set placeholderSymbol(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="popoverpolicy" name="popoverpolicy"></a>

<MemberCard>

##### MathfieldElement.popoverPolicy

```ts
get popoverPolicy(): "auto" | "off"
```

{@inheritDoc EditingOptions.popoverPolicy}

```ts
set popoverPolicy(value): void
```

• **value**: `"auto"` \| `"off"`

`"auto"` \| `"off"`

</MemberCard>

<a id="readonly" name="readonly"></a>

<MemberCard>

##### MathfieldElement.readOnly

```ts
get readOnly(): boolean
```

```ts
set readOnly(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="readonly-1" name="readonly-1"></a>

<MemberCard>

##### MathfieldElement.readonly

```ts
get readonly(): boolean
```

```ts
set readonly(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="removeextraneousparentheses" name="removeextraneousparentheses"></a>

<MemberCard>

##### MathfieldElement.removeExtraneousParentheses

```ts
get removeExtraneousParentheses(): boolean
```

{@inheritDoc EditingOptions.removeExtraneousParentheses}

```ts
set removeExtraneousParentheses(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="scriptdepth" name="scriptdepth"></a>

<MemberCard>

##### MathfieldElement.scriptDepth

```ts
get scriptDepth(): number | [number, number]
```

{@inheritDoc EditingOptions.scriptDepth}

```ts
set scriptDepth(value): void
```

• **value**: `number` \| [`number`, `number`]

`number` \| [`number`, `number`]

</MemberCard>

<a id="smartfence" name="smartfence"></a>

<MemberCard>

##### MathfieldElement.smartFence

```ts
get smartFence(): boolean
```

{@inheritDoc EditingOptions.smartFence}

```ts
set smartFence(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="smartmode" name="smartmode"></a>

<MemberCard>

##### MathfieldElement.smartMode

```ts
get smartMode(): boolean
```

{@inheritDoc EditingOptions.smartMode}

```ts
set smartMode(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="smartsuperscript" name="smartsuperscript"></a>

<MemberCard>

##### MathfieldElement.smartSuperscript

```ts
get smartSuperscript(): boolean
```

{@inheritDoc EditingOptions.smartSuperscript}

```ts
set smartSuperscript(value): void
```

• **value**: `boolean`

`boolean`

</MemberCard>

<a id="type" name="type"></a>

<MemberCard>

##### MathfieldElement.type

```ts
get type(): string
```

`string`

</MemberCard>

<a id="computeengine" name="computeengine"></a>

<MemberCard>

##### MathfieldElement.computeEngine

```ts
get static computeEngine(): ComputeEngine
```

A custom compute engine instance. If none is provided, a default one is
used. If `null` is specified, no compute engine is used.

```ts
set static computeEngine(value): void
```

• **value**: `ComputeEngine`

`ComputeEngine`

</MemberCard>

<a id="fontsdirectory" name="fontsdirectory"></a>

<MemberCard>

##### MathfieldElement.fontsDirectory

```ts
get static fontsDirectory(): string
```

A URL fragment pointing to the directory containing the fonts
necessary to render a formula.

These fonts are available in the `/dist/fonts` directory of the SDK.

Customize this value to reflect where you have copied these fonts,
or to use the CDN version.

The default value is `"./fonts"`. Use `null` to prevent
any fonts from being loaded.

Changing this setting after the mathfield has been created will have
no effect.

```javascript
{
     // Use the CDN version
     fontsDirectory: ''
}
```

```javascript
{
     // Use a directory called "fonts", located next to the
     // `mathlive.js` (or `mathlive.mjs`) file.
     fontsDirectory: './fonts'
}
```

```javascript
{
     // Use a directory located at the root of your website
     fontsDirectory: 'https://example.com/fonts'
}
```

```ts
set static fontsDirectory(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="formassociated" name="formassociated"></a>

<MemberCard>

##### MathfieldElement.formAssociated

```ts
get static formAssociated(): boolean
```

`boolean`

</MemberCard>

<a id="isfunction" name="isfunction"></a>

<MemberCard>

##### MathfieldElement.isFunction

```ts
get static isFunction(): (command) => boolean
```

```ts
set static isFunction(value): void
```

• **value**

`Function`

• **command**: `string`

`boolean`

</MemberCard>

<a id="plonksound" name="plonksound"></a>

<MemberCard>

##### MathfieldElement.plonkSound

```ts
get static plonkSound(): string
```

Sound played to provide feedback when a command has no effect, for example
when pressing the spacebar at the root level.

The property is either:
- a string, the name of an audio file in the `soundsDirectory` directory
- null to turn off the sound

```ts
set static plonkSound(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="speechengine" name="speechengine"></a>

<MemberCard>

##### MathfieldElement.speechEngine

```ts
get static speechEngine(): "amazon" | "local"
```

Indicates which speech engine to use for speech output.

Use `local` to use the OS-specific TTS engine.

Use `amazon` for Amazon Text-to-Speech cloud API. You must include the
AWS API library and configure it with your API key before use.

**See**
mathfield/guides/speech/ | Guide: Speech

```ts
set static speechEngine(value): void
```

• **value**: `"amazon"` \| `"local"`

`"amazon"` \| `"local"`

</MemberCard>

<a id="speechenginerate" name="speechenginerate"></a>

<MemberCard>

##### MathfieldElement.speechEngineRate

```ts
get static speechEngineRate(): string
```

Sets the speed of the selected voice.

One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
percentage.

Range is `20%` to `200%` For example `200%` to indicate a speaking rate
twice the default rate.

```ts
set static speechEngineRate(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="speechenginevoice" name="speechenginevoice"></a>

<MemberCard>

##### MathfieldElement.speechEngineVoice

```ts
get static speechEngineVoice(): string
```

Indicates the voice to use with the speech engine.

This is dependent on the speech engine. For Amazon Polly, see here:
https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

```ts
set static speechEngineVoice(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="texttospeechmarkup" name="texttospeechmarkup"></a>

<MemberCard>

##### MathfieldElement.textToSpeechMarkup

```ts
get static textToSpeechMarkup(): "" | "ssml" | "ssml_step" | "mac"
```

The markup syntax to use for the output of conversion to spoken text.

Possible values are `ssml` for the SSML markup or `mac` for the macOS
markup, i.e. `&#91;&#91;ltr&#93;&#93;`.

```ts
set static textToSpeechMarkup(value): void
```

• **value**: `""` \| `"ssml"` \| `"ssml_step"` \| `"mac"`

`""` \| `"ssml"` \| `"ssml_step"` \| `"mac"`

</MemberCard>

<a id="texttospeechrules" name="texttospeechrules"></a>

<MemberCard>

##### MathfieldElement.textToSpeechRules

```ts
get static textToSpeechRules(): "sre" | "mathlive"
```

Specify which set of text to speech rules to use.

A value of `mathlive` indicates that the simple rules built into MathLive
should be used.

A value of `sre` indicates that the Speech Rule Engine from Volker Sorge
should be used.

**(Caution)** SRE is not included or loaded by MathLive. For this option to
work SRE should be loaded separately.

**See**
mathfield/guides/speech/ | Guide: Speech

```ts
set static textToSpeechRules(value): void
```

• **value**: `"sre"` \| `"mathlive"`

`"sre"` \| `"mathlive"`

</MemberCard>

<a id="texttospeechrulesoptions" name="texttospeechrulesoptions"></a>

<MemberCard>

##### MathfieldElement.textToSpeechRulesOptions

```ts
get static textToSpeechRulesOptions(): Readonly<Record<string, string>>
```

A set of key/value pairs that can be used to configure the speech rule
engine.

Which options are available depends on the speech rule engine in use.
There are no options available with MathLive's built-in engine. The
options for the SRE engine are documented
[here](https://github.com/zorkow/speech-rule-engine)

```ts
set static textToSpeechRulesOptions(value): void
```

• **value**: `Record`\<`string`, `string`\>

`Readonly`\<`Record`\<`string`, `string`\>\>

</MemberCard>

<a id="executecommand" name="executecommand"></a>

<MemberCard>

##### MathfieldElement.executeCommand()

###### executeCommand(selector)

```ts
executeCommand(selector): boolean
```

• **selector**: [`Selector`](#selector)

`boolean`

###### Inherit Doc

###### executeCommand(selector, args)

```ts
executeCommand(selector, ...args): boolean
```

• **selector**: [`Selector`](#selector)

• ...**args**: `unknown`[]

`boolean`

###### executeCommand(selector)

```ts
executeCommand(selector): boolean
```

• **selector**: [[`Selector`](#selector), `...unknown[]`]

`boolean`

</MemberCard>

<a id="getelementinfo" name="getelementinfo"></a>

<MemberCard>

##### MathfieldElement.getElementInfo()

```ts
getElementInfo(offset): ElementInfo
```

• **offset**: `number`

[`ElementInfo`](#elementinfo)

</MemberCard>

<a id="getpromptstate" name="getpromptstate"></a>

<MemberCard>

##### MathfieldElement.getPromptState()

```ts
getPromptState(id): ["correct" | "incorrect", boolean]
```

• **id**: `string`

[`"correct"` \| `"incorrect"`, `boolean`]

</MemberCard>

<a id="showmenu" name="showmenu"></a>

<MemberCard>

##### MathfieldElement.showMenu()

```ts
showMenu(_): boolean
```

• **\_**

• **\_.location**

• **\_.location.x**: `number`

• **\_.location.y**: `number`

• **\_.modifiers**: `KeyboardModifiers`

`boolean`

</MemberCard>

<a id="loadsound" name="loadsound"></a>

<MemberCard>

##### MathfieldElement.loadSound()

```ts
static loadSound(sound): Promise<void>
```

• **sound**: 
  \| `"keypress"`
  \| `"plonk"`
  \| `"delete"`
  \| `"spacebar"`
  \| `"return"`

`Promise`\<`void`\>

</MemberCard>

<a id="openurl" name="openurl"></a>

<MemberCard>

##### MathfieldElement.openUrl()

```ts
static openUrl(href): void
```

• **href**: `string`

`void`

</MemberCard>

<a id="playsound" name="playsound"></a>

<MemberCard>

##### MathfieldElement.playSound()

```ts
static playSound(name): Promise<void>
```

• **name**: 
  \| `"keypress"`
  \| `"plonk"`
  \| `"delete"`
  \| `"spacebar"`
  \| `"return"`

`Promise`\<`void`\>

</MemberCard>

#### Prompts

<a id="getpromptrange" name="getpromptrange"></a>

<MemberCard>

##### MathfieldElement.getPromptRange()

```ts
getPromptRange(id): Range
```

Return the selection range for the specified prompt.

This can be used for example to select the content of the prompt.

```js
mf.selection = mf.getPromptRange('my-prompt-id');
```

• **id**: `string`

[`Range`](#range-1)

</MemberCard>

<a id="getpromptvalue" name="getpromptvalue"></a>

<MemberCard>

##### MathfieldElement.getPromptValue()

```ts
getPromptValue(placeholderId, format?): string
```

• **placeholderId**: `string`

• **format?**: [`OutputFormat`](#outputformat)

`string`

###### Inherit Doc

</MemberCard>

<a id="getprompts" name="getprompts"></a>

<MemberCard>

##### MathfieldElement.getPrompts()

```ts
getPrompts(filter?): string[]
```

Return the id of the prompts matching the filter.

• **filter?**

• **filter.correctness?**: `"undefined"` \| `"correct"` \| `"incorrect"`

• **filter.id?**: `string`

• **filter.locked?**: `boolean`

`string`[]

</MemberCard>

<a id="setpromptstate" name="setpromptstate"></a>

<MemberCard>

##### MathfieldElement.setPromptState()

```ts
setPromptState(
   id, 
   state, 
   locked?): void
```

• **id**: `string`

• **state**: `"undefined"` \| `"correct"` \| `"incorrect"`

• **locked?**: `boolean`

`void`

</MemberCard>

<a id="setpromptvalue" name="setpromptvalue"></a>

<MemberCard>

##### MathfieldElement.setPromptValue()

```ts
setPromptValue(
   id, 
   content, 
   insertOptions): void
```

• **id**: `string`

• **content**: `string`

• **insertOptions**: `Omit`\<[`InsertOptions`](#insertoptions), `"insertionMode"`\>

`void`

</MemberCard>

#### Selection

<a id="caretpoint" name="caretpoint"></a>

<MemberCard>

##### MathfieldElement.caretPoint

```ts
get caretPoint(): Readonly<object>
```

###### Inherit Doc

```ts
set caretPoint(point): void
```

• **point**

• **point.x**: `number`

• **point.y**: `number`

`Readonly`\<`object`\>

<MemberCard>

###### caretPoint.x

```ts
x: number;
```

</MemberCard>

<MemberCard>

###### caretPoint.y

```ts
y: number;
```

</MemberCard>

</MemberCard>

<a id="lastoffset" name="lastoffset"></a>

<MemberCard>

##### MathfieldElement.lastOffset

```ts
get lastOffset(): number
```

The last valid offset.

`number`

</MemberCard>

<a id="position" name="position"></a>

<MemberCard>

##### MathfieldElement.position

```ts
get position(): number
```

The position of the caret/insertion point, from 0 to `lastOffset`.

```ts
set position(offset): void
```

• **offset**: `number`

`number`

</MemberCard>

<a id="selection" name="selection"></a>

<MemberCard>

##### MathfieldElement.selection

```ts
get selection(): Readonly<Selection>
```

An array of ranges representing the selection.

It is guaranteed there will be at least one element. If a discontinuous
selection is present, the result will include more than one element.

```ts
set selection(sel): void
```

• **sel**: `number` \| [`Selection`](#selection-1)

`Readonly`\<[`Selection`](#selection-1)\>

</MemberCard>

<a id="selectioniscollapsed" name="selectioniscollapsed"></a>

<MemberCard>

##### MathfieldElement.selectionIsCollapsed

```ts
get selectionIsCollapsed(): boolean
```

`boolean`

</MemberCard>

<a id="getoffsetfrompoint" name="getoffsetfrompoint"></a>

<MemberCard>

##### MathfieldElement.getOffsetFromPoint()

```ts
getOffsetFromPoint(
   x, 
   y, 
   options?): number
```

The offset closest to the location `(x, y)` in viewport coordinate.

**`bias`**:  if `0`, the vertical midline is considered to the left or
right sibling. If `-1`, the left sibling is favored, if `+1`, the right
sibling is favored.

• **x**: `number`

• **y**: `number`

• **options?**

• **options.bias?**: `-1` \| `0` \| `1`

`number`

</MemberCard>

<a id="select" name="select"></a>

<MemberCard>

##### MathfieldElement.select()

```ts
select(): void
```

Select the content of the mathfield.

`void`

</MemberCard>

<a id="setcaretpoint" name="setcaretpoint"></a>

<MemberCard>

##### MathfieldElement.setCaretPoint()

```ts
setCaretPoint(x, y): boolean
```

`x` and `y` are in viewport coordinates.

Return true if the location of the point is a valid caret location.

See also [[`caretPoint`]]

• **x**: `number`

• **y**: `number`

`boolean`

</MemberCard>

#### Undo

<a id="canredo" name="canredo"></a>

<MemberCard>

##### MathfieldElement.canRedo()

```ts
canRedo(): boolean
```

Return whether there are redoable items

`boolean`

</MemberCard>

<a id="canundo" name="canundo"></a>

<MemberCard>

##### MathfieldElement.canUndo()

```ts
canUndo(): boolean
```

Return whether there are undoable items

`boolean`

</MemberCard>

<a id="resetundo" name="resetundo"></a>

<MemberCard>

##### MathfieldElement.resetUndo()

```ts
resetUndo(): void
```

Reset the undo stack

`void`

</MemberCard>

#### Virtual Keyboard

<a id="keypressvibration" name="keypressvibration"></a>

<MemberCard>

##### MathfieldElement.keypressVibration

```ts
static keypressVibration: boolean = true;
```

When a key on the virtual keyboard is pressed, produce a short haptic
feedback, if the device supports it.

</MemberCard>

<a id="virtualkeyboardtargetorigin" name="virtualkeyboardtargetorigin"></a>

<MemberCard>

##### MathfieldElement.virtualKeyboardTargetOrigin

```ts
get virtualKeyboardTargetOrigin(): string
```

```ts
set virtualKeyboardTargetOrigin(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="keypresssound" name="keypresssound"></a>

<MemberCard>

##### MathfieldElement.keypressSound

```ts
get static keypressSound(): Readonly<object>
```

When a key on the virtual keyboard is pressed, produce a short audio
feedback.

If the property is set to a `string`, the same sound is played in all
cases. Otherwise, a distinct sound is played:

-   `delete` a sound played when the delete key is pressed
-   `return` ... when the return/tab key is pressed
-   `spacebar` ... when the spacebar is pressed
-   `default` ... when any other key is pressed. This property is required,
    the others are optional. If they are missing, this sound is played as
    well.

The value of the properties should be either a string, the name of an
audio file in the `soundsDirectory` directory or `null` to suppress the sound.

```ts
set static keypressSound(value): void
```

• **value**: `string` \| `object`

`Readonly`\<`object`\>

<MemberCard>

###### keypressSound.default

```ts
default: string;
```

</MemberCard>

<MemberCard>

###### keypressSound.delete

```ts
delete: string;
```

</MemberCard>

<MemberCard>

###### keypressSound.return

```ts
return: string;
```

</MemberCard>

<MemberCard>

###### keypressSound.spacebar

```ts
spacebar: string;
```

</MemberCard>

</MemberCard>

<a id="soundsdirectory" name="soundsdirectory"></a>

<MemberCard>

##### MathfieldElement.soundsDirectory

```ts
get static soundsDirectory(): string
```

A URL fragment pointing to the directory containing the optional
sounds used to provide feedback while typing.

Some default sounds are available in the `/dist/sounds` directory of the SDK.

Use `null` to prevent any sound from being loaded.

```ts
set static soundsDirectory(value): void
```

• **value**: `string`

`string`

</MemberCard>

<a id="mathfieldelementattributes" name="mathfieldelementattributes"></a>

### MathfieldElementAttributes

These attributes of the `<math-field>` element correspond to the
[MathfieldOptions] properties.

#### Indexable

 \[`key`: `string`\]: `unknown`

<a id="default-mode" name="default-mode"></a>

<MemberCard>

##### MathfieldElementAttributes.default-mode

```ts
default-mode: string;
```

</MemberCard>

<a id="inline-shortcut-timeout" name="inline-shortcut-timeout"></a>

<MemberCard>

##### MathfieldElementAttributes.inline-shortcut-timeout

```ts
inline-shortcut-timeout: string;
```

Maximum time, in milliseconds, between consecutive characters for them to be
considered part of the same shortcut sequence.

A value of 0 is the same as infinity: any consecutive character will be
candidate for an inline shortcut, regardless of the interval between this
character and the previous one.

A value of 750 will indicate that the maximum interval between two
characters to be considered part of the same inline shortcut sequence is
3/4 of a second.

This is useful to enter "+-" as a sequence of two characters, while also
supporting the "±" shortcut with the same sequence.

The first result can be entered by pausing slightly between the first and
second character if this option is set to a value of 250 or so.

Note that some operations, such as clicking to change the selection, or
losing the focus on the mathfield, will automatically timeout the
shortcuts.

</MemberCard>

<a id="letter-shape-style" name="letter-shape-style"></a>

<MemberCard>

##### MathfieldElementAttributes.letter-shape-style

```ts
letter-shape-style: string;
```

</MemberCard>

<a id="math-mode-space" name="math-mode-space"></a>

<MemberCard>

##### MathfieldElementAttributes.math-mode-space

```ts
math-mode-space: string;
```

The LaTeX string to insert when the spacebar is pressed (on the physical or
virtual keyboard). Empty by default. Use `\;` for a thick space, `\:` for
a medium space, `\,` for a thin space.

</MemberCard>

<a id="math-virtual-keyboard-policy" name="math-virtual-keyboard-policy"></a>

<MemberCard>

##### MathfieldElementAttributes.math-virtual-keyboard-policy

```ts
math-virtual-keyboard-policy: VirtualKeyboardPolicy;
```

- `"auto"`: the virtual keyboard is triggered when a
mathfield is focused on a touch capable device.
- `"manual"`: the virtual keyboard is not triggered automatically
- `"sandboxed"`: the virtual keyboard is displayed in the current browsing
context (iframe) if it has a defined container or is the top-level browsing
context.

</MemberCard>

<a id="max-matrix-cols" name="max-matrix-cols"></a>

<MemberCard>

##### MathfieldElementAttributes.max-matrix-cols

```ts
max-matrix-cols: number;
```

</MemberCard>

<a id="min-font-scale" name="min-font-scale"></a>

<MemberCard>

##### MathfieldElementAttributes.min-font-scale

```ts
min-font-scale: number;
```

</MemberCard>

<a id="placeholder" name="placeholder"></a>

<MemberCard>

##### MathfieldElementAttributes.placeholder

```ts
placeholder: string;
```

When the mathfield is empty, display this placeholder LaTeX string
 instead

</MemberCard>

<a id="popover-policy" name="popover-policy"></a>

<MemberCard>

##### MathfieldElementAttributes.popover-policy

```ts
popover-policy: string;
```

</MemberCard>

<a id="read-only" name="read-only"></a>

<MemberCard>

##### MathfieldElementAttributes.read-only

```ts
read-only: boolean;
```

When true, the user cannot edit the mathfield.

</MemberCard>

<a id="remove-extraneous-parentheses" name="remove-extraneous-parentheses"></a>

<MemberCard>

##### MathfieldElementAttributes.remove-extraneous-parentheses

```ts
remove-extraneous-parentheses: boolean;
```

</MemberCard>

<a id="script-depth" name="script-depth"></a>

<MemberCard>

##### MathfieldElementAttributes.script-depth

```ts
script-depth: string;
```

</MemberCard>

<a id="smart-fence" name="smart-fence"></a>

<MemberCard>

##### MathfieldElementAttributes.smart-fence

```ts
smart-fence: string;
```

When `on` and an open fence is entered via `typedText()` it will
generate a contextually appropriate markup, for example using
`\left...\right` if applicable.

When `off`, the literal value of the character will be inserted instead.

</MemberCard>

<a id="smart-mode" name="smart-mode"></a>

<MemberCard>

##### MathfieldElementAttributes.smart-mode

```ts
smart-mode: string;
```

When `on`, during text input the field will switch automatically between
'math' and 'text' mode depending on what is typed and the context of the
formula. If necessary, what was previously typed will be 'fixed' to
account for the new info.

For example, when typing "if x >0":

| Type  | Interpretation |
|---:|:---|
| "i" | math mode, imaginary unit |
| "if" | text mode, english word "if" |
| "if x" | all in text mode, maybe the next word is xylophone? |
| "if x >" | "if" stays in text mode, but now "x >" is in math mode |
| "if x > 0" | "if" in text mode, "x > 0" in math mode |

Smart Mode is `off` by default.

Manually switching mode (by typing `alt/option+=`) will temporarily turn
off smart mode.

**Examples**

-   slope = rise/run
-   If x > 0, then f(x) = sin(x)
-   x^2 + sin (x) when x > 0
-   When x&lt;0, x^{2n+1}&lt;0
-   Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5
-   Divide by x-3 and then add x^2-1 to both sides
-   Given g(x) = 4x – 3, when does g(x)=0?
-   Let D be the set {(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x}
-   \int\_{the unit square} f(x,y) dx dy
-   For all n in NN

</MemberCard>

<a id="smart-superscript" name="smart-superscript"></a>

<MemberCard>

##### MathfieldElementAttributes.smart-superscript

```ts
smart-superscript: string;
```

When `on`, when a digit is entered in an empty superscript, the cursor
leaps automatically out of the superscript. This makes entry of common
polynomials easier and faster. If entering other characters (for example
"n+1") the navigation out of the superscript must be done manually (by
using the cursor keys or the spacebar to leap to the next insertion
point).

When `off`, the navigation out of the superscript must always be done
manually.

</MemberCard>

<a id="virtual-keyboard-target-origin" name="virtual-keyboard-target-origin"></a>

<MemberCard>

##### MathfieldElementAttributes.virtual-keyboard-target-origin

```ts
virtual-keyboard-target-origin: string;
```

Specify the `targetOrigin` parameter for
[postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
to send control messages from child to parent frame to remote control
of mathfield component.

**Default**: `window.origin`

</MemberCard>

<a id="moveoutevent" name="moveoutevent"></a>

### MoveOutEvent

```ts
type MoveOutEvent: object;
```

## Event re-targeting
 Some events bubble up through the DOM tree, so that they are detectable by
  any element on the page.

Bubbling events fired from within shadow DOM are re-targeted so that, to any
 listener external to your component, they appear to come from your
 component itself.

 ## Custom Event Bubbling

 By default, a bubbling custom event fired inside shadow DOM will stop
 bubbling when it reaches the shadow root.

 To make a custom event pass through shadow DOM boundaries, you must set
 both the `composed` and `bubbles` flags to true.

The `move-out` event signals that the user pressed an **arrow** key or
**tab** key but there was no navigation possible inside the mathfield.

This event provides an opportunity to handle this situation, for example
by focusing an element adjacent to the mathfield.

If the event is canceled (i.e. `evt.preventDefault()` is called inside your
event handler), the default behavior is to play a "plonk" sound.

#### Type declaration

<a id="direction" name="direction"></a>

<MemberCard>

##### MoveOutEvent.direction

```ts
direction: "forward" | "backward" | "upward" | "downward";
```

</MemberCard>
