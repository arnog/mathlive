
<a name="readmemd"></a>

## Mathfield

<a id="mathfieldelement" name="mathfieldelement"></a>

### MathfieldElement

The `MathfieldElement` class is a DOM element that provides a math input
field.

It is a subclass of the standard
[`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
class and as such inherits all of its properties and methods, such
as `style`, `tabIndex`, `addEventListener()`, `getAttribute()`, etc...

The `MathfieldElement` class provides additional properties and methods to
control the display and behavior of `<math-field>` elements.

**To instantiate a `MathfieldElement`** use the `<math-field>` tag in HTML.
You can also instantiate a `MathfieldElement` programmatically using
`new MathfieldElement()`.

```javascript
// 1. Create a new MathfieldElement
const mf = new MathfieldElement();

// 2. Attach it to the DOM
document.body.appendChild(mf);

// 3. Modifying options after construction
mf.addEventListener("mount"), () => {
 mf.smartFence = true;
});
```

Read more about customizing the appearance and behavior of the mathfield in
the [Customizing the Mathfield](mathfield/guides/customizing/) guide.

#### MathfieldElement CSS Variables

**To customize the appearance of the mathfield**, declare the following CSS
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

Read more about the [CSS variables](#css-variables) available for customization.

You can customize the appearance and zindex of the virtual keyboard panel
with some CSS variables associated with a selector that applies to the
virtual keyboard panel container.

Read more about [customizing the virtual keyboard appearance](#custom-appearance)

#### MathfieldElement CSS Parts

In addition to the CSS variables, the mathfield exposes [CSS
parts that can be used to style the mathfield](https://cortexjs.io/mathfield/guides/customizing/#mathfield-parts)

For example, to hide the menu button:

```css
math-field::part(menu-toggle) {
 display: none;
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
 mf.value = "\\sin x";
 mf.letterShapeStyle = "text";
```

The values of attributes and properties are reflected, which means you can
change one or the other, for example:

```javascript
mf.setAttribute('letter-shape-style',  'french');
console.log(mf.letterShapeStyle);
// Result: "french"

mf.letterShapeStyle ='tex;
console.log(mf.getAttribute('letter-shape-style');
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

See the corresponding property for more details about these options.

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

Listen to these events by using `mf.addEventListener()`. For events with
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
| `move-out` | The user has pressed an **arrow** key or the **tab** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br/> `detail: \{direction: 'forward' | 'backward' | 'upward' | 'downward'\}` **cancellable**|
| `keypress` | The user pressed a physical keyboard key |
| `mount` | The element has been attached to the DOM |
| `unmount` | The element is about to be removed from the DOM |

</div>

#### Extends

- `HTMLElement`

<MemberCard>

#### new MathfieldElement()

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

###### options?

`Partial`\<`MathfieldOptions`\>

</MemberCard>

#### Accessing and changing the content

<a id="mathfieldelement_errors" name="mathfieldelement_errors"></a>

<MemberCard>

##### MathfieldElement.errors

Return an array of LaTeX syntax errors, if any.

</MemberCard>

<a id="mathfieldelement_expression" name="mathfieldelement_expression"></a>

<MemberCard>

##### MathfieldElement.expression

```ts
get expression(): any
set expression(mathJson: any): void
```

If the Compute Engine library is available, return a boxed MathJSON expression representing the value of the mathfield.

To load the Compute Engine library, use:
```js
import 'https://unpkg.com/@cortex-js/compute-engine?module';
```

</MemberCard>

<a id="mathfieldelement_value" name="mathfieldelement_value"></a>

<MemberCard>

##### MathfieldElement.value

```ts
get value(): string
set value(value: string): void
```

The content of the mathfield as a LaTeX expression.
```js
document.querySelector('mf').value = '\\frac{1}{\\pi}'
```

</MemberCard>

<a id="mathfieldelement_getvalue" name="mathfieldelement_getvalue"></a>

<MemberCard>

##### MathfieldElement.getValue()

###### getValue(format)

```ts
getValue(format?): string
```

Return a textual representation of the content of the mathfield.

###### format?

[`OutputFormat`](#outputformat)

The format of the result. If using `math-json`
the Compute Engine library must be loaded, for example with:

```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```

**Default:** `"latex"`

###### getValue(start, end, format)

```ts
getValue(start, end, format?): string
```

Return the value of the mathfield from `start` to `end`

###### start

`number`

###### end

`number`

###### format?

[`OutputFormat`](#outputformat)

###### getValue(range, format)

```ts
getValue(range, format?): string
```

Return the value of the mathfield in `range`

###### range

[`Range`](#range-1)

###### format?

[`OutputFormat`](#outputformat)

</MemberCard>

<a id="mathfieldelement_insert" name="mathfieldelement_insert"></a>

<MemberCard>

##### MathfieldElement.insert()

```ts
insert(s, options?): boolean
```

Insert a block of text at the current insertion point.

This method can be called explicitly or invoked as a selector with
`executeCommand("insert")`.

After the insertion, the selection will be set according to the
`options.selectionMode`.

###### s

`string`

###### options?

[`InsertOptions`](#insertoptions)

</MemberCard>

<a id="mathfieldelement_setvalue" name="mathfieldelement_setvalue"></a>

<MemberCard>

##### MathfieldElement.setValue()

```ts
setValue(value?, options?): void
```

Set the content of the mathfield to the text interpreted as a
LaTeX expression.

###### value?

`string`

###### options?

[`InsertOptions`](#insertoptions)

</MemberCard>

#### Selection

<a id="mathfieldelement_lastoffset" name="mathfieldelement_lastoffset"></a>

<MemberCard>

##### MathfieldElement.lastOffset

The last valid offset.

</MemberCard>

<a id="mathfieldelement_position" name="mathfieldelement_position"></a>

<MemberCard>

##### MathfieldElement.position

```ts
get position(): number
set position(offset: number): void
```

The position of the caret/insertion point, from 0 to `lastOffset`.

</MemberCard>

<a id="mathfieldelement_selection" name="mathfieldelement_selection"></a>

<MemberCard>

##### MathfieldElement.selection

```ts
get selection(): Readonly<Selection>
set selection(sel: number | Selection): void
```

An array of ranges representing the selection.

It is guaranteed there will be at least one element. If a discontinuous
selection is present, the result will include more than one element.

</MemberCard>

<a id="mathfieldelement_selectioniscollapsed" name="mathfieldelement_selectioniscollapsed"></a>

<MemberCard>

##### MathfieldElement.selectionIsCollapsed

</MemberCard>

<a id="mathfieldelement_getoffsetfrompoint" name="mathfieldelement_getoffsetfrompoint"></a>

<MemberCard>

##### MathfieldElement.getOffsetFromPoint()

```ts
getOffsetFromPoint(x, y, options?): number
```

The offset closest to the location `(x, y)` in viewport coordinate.

**`bias`**:  if `0`, the vertical midline is considered to the left or
right sibling. If `-1`, the left sibling is favored, if `+1`, the right
sibling is favored.

###### x

`number`

###### y

`number`

###### options?

###### bias?

`-1` \| `0` \| `1`

</MemberCard>

<a id="mathfieldelement_select" name="mathfieldelement_select"></a>

<MemberCard>

##### MathfieldElement.select()

```ts
select(): void
```

Select the content of the mathfield.

</MemberCard>

#### Customization

<a id="mathfieldelement_restorefocuswhendocumentfocused" name="mathfieldelement_restorefocuswhendocumentfocused"></a>

<MemberCard>

##### MathfieldElement.restoreFocusWhenDocumentFocused

```ts
static restoreFocusWhenDocumentFocused: boolean = true;
```

When switching from a tab to one that contains a mathfield that was
previously focused, restore the focus to the mathfield.

This is behavior consistent with `<textarea>`, however it can be
disabled if it is not desired.

**Default**: `true`

</MemberCard>

<a id="mathfieldelement_backgroundcolormap" name="mathfieldelement_backgroundcolormap"></a>

<MemberCard>

##### MathfieldElement.backgroundColorMap

```ts
get backgroundColorMap(): (name) => string
set backgroundColorMap(value: (name) => string): void
```

</MemberCard>

<a id="mathfieldelement_colormap" name="mathfieldelement_colormap"></a>

<MemberCard>

##### MathfieldElement.colorMap

```ts
get colorMap(): (name) => string
set colorMap(value: (name) => string): void
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

</MemberCard>

<a id="mathfieldelement_defaultmode" name="mathfieldelement_defaultmode"></a>

<MemberCard>

##### MathfieldElement.defaultMode

```ts
get defaultMode(): "text" | "math" | "inline-math"
set defaultMode(value: "text" | "math" | "inline-math"): void
```

The mode of the element when it is empty:
- `"math"`: equivalent to `\displaystyle` (display math mode)
- `"inline-math"`: equivalent to `\inlinestyle` (inline math mode)
- `"text"`: text mode

</MemberCard>

<a id="mathfieldelement_environmentpopoverpolicy" name="mathfieldelement_environmentpopoverpolicy"></a>

<MemberCard>

##### MathfieldElement.environmentPopoverPolicy

```ts
get environmentPopoverPolicy(): "auto" | "off" | "on"
set environmentPopoverPolicy(value: "auto" | "off" | "on"): void
```

If `"auto"` a popover with commands to edit an environment (matrix)
is displayed when the virtual keyboard is displayed.

**Default**: `"auto"`

</MemberCard>

<a id="mathfieldelement_lettershapestyle" name="mathfieldelement_lettershapestyle"></a>

<MemberCard>

##### MathfieldElement.letterShapeStyle

```ts
get letterShapeStyle(): "auto" | "tex" | "iso" | "french" | "upright"
set letterShapeStyle(value: "auto" | "tex" | "iso" | "french" | "upright"): void
```

Control the letter shape style:

| `letterShapeStyle` | xyz | ABC | αβɣ | ΓΔΘ |
| ------------------ | --- | --- | --- | --- |
| `iso`              | it  | it  | it  | it  |
| `tex`              | it  | it  | it  | up  |
| `french`           | it  | up  | up  | up  |
| `upright`          | up  | up  | up  | up  |

(it) = italic (up) = upright

The default letter shape style is `auto`, which indicates that `french`
should be used if the locale is "french", and `tex` otherwise.

**Historical Note**

Where do the "french" rules come from? The
TeX standard font, Computer Modern, is based on Monotype 155M, itself
based on the Porson greek font which was one of the most widely used
Greek fonts in english-speaking countries. This font had upright
capitals, but slanted lowercase. In France, the traditional font for
greek was Didot, which has both upright capitals and lowercase.

As for roman uppercase, they are recommended by "Lexique des règles
typographiques en usage à l’Imprimerie Nationale". It should be noted
that this convention is not universally followed.

</MemberCard>

<a id="mathfieldelement_mathmodespace" name="mathfieldelement_mathmodespace"></a>

<MemberCard>

##### MathfieldElement.mathModeSpace

```ts
get mathModeSpace(): string
set mathModeSpace(value: string): void
```

The LaTeX string to insert when the spacebar is pressed (on the physical or
virtual keyboard).

Use `"\;"` for a thick space, `"\:"` for a medium space, `"\,"` for a
thin space.

Do not use `" "` (a regular space), as whitespace is skipped by LaTeX
so this will do nothing.

**Default**: `""` (empty string)

</MemberCard>

<a id="mathfieldelement_maxmatrixcols" name="mathfieldelement_maxmatrixcols"></a>

<MemberCard>

##### MathfieldElement.maxMatrixCols

```ts
get maxMatrixCols(): number
set maxMatrixCols(value: number): void
```

Sets the maximum number of columns for the matrix environment. The default is
10 columns to match the behavior of the amsmath matrix environment.
**Default**: `10`

</MemberCard>

<a id="mathfieldelement_minfontscale" name="mathfieldelement_minfontscale"></a>

<MemberCard>

##### MathfieldElement.minFontScale

```ts
get minFontScale(): number
set minFontScale(value: number): void
```

Set the minimum relative font size for nested superscripts and fractions. The value
should be a number between `0` and `1`. The size is in releative `em` units relative to the
font size of the `math-field` element. Specifying a value of `0` allows the `math-field`
to use its default sizing logic.

**Default**: `0`

</MemberCard>

<a id="mathfieldelement_placeholder" name="mathfieldelement_placeholder"></a>

<MemberCard>

##### MathfieldElement.placeholder

```ts
get placeholder(): string
set placeholder(value: string): void
```

A LaTeX string displayed inside the mathfield when there is no content.

</MemberCard>

<a id="mathfieldelement_placeholdersymbol" name="mathfieldelement_placeholdersymbol"></a>

<MemberCard>

##### MathfieldElement.placeholderSymbol

```ts
get placeholderSymbol(): string
set placeholderSymbol(value: string): void
```

The symbol used to represent a placeholder in an expression.

**Default**: `▢` `U+25A2 WHITE SQUARE WITH ROUNDED CORNERS`

</MemberCard>

<a id="mathfieldelement_popoverpolicy" name="mathfieldelement_popoverpolicy"></a>

<MemberCard>

##### MathfieldElement.popoverPolicy

```ts
get popoverPolicy(): "auto" | "off"
set popoverPolicy(value: "auto" | "off"): void
```

If `"auto"` a popover with suggestions may be displayed when a LaTeX
command is input.

**Default**: `"auto"`

</MemberCard>

<a id="mathfieldelement_removeextraneousparentheses" name="mathfieldelement_removeextraneousparentheses"></a>

<MemberCard>

##### MathfieldElement.removeExtraneousParentheses

```ts
get removeExtraneousParentheses(): boolean
set removeExtraneousParentheses(value: boolean): void
```

If `true`, extra parentheses around a numerator or denominator are
removed automatically.

**Default**: `true`

</MemberCard>

<a id="mathfieldelement_scriptdepth" name="mathfieldelement_scriptdepth"></a>

<MemberCard>

##### MathfieldElement.scriptDepth

```ts
get scriptDepth(): number | [number, number]
set scriptDepth(value: number | [number, number]): void
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

<a id="mathfieldelement_smartfence" name="mathfieldelement_smartfence"></a>

<MemberCard>

##### MathfieldElement.smartFence

```ts
get smartFence(): boolean
set smartFence(value: boolean): void
```

When `true` and an open fence is entered via `typedText()` it will
generate a contextually appropriate markup, for example using
`\left...\right` if applicable.

When `false`, the literal value of the character will be inserted instead.

</MemberCard>

<a id="mathfieldelement_smartmode" name="mathfieldelement_smartmode"></a>

<MemberCard>

##### MathfieldElement.smartMode

```ts
get smartMode(): boolean
set smartMode(value: boolean): void
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

<a id="mathfieldelement_smartsuperscript" name="mathfieldelement_smartsuperscript"></a>

<MemberCard>

##### MathfieldElement.smartSuperscript

```ts
get smartSuperscript(): boolean
set smartSuperscript(value: boolean): void
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

#### Styles

<a id="mathfieldelement_oninsertstyle" name="mathfieldelement_oninsertstyle"></a>

<MemberCard>

##### MathfieldElement.onInsertStyle

```ts
get onInsertStyle(): InsertStyleHook
set onInsertStyle(value: InsertStyleHook): void
```

</MemberCard>

<a id="mathfieldelement_applystyle" name="mathfieldelement_applystyle"></a>

<MemberCard>

##### MathfieldElement.applyStyle()

```ts
applyStyle(style, options?): void
```

Update the style (color, bold, italic, etc...) of the selection or sets
the style to be applied to future input.

If there is no selection and no range is specified, the style will
apply to the next character typed.

If a range is specified, the style is applied to the range, otherwise,
if there is a selection, the style is applied to the selection.

If the operation is `"toggle"` and the range already has this style,
remove it. If the range
has the style partially applied (i.e. only some sections), remove it from
those sections, and apply it to the entire range.

If the operation is `"set"`, the style is applied to the range,
whether it already has the style or not.

The default operation is `"set"`.

###### style

`Readonly`\<[`Style`](#style-1)\>

###### options?

[`Range`](#range-1) | \{
`operation`: `"set"` \| `"toggle"`;
`range`: [`Range`](#range-1);
\}

</MemberCard>

<a id="mathfieldelement_querystyle" name="mathfieldelement_querystyle"></a>

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

###### style

`Readonly`\<[`Style`](#style-1)\>

</MemberCard>

#### Macros

<a id="mathfieldelement_macros" name="mathfieldelement_macros"></a>

<MemberCard>

##### MathfieldElement.macros

```ts
get macros(): Readonly<MacroDictionary>
set macros(value: MacroDictionary): void
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

#### Registers

<a id="mathfieldelement_registers" name="mathfieldelement_registers"></a>

<MemberCard>

##### MathfieldElement.registers

```ts
get registers(): Registers
set registers(value: Registers): void
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

</MemberCard>

#### Speech

<a id="mathfieldelement_readaloudhook" name="mathfieldelement_readaloudhook"></a>

<MemberCard>

##### MathfieldElement.readAloudHook()

```ts
static readAloudHook: (element, text) => void = defaultReadAloudHook;
```

</MemberCard>

<a id="mathfieldelement_speakhook" name="mathfieldelement_speakhook"></a>

<MemberCard>

##### MathfieldElement.speakHook()

```ts
static speakHook: (text) => void = defaultSpeakHook;
```

</MemberCard>

<a id="mathfieldelement_speechengine" name="mathfieldelement_speechengine"></a>

<MemberCard>

##### MathfieldElement.speechEngine

```ts
get static speechEngine(): "amazon" | "local"
set static speechEngine(value: "amazon" | "local"): void
```

Indicates which speech engine to use for speech output.

Use `local` to use the OS-specific TTS engine.

Use `amazon` for Amazon Text-to-Speech cloud API. You must include the
AWS API library and configure it with your API key before use.

**See**
mathfield/guides/speech/ \| Guide: Speech

</MemberCard>

<a id="mathfieldelement_speechenginerate" name="mathfieldelement_speechenginerate"></a>

<MemberCard>

##### MathfieldElement.speechEngineRate

```ts
get static speechEngineRate(): string
set static speechEngineRate(value: string): void
```

Sets the speed of the selected voice.

One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
percentage.

Range is `20%` to `200%` For example `200%` to indicate a speaking rate
twice the default rate.

</MemberCard>

<a id="mathfieldelement_speechenginevoice" name="mathfieldelement_speechenginevoice"></a>

<MemberCard>

##### MathfieldElement.speechEngineVoice

```ts
get static speechEngineVoice(): string
set static speechEngineVoice(value: string): void
```

Indicates the voice to use with the speech engine.

This is dependent on the speech engine. For Amazon Polly, see here:
https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

</MemberCard>

<a id="mathfieldelement_texttospeechmarkup" name="mathfieldelement_texttospeechmarkup"></a>

<MemberCard>

##### MathfieldElement.textToSpeechMarkup

```ts
get static textToSpeechMarkup(): "" | "ssml" | "ssml_step" | "mac"
set static textToSpeechMarkup(value: "" | "ssml" | "ssml_step" | "mac"): void
```

The markup syntax to use for the output of conversion to spoken text.

Possible values are `ssml` for the SSML markup or `mac` for the macOS
markup, i.e. `&#91;&#91;ltr&#93;&#93;`.

</MemberCard>

<a id="mathfieldelement_texttospeechrules" name="mathfieldelement_texttospeechrules"></a>

<MemberCard>

##### MathfieldElement.textToSpeechRules

```ts
get static textToSpeechRules(): "sre" | "mathlive"
set static textToSpeechRules(value: "sre" | "mathlive"): void
```

Specify which set of text to speech rules to use.

A value of `mathlive` indicates that the simple rules built into MathLive
should be used.

A value of `sre` indicates that the Speech Rule Engine from Volker Sorge
should be used.

**(Caution)** SRE is not included or loaded by MathLive. For this option to
work SRE should be loaded separately.

**See**
mathfield/guides/speech/ \| Guide: Speech

</MemberCard>

<a id="mathfieldelement_texttospeechrulesoptions" name="mathfieldelement_texttospeechrulesoptions"></a>

<MemberCard>

##### MathfieldElement.textToSpeechRulesOptions

```ts
get static textToSpeechRulesOptions(): Readonly<Record<string, string>>
set static textToSpeechRulesOptions(value: Record<string, string>): void
```

A set of key/value pairs that can be used to configure the speech rule
engine.

Which options are available depends on the speech rule engine in use.
There are no options available with MathLive's built-in engine. The
options for the SRE engine are documented
[here](https://github.com/zorkow/speech-rule-engine)

</MemberCard>

#### Focus

<a id="mathfieldelement_blur" name="mathfieldelement_blur"></a>

<MemberCard>

##### MathfieldElement.blur()

```ts
blur(): void
```

Remove the focus from the mathfield (will no longer respond to keyboard
input).

</MemberCard>

<a id="mathfieldelement_focus" name="mathfieldelement_focus"></a>

<MemberCard>

##### MathfieldElement.focus()

```ts
focus(): void
```

Sets the focus to the mathfield (will respond to keyboard input).

</MemberCard>

<a id="mathfieldelement_hasfocus" name="mathfieldelement_hasfocus"></a>

<MemberCard>

##### MathfieldElement.hasFocus()

```ts
hasFocus(): boolean
```

Return true if the mathfield is currently focused (responds to keyboard
input).

</MemberCard>

#### Prompts

<a id="mathfieldelement_getpromptrange" name="mathfieldelement_getpromptrange"></a>

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

###### id

`string`

</MemberCard>

<a id="mathfieldelement_getprompts" name="mathfieldelement_getprompts"></a>

<MemberCard>

##### MathfieldElement.getPrompts()

```ts
getPrompts(filter?): string[]
```

Return the id of the prompts matching the filter.

###### filter?

###### correctness?

`"undefined"` \| `"correct"` \| `"incorrect"`

###### id?

`string`

###### locked?

`boolean`

</MemberCard>

<a id="mathfieldelement_getpromptstate" name="mathfieldelement_getpromptstate"></a>

<MemberCard>

##### MathfieldElement.getPromptState()

```ts
getPromptState(id): ["correct" | "incorrect", boolean]
```

###### id

`string`

</MemberCard>

<a id="mathfieldelement_getpromptvalue" name="mathfieldelement_getpromptvalue"></a>

<MemberCard>

##### MathfieldElement.getPromptValue()

```ts
getPromptValue(placeholderId, format?): string
```

Return the content of the `\placeholder{}` command with the `placeholderId`

###### placeholderId

`string`

###### format?

[`OutputFormat`](#outputformat)

</MemberCard>

<a id="mathfieldelement_setpromptstate" name="mathfieldelement_setpromptstate"></a>

<MemberCard>

##### MathfieldElement.setPromptState()

```ts
setPromptState(id, state, locked?): void
```

###### id

`string`

###### state

`"undefined"` | `"correct"` | `"incorrect"`

###### locked?

`boolean`

</MemberCard>

<a id="mathfieldelement_setpromptvalue" name="mathfieldelement_setpromptvalue"></a>

<MemberCard>

##### MathfieldElement.setPromptValue()

```ts
setPromptValue(id, content, insertOptions): void
```

###### id

`string`

###### content

`string`

###### insertOptions

`Omit`\<[`InsertOptions`](#insertoptions), `"insertionMode"`\>

</MemberCard>

#### Undo

<a id="mathfieldelement_canredo" name="mathfieldelement_canredo"></a>

<MemberCard>

##### MathfieldElement.canRedo()

```ts
canRedo(): boolean
```

Return whether there are redoable items

</MemberCard>

<a id="mathfieldelement_canundo" name="mathfieldelement_canundo"></a>

<MemberCard>

##### MathfieldElement.canUndo()

```ts
canUndo(): boolean
```

Return whether there are undoable items

</MemberCard>

<a id="mathfieldelement_resetundo" name="mathfieldelement_resetundo"></a>

<MemberCard>

##### MathfieldElement.resetUndo()

```ts
resetUndo(): void
```

Reset the undo stack

</MemberCard>

#### Keyboard Shortcuts

<a id="mathfieldelement_inlineshortcuts" name="mathfieldelement_inlineshortcuts"></a>

<MemberCard>

##### MathfieldElement.inlineShortcuts

```ts
get inlineShortcuts(): Readonly<InlineShortcutDefinitions>
set inlineShortcuts(value: InlineShortcutDefinitions): void
```

The keys of this object literal indicate the sequence of characters
that will trigger an inline shortcut.

</MemberCard>

<a id="mathfieldelement_inlineshortcuttimeout" name="mathfieldelement_inlineshortcuttimeout"></a>

<MemberCard>

##### MathfieldElement.inlineShortcutTimeout

```ts
get inlineShortcutTimeout(): number
set inlineShortcutTimeout(value: number): void
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

<a id="mathfieldelement_keybindings" name="mathfieldelement_keybindings"></a>

<MemberCard>

##### MathfieldElement.keybindings

```ts
get keybindings(): readonly Keybinding[]
set keybindings(value: readonly Keybinding[]): void
```

</MemberCard>

#### Menu

<a id="mathfieldelement_menuitems" name="mathfieldelement_menuitems"></a>

<MemberCard>

##### MathfieldElement.menuItems

```ts
get menuItems(): readonly MenuItem[]
set menuItems(menuItems: readonly MenuItem[]): void
```

</MemberCard>

<a id="mathfieldelement_showmenu" name="mathfieldelement_showmenu"></a>

<MemberCard>

##### MathfieldElement.showMenu()

```ts
showMenu(_): boolean
```

###### \_

###### location

\{
  `x`: `number`;
  `y`: `number`;
 \}

###### location.x

`number`

###### location.y

`number`

###### modifiers

`KeyboardModifiers`

</MemberCard>

#### Virtual Keyboard

<a id="mathfieldelement_keypressvibration" name="mathfieldelement_keypressvibration"></a>

<MemberCard>

##### MathfieldElement.keypressVibration

```ts
static keypressVibration: boolean = true;
```

When a key on the virtual keyboard is pressed, produce a short haptic
feedback, if the device supports it.

</MemberCard>

<a id="mathfieldelement_mathvirtualkeyboardpolicy" name="mathfieldelement_mathvirtualkeyboardpolicy"></a>

<MemberCard>

##### MathfieldElement.mathVirtualKeyboardPolicy

```ts
get mathVirtualKeyboardPolicy(): VirtualKeyboardPolicy
set mathVirtualKeyboardPolicy(value: VirtualKeyboardPolicy): void
```

</MemberCard>

<a id="mathfieldelement_virtualkeyboardtargetorigin" name="mathfieldelement_virtualkeyboardtargetorigin"></a>

<MemberCard>

##### MathfieldElement.virtualKeyboardTargetOrigin

```ts
get virtualKeyboardTargetOrigin(): string
set virtualKeyboardTargetOrigin(value: string): void
```

</MemberCard>

<a id="mathfieldelement_keypresssound" name="mathfieldelement_keypresssound"></a>

<MemberCard>

##### MathfieldElement.keypressSound

```ts
get static keypressSound(): Readonly<{
  default: string;
  delete: string;
  return: string;
  spacebar: string;
}>
set static keypressSound(value: 
  | string
  | {
  default: string;
  delete: string;
  return: string;
  spacebar: string;
 }): void
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
audio file in the `soundsDirectory` directory or `null` to suppress
the sound.

If the `soundsDirectory` is `null`, no sound will be played.

</MemberCard>

<a id="mathfieldelement_soundsdirectory" name="mathfieldelement_soundsdirectory"></a>

<MemberCard>

##### MathfieldElement.soundsDirectory

```ts
get static soundsDirectory(): string
set static soundsDirectory(value: string): void
```

A URL fragment pointing to the directory containing the optional
sounds used to provide feedback while typing.

Some default sounds are available in the `/dist/sounds` directory of the SDK.

Use `null` to prevent any sound from being loaded.

</MemberCard>

#### Localization

<a id="mathfieldelement_decimalseparator" name="mathfieldelement_decimalseparator"></a>

<MemberCard>

##### MathfieldElement.decimalSeparator

```ts
get static decimalSeparator(): "," | "."
set static decimalSeparator(value: "," | "."): void
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

</MemberCard>

<a id="mathfieldelement_fractionnavigationorder" name="mathfieldelement_fractionnavigationorder"></a>

<MemberCard>

##### MathfieldElement.fractionNavigationOrder

```ts
get static fractionNavigationOrder(): "denominator-numerator" | "numerator-denominator"
set static fractionNavigationOrder(s: "denominator-numerator" | "numerator-denominator"): void
```

When using the keyboard to navigate a fraction, the order in which the
numerator and navigator are traversed:
- `"numerator-denominator"`: first the elements in the numerator, then
  the elements in the denominator.
- `"denominator-numerator"`: first the elements in the denominator, then
  the elements in the numerator. In some East-Asian cultures, fractions
  are read and written denominator first ("fēnzhī"). With this option
  the keyboard navigation follows this convention.

**Default**: `"numerator-denominator"`

</MemberCard>

<a id="mathfieldelement_locale" name="mathfieldelement_locale"></a>

<MemberCard>

##### MathfieldElement.locale

```ts
get static locale(): string
set static locale(value: string): void
```

The locale (language + region) to use for string localization.

If none is provided, the locale of the browser is used.

</MemberCard>

<a id="mathfieldelement_strings" name="mathfieldelement_strings"></a>

<MemberCard>

##### MathfieldElement.strings

```ts
get static strings(): Readonly<Record<string, Record<string, string>>>
set static strings(value: Record<string, Record<string, string>>): void
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

</MemberCard>

#### Other

<a id="mathfieldelement_createhtml" name="mathfieldelement_createhtml"></a>

<MemberCard>

##### MathfieldElement.createHTML()

```ts
static createHTML: (html) => any;
```

Support for [Trusted Type](https://www.w3.org/TR/trusted-types/).

This optional function will be called before a string of HTML is
injected in the DOM, allowing that string to be sanitized
according to a policy defined by the host.

Consider using this option if you are displaying untrusted content. Read more about [Security Considerations](mathfield/guides/security/)

</MemberCard>

<a id="mathfieldelement_version" name="mathfieldelement_version"></a>

<MemberCard>

##### MathfieldElement.version

```ts
static version: string = '{{SDK_VERSION}}';
```

</MemberCard>

<a id="mathfieldelement_disabled" name="mathfieldelement_disabled"></a>

<MemberCard>

##### MathfieldElement.disabled

```ts
get disabled(): boolean
set disabled(value: boolean): void
```

</MemberCard>

<a id="mathfieldelement_mode" name="mathfieldelement_mode"></a>

<MemberCard>

##### MathfieldElement.mode

```ts
get mode(): ParseMode
set mode(value: ParseMode): void
```

</MemberCard>

<a id="mathfieldelement_readonly" name="mathfieldelement_readonly"></a>

<MemberCard>

##### MathfieldElement.readonly

```ts
get readonly(): boolean
set readonly(value: boolean): void
```

</MemberCard>

<a id="mathfieldelement_readonly-1" name="mathfieldelement_readonly-1"></a>

<MemberCard>

##### MathfieldElement.readOnly

```ts
get readOnly(): boolean
set readOnly(value: boolean): void
```

</MemberCard>

<a id="mathfieldelement_computeengine" name="mathfieldelement_computeengine"></a>

<MemberCard>

##### MathfieldElement.computeEngine

```ts
get static computeEngine(): ComputeEngine
set static computeEngine(value: ComputeEngine): void
```

A custom compute engine instance. If none is provided, a default one is
used. If `null` is specified, no compute engine is used.

</MemberCard>

<a id="mathfieldelement_fontsdirectory" name="mathfieldelement_fontsdirectory"></a>

<MemberCard>

##### MathfieldElement.fontsDirectory

```ts
get static fontsDirectory(): string
set static fontsDirectory(value: string): void
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

</MemberCard>

<a id="mathfieldelement_isfunction" name="mathfieldelement_isfunction"></a>

<MemberCard>

##### MathfieldElement.isFunction

```ts
get static isFunction(): (command) => boolean
set static isFunction(value: (command) => boolean): void
```

</MemberCard>

<a id="mathfieldelement_plonksound" name="mathfieldelement_plonksound"></a>

<MemberCard>

##### MathfieldElement.plonkSound

```ts
get static plonkSound(): string
set static plonkSound(value: string): void
```

Sound played to provide feedback when a command has no effect, for example
when pressing the spacebar at the root level.

The property is either:
- a string, the name of an audio file in the `soundsDirectory` directory
- `null` to turn off the sound

If the `soundsDirectory` is `null`, no sound will be played.

</MemberCard>

<a id="mathfieldelement_getelementinfo" name="mathfieldelement_getelementinfo"></a>

<MemberCard>

##### MathfieldElement.getElementInfo()

```ts
getElementInfo(offset): ElementInfo
```

###### offset

`number`

</MemberCard>

<a id="mathfieldelement_loadsound" name="mathfieldelement_loadsound"></a>

<MemberCard>

##### MathfieldElement.loadSound()

```ts
static loadSound(sound): Promise<void>
```

###### sound

`"keypress"` | `"plonk"` | `"delete"` | `"spacebar"` | `"return"`

</MemberCard>

<a id="mathfieldelement_openurl" name="mathfieldelement_openurl"></a>

<MemberCard>

##### MathfieldElement.openUrl()

```ts
static openUrl(href): void
```

###### href

`string`

</MemberCard>

<a id="mathfieldelement_playsound" name="mathfieldelement_playsound"></a>

<MemberCard>

##### MathfieldElement.playSound()

```ts
static playSound(name): Promise<void>
```

###### name

`"keypress"` | `"plonk"` | `"delete"` | `"spacebar"` | `"return"`

</MemberCard>

#### Commands

<a id="mathfieldelement_executecommand" name="mathfieldelement_executecommand"></a>

<MemberCard>

##### MathfieldElement.executeCommand()

###### executeCommand(selector)

```ts
executeCommand(selector): boolean
```

Execute a [`command`](#commands) defined by a selector.
```javascript
mfe.executeCommand('add-column-after');
mfe.executeCommand(['switch-mode', 'math']);
```

###### selector

[`Selector`](#selector)

A selector, or an array whose first element
is a selector, and whose subsequent elements are arguments to the selector.

Selectors can be passed either in camelCase or kebab-case.

```javascript
// Both calls do the same thing
mfe.executeCommand('selectAll');
mfe.executeCommand('select-all');
```

###### executeCommand(selector, args)

```ts
executeCommand(selector, ...args): boolean
```

Execute a [`command`](#commands) defined by a selector.
```javascript
mfe.executeCommand('add-column-after');
mfe.executeCommand(['switch-mode', 'math']);
```

###### selector

[`Selector`](#selector)

A selector, or an array whose first element
is a selector, and whose subsequent elements are arguments to the selector.

Selectors can be passed either in camelCase or kebab-case.

```javascript
// Both calls do the same thing
mfe.executeCommand('selectAll');
mfe.executeCommand('select-all');
```

###### args

...`unknown`[]

###### executeCommand(selector)

```ts
executeCommand(selector): boolean
```

Execute a [`command`](#commands) defined by a selector.
```javascript
mfe.executeCommand('add-column-after');
mfe.executeCommand(['switch-mode', 'math']);
```

###### selector

\[[`Selector`](#selector), `...unknown[]`\]

A selector, or an array whose first element
is a selector, and whose subsequent elements are arguments to the selector.

Selectors can be passed either in camelCase or kebab-case.

```javascript
// Both calls do the same thing
mfe.executeCommand('selectAll');
mfe.executeCommand('select-all');
```

</MemberCard>

#### Hooks

<a id="mathfieldelement_onexport" name="mathfieldelement_onexport"></a>

<MemberCard>

##### MathfieldElement.onExport

```ts
get onExport(): (from, latex, range) => string
set onExport(value: (from, latex, range) => string): void
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

</MemberCard>

<a id="mathfieldelement_oninlineshortcut" name="mathfieldelement_oninlineshortcut"></a>

<MemberCard>

##### MathfieldElement.onInlineShortcut

```ts
get onInlineShortcut(): (sender, symbol) => string
set onInlineShortcut(value: (sender, symbol) => string): void
```

A hook invoked when a string of characters that could be
interpreted as shortcut has been typed.

If not a special shortcut, return the empty string `""`.

Use this handler to detect multi character symbols, and return them wrapped appropriately,
for example `\mathrm{${symbol}}`.

</MemberCard>

<a id="mathfieldelement_onscrollintoview" name="mathfieldelement_onscrollintoview"></a>

<MemberCard>

##### MathfieldElement.onScrollIntoView

```ts
get onScrollIntoView(): (sender) => void
set onScrollIntoView(value: (sender) => void): void
```

A hook invoked when scrolling the mathfield into view is necessary.

Use when scrolling the page would not solve the problem, e.g.
when the mathfield is in another div that has scrollable content.

</MemberCard>

<a id="mathfieldelementattributes" name="mathfieldelementattributes"></a>

### MathfieldElementAttributes

These attributes of the `<math-field>` element correspond to matching properties.

#### Indexable

```ts
[key: string]: unknown
```

<a id="mathfieldelementattributes_default-mode" name="mathfieldelementattributes_default-mode"></a>

<MemberCard>

##### MathfieldElementAttributes.default-mode

```ts
default-mode: string;
```

</MemberCard>

<a id="mathfieldelementattributes_inline-shortcut-timeout" name="mathfieldelementattributes_inline-shortcut-timeout"></a>

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

<a id="mathfieldelementattributes_letter-shape-style" name="mathfieldelementattributes_letter-shape-style"></a>

<MemberCard>

##### MathfieldElementAttributes.letter-shape-style

```ts
letter-shape-style: string;
```

</MemberCard>

<a id="mathfieldelementattributes_math-mode-space" name="mathfieldelementattributes_math-mode-space"></a>

<MemberCard>

##### MathfieldElementAttributes.math-mode-space

```ts
math-mode-space: string;
```

The LaTeX string to insert when the spacebar is pressed (on the physical or
virtual keyboard). Empty by default. Use `\;` for a thick space, `\:` for
a medium space, `\,` for a thin space.

</MemberCard>

<a id="mathfieldelementattributes_math-virtual-keyboard-policy" name="mathfieldelementattributes_math-virtual-keyboard-policy"></a>

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

<a id="mathfieldelementattributes_max-matrix-cols" name="mathfieldelementattributes_max-matrix-cols"></a>

<MemberCard>

##### MathfieldElementAttributes.max-matrix-cols

```ts
max-matrix-cols: number;
```

</MemberCard>

<a id="mathfieldelementattributes_min-font-scale" name="mathfieldelementattributes_min-font-scale"></a>

<MemberCard>

##### MathfieldElementAttributes.min-font-scale

```ts
min-font-scale: number;
```

</MemberCard>

<a id="mathfieldelementattributes_placeholder-1" name="mathfieldelementattributes_placeholder-1"></a>

<MemberCard>

##### MathfieldElementAttributes.placeholder

```ts
placeholder: string;
```

When the mathfield is empty, display this placeholder LaTeX string
 instead

</MemberCard>

<a id="mathfieldelementattributes_popover-policy" name="mathfieldelementattributes_popover-policy"></a>

<MemberCard>

##### MathfieldElementAttributes.popover-policy

```ts
popover-policy: string;
```

</MemberCard>

<a id="mathfieldelementattributes_read-only" name="mathfieldelementattributes_read-only"></a>

<MemberCard>

##### MathfieldElementAttributes.read-only

```ts
read-only: boolean;
```

When true, the user cannot edit the mathfield.

</MemberCard>

<a id="mathfieldelementattributes_remove-extraneous-parentheses" name="mathfieldelementattributes_remove-extraneous-parentheses"></a>

<MemberCard>

##### MathfieldElementAttributes.remove-extraneous-parentheses

```ts
remove-extraneous-parentheses: boolean;
```

</MemberCard>

<a id="mathfieldelementattributes_script-depth" name="mathfieldelementattributes_script-depth"></a>

<MemberCard>

##### MathfieldElementAttributes.script-depth

```ts
script-depth: string;
```

</MemberCard>

<a id="mathfieldelementattributes_smart-fence" name="mathfieldelementattributes_smart-fence"></a>

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

<a id="mathfieldelementattributes_smart-mode" name="mathfieldelementattributes_smart-mode"></a>

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
-   If x &gt; 0, then f(x) = sin(x)
-   x^2 + sin (x) when x > 0
-   When x&lt;0, x^&#007b;2n+1&#007d;&lt;0
-   Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5
-   Divide by x-3 and then add x^2-1 to both sides
-   Given g(x) = 4x – 3, when does g(x)=0?
-   Let D be the set &#007b;(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x&#007d;
-   \int\_&#007b;the unit square&#007d; f(x,y) dx dy
-   For all n in NN

</MemberCard>

<a id="mathfieldelementattributes_smart-superscript" name="mathfieldelementattributes_smart-superscript"></a>

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

<a id="mathfieldelementattributes_virtual-keyboard-target-origin" name="mathfieldelementattributes_virtual-keyboard-target-origin"></a>

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

<a id="elementinfo" name="elementinfo"></a>

<MemberCard>

### ElementInfo

```ts
type ElementInfo = {
  bounds: DOMRect;
  data: Record<string, string | undefined>;
  depth: number;
  id: string;
  latex: string;
  mode: ParseMode;
  style: Style;
};
```

Some additional information about an element of the formula
returned by `mf.getElementInfo()`.

<a id="elementinfo_bounds" name="elementinfo_bounds"></a>

#### ElementInfo.bounds?

```ts
optional bounds: DOMRect;
```

The bounding box of the element

<a id="elementinfo_data" name="elementinfo_data"></a>

#### ElementInfo.data?

```ts
optional data: Record<string, string | undefined>;
```

HTML attributes associated with element or its ancestores, set with
`\htmlData`

<a id="elementinfo_depth" name="elementinfo_depth"></a>

#### ElementInfo.depth?

```ts
optional depth: number;
```

The depth in the expression tree. 0 for top-level elements

<a id="elementinfo_id-2" name="elementinfo_id-2"></a>

#### ElementInfo.id?

```ts
optional id: string;
```

id associated with this element or its ancestor, set with `\htmlId` or
`\cssId`

<a id="elementinfo_latex-1" name="elementinfo_latex-1"></a>

#### ElementInfo.latex?

```ts
optional latex: string;
```

A LaTeX representation of the element

<a id="elementinfo_mode-1" name="elementinfo_mode-1"></a>

#### ElementInfo.mode?

```ts
optional mode: ParseMode;
```

The mode (math, text or LaTeX)

<a id="elementinfo_style-3" name="elementinfo_style-3"></a>

#### ElementInfo.style?

```ts
optional style: Style;
```

The style (color, weight, variant, etc...) of this element.

</MemberCard>

<a id="insertoptions" name="insertoptions"></a>

<MemberCard>

### InsertOptions

```ts
type InsertOptions = {
  feedback: boolean;
  focus: boolean;
  format: OutputFormat | "auto";
  insertionMode: "replaceSelection" | "replaceAll" | "insertBefore" | "insertAfter";
  mode: ParseMode | "auto";
  scrollIntoView: boolean;
  selectionMode: "placeholder" | "after" | "before" | "item";
  silenceNotifications: boolean;
  style: Style;
};
```

<a id="insertoptions_feedback" name="insertoptions_feedback"></a>

#### InsertOptions.feedback?

```ts
optional feedback: boolean;
```

If `true`, provide audio and haptic feedback

<a id="insertoptions_focus-1" name="insertoptions_focus-1"></a>

#### InsertOptions.focus?

```ts
optional focus: boolean;
```

If `true`, the mathfield will be focused after
the insertion

<a id="insertoptions_format" name="insertoptions_format"></a>

#### InsertOptions.format?

```ts
optional format: OutputFormat | "auto";
```

The format of the input string:

| | |
|:------------|:------------|
|`"auto"`| The string is LaTeX fragment or command) (default)|
|`"latex"`| The string is a LaTeX fragment|

<a id="insertoptions_mode-2" name="insertoptions_mode-2"></a>

#### InsertOptions.mode?

```ts
optional mode: ParseMode | "auto";
```

If `"auto"` or omitted, the current mode is used

<a id="insertoptions_scrollintoview-1" name="insertoptions_scrollintoview-1"></a>

#### InsertOptions.scrollIntoView?

```ts
optional scrollIntoView: boolean;
```

If `true`, scroll the mathfield into view after insertion such that the
insertion point is visible

<a id="insertoptions_selectionmode" name="insertoptions_selectionmode"></a>

#### InsertOptions.selectionMode?

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

<a id="moveoutevent" name="moveoutevent"></a>

<MemberCard>

### MoveOutEvent

```ts
type MoveOutEvent = {
  direction: "forward" | "backward" | "upward" | "downward";
};
```

**Event re-targeting**

 Some events bubble up through the DOM tree, so that they are detectable by
  any element on the page.

Bubbling events fired from within shadow DOM are re-targeted so that, to any
 listener external to your component, they appear to come from your
 component itself.

 **Custom Event Bubbling**

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

</MemberCard>

<a id="outputformat" name="outputformat"></a>

<MemberCard>

### OutputFormat

```ts
type OutputFormat = 
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
| `"plain-text"`        | A plain text rendering of the content. |
| `"spoken"`            | Spoken text rendering, using the default format defined in config, which could be either text or SSML markup. |
| `"spoken-text"`       | A plain spoken text rendering of the content. |
| `"spoken-ssml"`       | A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS. |
| `"spoken-ssml-with-highlighting"`| Like `"spoken-ssml"` but with additional annotations necessary for synchronized highlighting (read aloud). |

  To use the`"math-json"` format the Compute Engine library must be loaded. Use for example:

```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```
  *

</MemberCard>

## Selection

<a id="offset" name="offset"></a>

<MemberCard>

### Offset

```ts
type Offset = number;
```

Position of the caret/insertion point from the beginning of the formula. The first position is 0. The last valid offset is `mf.lastOffset`.

</MemberCard>

<a id="range-1" name="range-1"></a>

<MemberCard>

### Range

```ts
type Range = [Offset, Offset];
```

A pair of offsets (boundary points) that can be used to denote a fragment
of an expression.

A range is said to be **collapsed** when start and end are equal.

When specifying a range, a negative offset can be used to indicate an
offset relative to the last valid offset, i.e. -1 is the last valid offset, -2
is one offset before that, etc...

A normalized range will always be such that start \<= end, start \>= 0,
end \>= 0,  start \< lastOffset, end \< lastOffset. All the methods return
a normalized range.

**See Also**
* [`Selection`](#selection-1)

</MemberCard>

<a id="selection-1" name="selection-1"></a>

<MemberCard>

### Selection

```ts
type Selection = {
  direction: "forward" | "backward" | "none";
  ranges: Range[];
};
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

</MemberCard>

## Styles

<a id="style-1" name="style-1"></a>

### Style

<a id="style-1_backgroundcolor" name="style-1_backgroundcolor"></a>

<MemberCard>

##### Style.backgroundColor?

```ts
optional backgroundColor: string;
```

</MemberCard>

<a id="style-1_color" name="style-1_color"></a>

<MemberCard>

##### Style.color?

```ts
optional color: string;
```

</MemberCard>

<a id="style-1_fontfamily" name="style-1_fontfamily"></a>

<MemberCard>

##### Style.fontFamily?

```ts
optional fontFamily: FontFamily;
```

</MemberCard>

<a id="style-1_fontseries" name="style-1_fontseries"></a>

<MemberCard>

##### Style.fontSeries?

```ts
optional fontSeries: FontSeries;
```

</MemberCard>

<a id="style-1_fontshape" name="style-1_fontshape"></a>

<MemberCard>

##### Style.fontShape?

```ts
optional fontShape: FontShape;
```

</MemberCard>

<a id="style-1_fontsize" name="style-1_fontsize"></a>

<MemberCard>

##### Style.fontSize?

```ts
optional fontSize: "auto" | FontSize;
```

</MemberCard>

<a id="style-1_variant" name="style-1_variant"></a>

<MemberCard>

##### Style.variant?

```ts
optional variant: Variant;
```

</MemberCard>

<a id="style-1_variantstyle" name="style-1_variantstyle"></a>

<MemberCard>

##### Style.variantStyle?

```ts
optional variantStyle: VariantStyle;
```

</MemberCard>

<a id="applystyleoptions" name="applystyleoptions"></a>

<MemberCard>

### ApplyStyleOptions

```ts
type ApplyStyleOptions = {
  operation: "set" | "toggle";
  range: Range;
  silenceNotifications: boolean;
};
```

</MemberCard>

<a id="fontfamily-1" name="fontfamily-1"></a>

<MemberCard>

### FontFamily

```ts
type FontFamily = "none" | "roman" | "monospace" | "sans-serif";
```

</MemberCard>

<a id="fontseries-1" name="fontseries-1"></a>

<MemberCard>

### FontSeries

```ts
type FontSeries = "auto" | "m" | "b" | "l" | "";
```

</MemberCard>

<a id="fontshape-1" name="fontshape-1"></a>

<MemberCard>

### FontShape

```ts
type FontShape = "auto" | "n" | "it" | "sl" | "sc" | "";
```

</MemberCard>

<a id="fontsize-1" name="fontsize-1"></a>

<MemberCard>

### FontSize

```ts
type FontSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
```

</MemberCard>

<a id="insertstylehook" name="insertstylehook"></a>

<MemberCard>

### InsertStyleHook()

```ts
type InsertStyleHook = (sender, at, info) => Readonly<Style>;
```

</MemberCard>

<a id="mathstylename" name="mathstylename"></a>

<MemberCard>

### MathstyleName

```ts
type MathstyleName = "displaystyle" | "textstyle" | "scriptstyle" | "scriptscriptstyle";
```

</MemberCard>

<a id="variant-1" name="variant-1"></a>

<MemberCard>

### Variant

```ts
type Variant = 
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

</MemberCard>

<a id="variantstyle-1" name="variantstyle-1"></a>

<MemberCard>

### VariantStyle

```ts
type VariantStyle = "up" | "bold" | "italic" | "bolditalic" | "";
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

</MemberCard>

## Macros

<a id="macrodefinition" name="macrodefinition"></a>

<MemberCard>

### MacroDefinition

```ts
type MacroDefinition = {
  args: number;
  captureSelection: boolean;
  def: string;
  expand: boolean;
};
```

**See Also**
* [`MacroDictionary`](#macrodictionary)
* [Macros guide](//mathfield/guides/macros/)

<a id="macrodefinition_args" name="macrodefinition_args"></a>

#### MacroDefinition.args?

```ts
optional args: number;
```

Number of arguments (`#1`, etc...) in the macro definition

<a id="macrodefinition_captureselection" name="macrodefinition_captureselection"></a>

#### MacroDefinition.captureSelection?

```ts
optional captureSelection: boolean;
```

If `false` elements inside the macro can be selected

<a id="macrodefinition_def" name="macrodefinition_def"></a>

#### MacroDefinition.def

```ts
def: string;
```

Definition of the macro as a LaTeX expression

<a id="macrodefinition_expand" name="macrodefinition_expand"></a>

#### MacroDefinition.expand?

```ts
optional expand: boolean;
```

If `false`, even if `expandMacro` is true, do not expand.

</MemberCard>

<a id="macrodictionary" name="macrodictionary"></a>

<MemberCard>

### MacroDictionary

```ts
type MacroDictionary = Record<string, 
  | string
  | Partial<MacroDefinition>
| MacroPackageDefinition>;
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

</MemberCard>

<a id="macropackagedefinition" name="macropackagedefinition"></a>

<MemberCard>

### MacroPackageDefinition

```ts
type MacroPackageDefinition = {
  captureSelection: boolean;
  package: Record<string, string | MacroDefinition>;
  primitive: boolean;
};
```

</MemberCard>

<a id="normalizedmacrodictionary" name="normalizedmacrodictionary"></a>

<MemberCard>

### NormalizedMacroDictionary

```ts
type NormalizedMacroDictionary = Record<string, MacroDefinition>;
```

</MemberCard>

## Registers

<a id="dimension" name="dimension"></a>

<MemberCard>

### Dimension

```ts
type Dimension = {
  dimension: number;
  unit: DimensionUnit;
};
```

A dimension is used to specify the size of things

</MemberCard>

<a id="dimensionunit" name="dimensionunit"></a>

<MemberCard>

### DimensionUnit

```ts
type DimensionUnit = 
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

</MemberCard>

<a id="glue" name="glue"></a>

<MemberCard>

### Glue

```ts
type Glue = {
  glue: Dimension;
  grow: Dimension;
  shrink: Dimension;
};
```

Glue represents flexible spacing, that is a dimension that
can grow (by the `grow` property) or shrink (by the `shrink` property).

</MemberCard>

<a id="latexvalue" name="latexvalue"></a>

<MemberCard>

### LatexValue

```ts
type LatexValue = {
  relax: boolean;
 } & 
  | Dimension
  | Glue
  | {
  string: string;
 }
  | {
  base: "decimal" | "octal" | "hexadecimal" | "alpha";
  number: number;
 }
  | {
  factor: number;
  global: boolean;
  register: string;
};
```

A LaTeX expression represent a sequence of tokens that can be evaluated to
a value, such as a dimension.

</MemberCard>

<a id="registers-1" name="registers-1"></a>

<MemberCard>

### Registers

```ts
type Registers = Record<string, number | string | LatexValue>;
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

</MemberCard>

## Editing Commands

<a id="commands" name="commands"></a>

### Commands

To perform editing commands on a mathfield, use [`MathfieldElement.executeCommand`](#executecommand) with the commands below.

```ts
const mf = document.getElementById('mathfield');
mf.executeCommand('selectAll');
mf.executeCommand('copyToClipboard');
```

Some commands require an argument, for example to insert a character:

```ts
mf.executeCommand('insert("x")' });
```

The argument can be specified in parentheses after the command name, or
 using an array:

```ts
mf.executeCommand(['switchMode', 'latex']);
// Same as mf.executeCommand('switchMode("latex")');
```

Commands (and `executeCommand()`) return true if they resulted in a dirty
state.

#### Selection

<a id="commands_extendselectionbackward" name="commands_extendselectionbackward"></a>

<MemberCard>

##### Commands.extendSelectionBackward()

```ts
extendSelectionBackward: (model) => boolean;
```

</MemberCard>

<a id="commands_extendselectiondownward" name="commands_extendselectiondownward"></a>

<MemberCard>

##### Commands.extendSelectionDownward()

```ts
extendSelectionDownward: (model) => boolean;
```

</MemberCard>

<a id="commands_extendselectionforward" name="commands_extendselectionforward"></a>

<MemberCard>

##### Commands.extendSelectionForward()

```ts
extendSelectionForward: (model) => boolean;
```

</MemberCard>

<a id="commands_extendselectionupward" name="commands_extendselectionupward"></a>

<MemberCard>

##### Commands.extendSelectionUpward()

```ts
extendSelectionUpward: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtogroupend" name="commands_extendtogroupend"></a>

<MemberCard>

##### Commands.extendToGroupEnd()

```ts
extendToGroupEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtogroupstart" name="commands_extendtogroupstart"></a>

<MemberCard>

##### Commands.extendToGroupStart()

```ts
extendToGroupStart: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtomathfieldend" name="commands_extendtomathfieldend"></a>

<MemberCard>

##### Commands.extendToMathFieldEnd()

```ts
extendToMathFieldEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtomathfieldstart" name="commands_extendtomathfieldstart"></a>

<MemberCard>

##### Commands.extendToMathFieldStart()

```ts
extendToMathFieldStart: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtonextboundary" name="commands_extendtonextboundary"></a>

<MemberCard>

##### Commands.extendToNextBoundary()

```ts
extendToNextBoundary: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtonextword" name="commands_extendtonextword"></a>

<MemberCard>

##### Commands.extendToNextWord()

```ts
extendToNextWord: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtopreviousboundary" name="commands_extendtopreviousboundary"></a>

<MemberCard>

##### Commands.extendToPreviousBoundary()

```ts
extendToPreviousBoundary: (model) => boolean;
```

</MemberCard>

<a id="commands_extendtopreviousword" name="commands_extendtopreviousword"></a>

<MemberCard>

##### Commands.extendToPreviousWord()

```ts
extendToPreviousWord: (model) => boolean;
```

</MemberCard>

<a id="commands_moveafterparent" name="commands_moveafterparent"></a>

<MemberCard>

##### Commands.moveAfterParent()

```ts
moveAfterParent: (model) => boolean;
```

</MemberCard>

<a id="commands_movebeforeparent" name="commands_movebeforeparent"></a>

<MemberCard>

##### Commands.moveBeforeParent()

```ts
moveBeforeParent: (model) => boolean;
```

</MemberCard>

<a id="commands_movedown" name="commands_movedown"></a>

<MemberCard>

##### Commands.moveDown()

```ts
moveDown: (model) => boolean;
```

</MemberCard>

<a id="commands_movetogroupend" name="commands_movetogroupend"></a>

<MemberCard>

##### Commands.moveToGroupEnd()

```ts
moveToGroupEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_movetogroupstart" name="commands_movetogroupstart"></a>

<MemberCard>

##### Commands.moveToGroupStart()

```ts
moveToGroupStart: (model) => boolean;
```

</MemberCard>

<a id="commands_movetomathfieldend" name="commands_movetomathfieldend"></a>

<MemberCard>

##### Commands.moveToMathfieldEnd()

```ts
moveToMathfieldEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_movetomathfieldstart" name="commands_movetomathfieldstart"></a>

<MemberCard>

##### Commands.moveToMathfieldStart()

```ts
moveToMathfieldStart: (model) => boolean;
```

</MemberCard>

<a id="commands_movetonextchar" name="commands_movetonextchar"></a>

<MemberCard>

##### Commands.moveToNextChar()

```ts
moveToNextChar: (model) => boolean;
```

</MemberCard>

<a id="commands_movetonextgroup" name="commands_movetonextgroup"></a>

<MemberCard>

##### Commands.moveToNextGroup()

```ts
moveToNextGroup: (model) => boolean;
```

</MemberCard>

<a id="commands_movetonextplaceholder" name="commands_movetonextplaceholder"></a>

<MemberCard>

##### Commands.moveToNextPlaceholder()

```ts
moveToNextPlaceholder: (model) => boolean;
```

</MemberCard>

<a id="commands_movetonextword" name="commands_movetonextword"></a>

<MemberCard>

##### Commands.moveToNextWord()

```ts
moveToNextWord: (model) => boolean;
```

</MemberCard>

<a id="commands_movetoopposite" name="commands_movetoopposite"></a>

<MemberCard>

##### Commands.moveToOpposite()

```ts
moveToOpposite: (model) => boolean;
```

</MemberCard>

<a id="commands_movetopreviouschar" name="commands_movetopreviouschar"></a>

<MemberCard>

##### Commands.moveToPreviousChar()

```ts
moveToPreviousChar: (model) => boolean;
```

</MemberCard>

<a id="commands_movetopreviousgroup" name="commands_movetopreviousgroup"></a>

<MemberCard>

##### Commands.moveToPreviousGroup()

```ts
moveToPreviousGroup: (model) => boolean;
```

</MemberCard>

<a id="commands_movetopreviousplaceholder" name="commands_movetopreviousplaceholder"></a>

<MemberCard>

##### Commands.moveToPreviousPlaceholder()

```ts
moveToPreviousPlaceholder: (model) => boolean;
```

</MemberCard>

<a id="commands_movetopreviousword" name="commands_movetopreviousword"></a>

<MemberCard>

##### Commands.moveToPreviousWord()

```ts
moveToPreviousWord: (model) => boolean;
```

</MemberCard>

<a id="commands_movetosubscript" name="commands_movetosubscript"></a>

<MemberCard>

##### Commands.moveToSubscript()

```ts
moveToSubscript: (model) => boolean;
```

</MemberCard>

<a id="commands_movetosuperscript" name="commands_movetosuperscript"></a>

<MemberCard>

##### Commands.moveToSuperscript()

```ts
moveToSuperscript: (model) => boolean;
```

</MemberCard>

<a id="commands_moveup" name="commands_moveup"></a>

<MemberCard>

##### Commands.moveUp()

```ts
moveUp: (model) => boolean;
```

</MemberCard>

<a id="commands_selectall" name="commands_selectall"></a>

<MemberCard>

##### Commands.selectAll()

```ts
selectAll: (model) => boolean;
```

</MemberCard>

<a id="commands_selectgroup" name="commands_selectgroup"></a>

<MemberCard>

##### Commands.selectGroup()

```ts
selectGroup: (model) => boolean;
```

</MemberCard>

#### Other

<a id="commands_applystyle-1" name="commands_applystyle-1"></a>

<MemberCard>

##### Commands.applyStyle()

```ts
applyStyle: (mathfield, style) => boolean;
```

</MemberCard>

<a id="commands_commit" name="commands_commit"></a>

<MemberCard>

##### Commands.commit()

```ts
commit: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_dispatchevent" name="commands_dispatchevent"></a>

<MemberCard>

##### Commands.dispatchEvent()

```ts
dispatchEvent: (mathfield, name, detail) => boolean;
```

Dispatch a custom event on the host (mathfield)

</MemberCard>

<a id="commands_insert-1" name="commands_insert-1"></a>

<MemberCard>

##### Commands.insert()

```ts
insert: (mathfield, s, options) => boolean;
```

</MemberCard>

<a id="commands_insertdecimalseparator" name="commands_insertdecimalseparator"></a>

<MemberCard>

##### Commands.insertDecimalSeparator()

```ts
insertDecimalSeparator: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_performwithfeedback" name="commands_performwithfeedback"></a>

<MemberCard>

##### Commands.performWithFeedback()

```ts
performWithFeedback: (mathfield, command) => boolean;
```

Perform a command and include interactive feedback such as sound and
haptic feedback.

This is useful to simulate user interaction, for example for commands
from the virtual keyboard

</MemberCard>

<a id="commands_plonk" name="commands_plonk"></a>

<MemberCard>

##### Commands.plonk()

```ts
plonk: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_speak" name="commands_speak"></a>

<MemberCard>

##### Commands.speak()

```ts
speak: (mathfield, scope, options) => boolean;
```

###### mathfield

`Mathfield`

###### scope

[`SpeechScope`](#speechscope)

How much of the formula should be spoken:
| | |
|---:|:---|
| `all` | the entire formula |
| `selection` | the selection portion of the formula |
| `left` | the element to the left of the selection |
| `right` | the element to the right of the selection |
| `group` | the group (numerator, root, etc..) the selection is in |
| `parent` | the parent of the selection |

###### options

###### withHighlighting

`boolean`

In addition to speaking the requested portion of the formula,
visually highlight it as it is read (read aloud functionality)

</MemberCard>

<a id="commands_switchmode" name="commands_switchmode"></a>

<MemberCard>

##### Commands.switchMode()

```ts
switchMode: (mathfield, mode) => boolean;
```

</MemberCard>

<a id="commands_togglecontextmenu" name="commands_togglecontextmenu"></a>

<MemberCard>

##### Commands.toggleContextMenu()

```ts
toggleContextMenu: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_togglekeystrokecaption" name="commands_togglekeystrokecaption"></a>

<MemberCard>

##### Commands.toggleKeystrokeCaption()

```ts
toggleKeystrokeCaption: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_typedtext" name="commands_typedtext"></a>

<MemberCard>

##### Commands.typedText()

```ts
typedText: (text, options) => boolean;
```

</MemberCard>

#### Array

<a id="commands_addcolumnafter" name="commands_addcolumnafter"></a>

<MemberCard>

##### Commands.addColumnAfter()

```ts
addColumnAfter: (model) => boolean;
```

</MemberCard>

<a id="commands_addcolumnbefore" name="commands_addcolumnbefore"></a>

<MemberCard>

##### Commands.addColumnBefore()

```ts
addColumnBefore: (model) => boolean;
```

</MemberCard>

<a id="commands_addrowafter" name="commands_addrowafter"></a>

<MemberCard>

##### Commands.addRowAfter()

```ts
addRowAfter: (model) => boolean;
```

</MemberCard>

<a id="commands_addrowbefore" name="commands_addrowbefore"></a>

<MemberCard>

##### Commands.addRowBefore()

```ts
addRowBefore: (model) => boolean;
```

</MemberCard>

<a id="commands_removecolumn" name="commands_removecolumn"></a>

<MemberCard>

##### Commands.removeColumn()

```ts
removeColumn: (model) => boolean;
```

</MemberCard>

<a id="commands_removerow" name="commands_removerow"></a>

<MemberCard>

##### Commands.removeRow()

```ts
removeRow: (model) => boolean;
```

</MemberCard>

<a id="commands_setenvironment" name="commands_setenvironment"></a>

<MemberCard>

##### Commands.setEnvironment()

```ts
setEnvironment: (model, environment) => boolean;
```

</MemberCard>

#### Auto-complete

<a id="commands_complete" name="commands_complete"></a>

<MemberCard>

##### Commands.complete()

```ts
complete: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_nextsuggestion" name="commands_nextsuggestion"></a>

<MemberCard>

##### Commands.nextSuggestion()

```ts
nextSuggestion: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_previoussuggestion" name="commands_previoussuggestion"></a>

<MemberCard>

##### Commands.previousSuggestion()

```ts
previousSuggestion: (mathfield) => boolean;
```

</MemberCard>

#### Clipboard

<a id="commands_copytoclipboard" name="commands_copytoclipboard"></a>

<MemberCard>

##### Commands.copyToClipboard()

```ts
copyToClipboard: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_cuttoclipboard" name="commands_cuttoclipboard"></a>

<MemberCard>

##### Commands.cutToClipboard()

```ts
cutToClipboard: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_pastefromclipboard" name="commands_pastefromclipboard"></a>

<MemberCard>

##### Commands.pasteFromClipboard()

```ts
pasteFromClipboard: (mathfield) => boolean;
```

</MemberCard>

#### Deleting

<a id="commands_deleteall" name="commands_deleteall"></a>

<MemberCard>

##### Commands.deleteAll()

```ts
deleteAll: (model) => boolean;
```

</MemberCard>

<a id="commands_deletebackward" name="commands_deletebackward"></a>

<MemberCard>

##### Commands.deleteBackward()

```ts
deleteBackward: (model) => boolean;
```

</MemberCard>

<a id="commands_deleteforward" name="commands_deleteforward"></a>

<MemberCard>

##### Commands.deleteForward()

```ts
deleteForward: (model) => boolean;
```

</MemberCard>

<a id="commands_deletenextword" name="commands_deletenextword"></a>

<MemberCard>

##### Commands.deleteNextWord()

```ts
deleteNextWord: (model) => boolean;
```

</MemberCard>

<a id="commands_deletepreviousword" name="commands_deletepreviousword"></a>

<MemberCard>

##### Commands.deletePreviousWord()

```ts
deletePreviousWord: (model) => boolean;
```

</MemberCard>

<a id="commands_deletetogroupend" name="commands_deletetogroupend"></a>

<MemberCard>

##### Commands.deleteToGroupEnd()

```ts
deleteToGroupEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_deletetogroupstart" name="commands_deletetogroupstart"></a>

<MemberCard>

##### Commands.deleteToGroupStart()

```ts
deleteToGroupStart: (model) => boolean;
```

</MemberCard>

<a id="commands_deletetomathfieldend" name="commands_deletetomathfieldend"></a>

<MemberCard>

##### Commands.deleteToMathFieldEnd()

```ts
deleteToMathFieldEnd: (model) => boolean;
```

</MemberCard>

<a id="commands_deletetomathfieldstart" name="commands_deletetomathfieldstart"></a>

<MemberCard>

##### Commands.deleteToMathFieldStart()

```ts
deleteToMathFieldStart: (model) => boolean;
```

</MemberCard>

#### Prompt

<a id="commands_insertprompt" name="commands_insertprompt"></a>

<MemberCard>

##### Commands.insertPrompt()

```ts
insertPrompt: (mathfield, id?, options?) => boolean;
```

</MemberCard>

#### Scrolling

<a id="commands_scrollintoview" name="commands_scrollintoview"></a>

<MemberCard>

##### Commands.scrollIntoView()

```ts
scrollIntoView: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_scrolltoend" name="commands_scrolltoend"></a>

<MemberCard>

##### Commands.scrollToEnd()

```ts
scrollToEnd: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_scrolltostart" name="commands_scrolltostart"></a>

<MemberCard>

##### Commands.scrollToStart()

```ts
scrollToStart: (mathfield) => boolean;
```

</MemberCard>

#### Undo/Redo

<a id="commands_redo" name="commands_redo"></a>

<MemberCard>

##### Commands.redo()

```ts
redo: (mathfield) => boolean;
```

</MemberCard>

<a id="commands_undo" name="commands_undo"></a>

<MemberCard>

##### Commands.undo()

```ts
undo: (mathfield) => boolean;
```

</MemberCard>

<a id="virtualkeyboardcommands" name="virtualkeyboardcommands"></a>

### VirtualKeyboardCommands

<a id="virtualkeyboardcommands_hidevirtualkeyboard" name="virtualkeyboardcommands_hidevirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.hideVirtualKeyboard()

```ts
hideVirtualKeyboard: () => boolean;
```

</MemberCard>

<a id="virtualkeyboardcommands_showvirtualkeyboard" name="virtualkeyboardcommands_showvirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.showVirtualKeyboard()

```ts
showVirtualKeyboard: () => boolean;
```

</MemberCard>

<a id="virtualkeyboardcommands_switchkeyboardlayer" name="virtualkeyboardcommands_switchkeyboardlayer"></a>

<MemberCard>

##### VirtualKeyboardCommands.switchKeyboardLayer()

```ts
switchKeyboardLayer: (mathfield, layer) => boolean;
```

</MemberCard>

<a id="virtualkeyboardcommands_togglevirtualkeyboard" name="virtualkeyboardcommands_togglevirtualkeyboard"></a>

<MemberCard>

##### VirtualKeyboardCommands.toggleVirtualKeyboard()

```ts
toggleVirtualKeyboard: () => boolean;
```

</MemberCard>

<a id="selector" name="selector"></a>

<MemberCard>

### Selector

```ts
type Selector = Keys<Commands>;
```

</MemberCard>

## Speech

<a id="speechscope" name="speechscope"></a>

<MemberCard>

### SpeechScope

```ts
type SpeechScope = "all" | "selection" | "left" | "right" | "group" | "parent";
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

</MemberCard>

## Keyboard Shortcuts

<a id="inlineshortcutdefinition" name="inlineshortcutdefinition"></a>

<MemberCard>

### InlineShortcutDefinition

```ts
type InlineShortcutDefinition = 
  | string
  | {
  after: string;
  value: string;
};
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

</MemberCard>

<a id="inlineshortcutdefinitions" name="inlineshortcutdefinitions"></a>

<MemberCard>

### InlineShortcutDefinitions

```ts
type InlineShortcutDefinitions = Record<string, InlineShortcutDefinition>;
```

</MemberCard>

<a id="keybinding" name="keybinding"></a>

<MemberCard>

### Keybinding

```ts
type Keybinding = {
  command:   | Selector
     | string[]
     | [string, any]
     | [string, any, any]
     | [string, any, any, any];
  ifLayout: string[];
  ifMode: ParseMode;
  ifPlatform:   | "macos"
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
  key: string;
};
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

<a id="keybinding_command-1" name="keybinding_command-1"></a>

#### Keybinding.command

```ts
command: 
  | Selector
  | string[]
  | [string, any]
  | [string, any, any]
  | [string, any, any, any];
```

The command is a single selector, or a selector with arguments

<a id="keybinding_ifmode" name="keybinding_ifmode"></a>

#### Keybinding.ifMode?

```ts
optional ifMode: ParseMode;
```

If specified, this indicates in which mode this keybinding will apply.
If none is specified, the keybinding will apply in every mode.

<a id="keybinding_ifplatform" name="keybinding_ifplatform"></a>

#### Keybinding.ifPlatform?

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

<a id="keybinding_key-1" name="keybinding_key-1"></a>

#### Keybinding.key

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

## Virtual Keyboard

<a id="normalizedvirtualkeyboardlayer" name="normalizedvirtualkeyboardlayer"></a>

### NormalizedVirtualKeyboardLayer

<a id="normalizedvirtualkeyboardlayer_backdrop" name="normalizedvirtualkeyboardlayer_backdrop"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.backdrop?

```ts
optional backdrop: string;
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayer_container" name="normalizedvirtualkeyboardlayer_container"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.container?

```ts
optional container: string;
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayer_id" name="normalizedvirtualkeyboardlayer_id"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.id?

```ts
optional id: string;
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayer_markup" name="normalizedvirtualkeyboardlayer_markup"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.markup?

```ts
optional markup: string;
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayer_rows" name="normalizedvirtualkeyboardlayer_rows"></a>

<MemberCard>

##### NormalizedVirtualKeyboardLayer.rows?

```ts
optional rows: Partial<VirtualKeyboardKeycap>[][];
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayer_style" name="normalizedvirtualkeyboardlayer_style"></a>

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

<a id="virtualkeyboardinterface_boundingrect" name="virtualkeyboardinterface_boundingrect"></a>

<MemberCard>

##### VirtualKeyboardInterface.boundingRect

```ts
readonly boundingRect: DOMRect;
```

</MemberCard>

<a id="virtualkeyboardinterface_isshifted" name="virtualkeyboardinterface_isshifted"></a>

<MemberCard>

##### VirtualKeyboardInterface.isShifted

```ts
readonly isShifted: boolean;
```

</MemberCard>

<a id="virtualkeyboardinterface_normalizedlayouts" name="virtualkeyboardinterface_normalizedlayouts"></a>

<MemberCard>

##### VirtualKeyboardInterface.normalizedLayouts

```ts
readonly normalizedLayouts: VirtualKeyboardLayoutCore & {
  layers: NormalizedVirtualKeyboardLayer[];
 }[];
```

This property is the "expanded" version of the `layouts` property.
It is normalized to include all the default values for the properties
of the layout and layers.

</MemberCard>

<a id="virtualkeyboardinterface_originvalidator" name="virtualkeyboardinterface_originvalidator"></a>

<MemberCard>

##### VirtualKeyboardInterface.originValidator

```ts
originValidator: OriginValidator;
```

Specify behavior how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
should be validated.

**Default**: `"none"`

</MemberCard>

<a id="virtualkeyboardinterface_targetorigin" name="virtualkeyboardinterface_targetorigin"></a>

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

<a id="virtualkeyboardinterface_visible" name="virtualkeyboardinterface_visible"></a>

<MemberCard>

##### VirtualKeyboardInterface.visible

```ts
visible: boolean;
```

</MemberCard>

<a id="virtualkeyboardinterface_alphabeticlayout" name="virtualkeyboardinterface_alphabeticlayout"></a>

<MemberCard>

##### VirtualKeyboardInterface.alphabeticLayout

```ts
set alphabeticLayout(value: AlphabeticKeyboardLayout): void
```

Layout of the alphabetic layers: AZERTY, QWERTY, etc...

</MemberCard>

<a id="virtualkeyboardinterface_container-1" name="virtualkeyboardinterface_container-1"></a>

<MemberCard>

##### VirtualKeyboardInterface.container

```ts
set container(value: HTMLElement): void
```

Element the virtual keyboard element gets appended to.

When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
that contain mathfield, set this property to the full screen element to
ensure the virtual keyboard will be visible.

**Default**: `document.body`

</MemberCard>

<a id="virtualkeyboardinterface_edittoolbar" name="virtualkeyboardinterface_edittoolbar"></a>

<MemberCard>

##### VirtualKeyboardInterface.editToolbar

```ts
set editToolbar(value: EditToolbarOptions): void
```

Configuration of the action toolbar, displayed on the right-hand side.

Use `"none"` to disable the right hand side toolbar of the
virtual keyboard.

</MemberCard>

<a id="virtualkeyboardinterface_layouts" name="virtualkeyboardinterface_layouts"></a>

<MemberCard>

##### VirtualKeyboardInterface.layouts

```ts
get layouts(): readonly (
  | VirtualKeyboardLayout
  | VirtualKeyboardName)[]
set layouts(value: 
  | VirtualKeyboardLayout
  | VirtualKeyboardName
  | VirtualKeyboardLayout | VirtualKeyboardName[]
  | readonly VirtualKeyboardLayout | VirtualKeyboardName[]): void
```

A layout is made up of one or more layers (think of the main layer
and the shift layer on a hardware keyboard).

A layout has a name and styling information.

In addition, a layout can be represented as a standard name which
includes `"numeric"`, `"functions"`, `"symbols"`, `"alphabetic"`
and `"greek".

**See* mathfield/guides/virtual-keyboards \| Guide: Virtual Keyboards

</MemberCard>

<a id="virtualkeyboardinterface_connect" name="virtualkeyboardinterface_connect"></a>

<MemberCard>

##### VirtualKeyboardInterface.connect()

```ts
connect(): void
```

</MemberCard>

<a id="virtualkeyboardinterface_disconnect" name="virtualkeyboardinterface_disconnect"></a>

<MemberCard>

##### VirtualKeyboardInterface.disconnect()

```ts
disconnect(): void
```

</MemberCard>

<a id="virtualkeyboardinterface_executecommand-1" name="virtualkeyboardinterface_executecommand-1"></a>

<MemberCard>

##### VirtualKeyboardInterface.executeCommand()

```ts
executeCommand(command): boolean
```

###### command

`string` | \[`string`, `...any[]`\]

</MemberCard>

<a id="virtualkeyboardinterface_getkeycap" name="virtualkeyboardinterface_getkeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.getKeycap()

```ts
getKeycap(keycap): Partial<VirtualKeyboardKeycap>
```

Some keycaps can be customized:
`[left]`, `[right]`, `[up]`, `[down]`, `[return]`, `[action]`,
`[space]`, `[tab]`, `[backspace]`, `[shift]`,
`[undo]`, `[redo]`, `[foreground-color]`, `[background-color]`,
`[hide-keyboard]`,
`[.]`, `[,]`,
`[0]`, `[1]`, `[2]`, `[3]`, `[4]`,
`[5]`, `[6]`, `[7]`, `[8]`, `[9]`,
`[+]`, `[-]`, `[*]`, `[/]`, `[^]`, `[_]`, `[=]`, `[.]`,
`[(]`, `[)]`,

###### keycap

`string`

</MemberCard>

<a id="virtualkeyboardinterface_hide" name="virtualkeyboardinterface_hide"></a>

<MemberCard>

##### VirtualKeyboardInterface.hide()

```ts
hide(options?): void
```

###### options?

###### animate

`boolean`

</MemberCard>

<a id="virtualkeyboardinterface_setkeycap" name="virtualkeyboardinterface_setkeycap"></a>

<MemberCard>

##### VirtualKeyboardInterface.setKeycap()

```ts
setKeycap(keycap, value): void
```

###### keycap

`string`

###### value

`Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="virtualkeyboardinterface_show" name="virtualkeyboardinterface_show"></a>

<MemberCard>

##### VirtualKeyboardInterface.show()

```ts
show(options?): void
```

###### options?

###### animate

`boolean`

</MemberCard>

<a id="virtualkeyboardinterface_update" name="virtualkeyboardinterface_update"></a>

<MemberCard>

##### VirtualKeyboardInterface.update()

```ts
update(mf): void
```

###### mf

`MathfieldProxy`

</MemberCard>

<a id="virtualkeyboardinterface_updatetoolbar" name="virtualkeyboardinterface_updatetoolbar"></a>

<MemberCard>

##### VirtualKeyboardInterface.updateToolbar()

```ts
updateToolbar(mf): void
```

The content or selection of the mathfield has changed and the toolbar
may need to be updated accordingly

###### mf

`MathfieldProxy`

</MemberCard>

<a id="virtualkeyboardkeycap" name="virtualkeyboardkeycap"></a>

### VirtualKeyboardKeycap

<a id="virtualkeyboardkeycap_aside" name="virtualkeyboardkeycap_aside"></a>

<MemberCard>

##### VirtualKeyboardKeycap.aside

```ts
aside: string;
```

Markup displayed with the key label (for example to explain what the
symbol of the key is)

</MemberCard>

<a id="virtualkeyboardkeycap_class" name="virtualkeyboardkeycap_class"></a>

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

<a id="virtualkeyboardkeycap_command" name="virtualkeyboardkeycap_command"></a>

<MemberCard>

##### VirtualKeyboardKeycap.command

```ts
command: 
  | string
  | string[]
  | [string, any]
  | [string, any, any]
  | [string, any, any, any];
```

Command to perform when the keycap is pressed

</MemberCard>

<a id="virtualkeyboardkeycap_insert-2" name="virtualkeyboardkeycap_insert-2"></a>

<MemberCard>

##### VirtualKeyboardKeycap.insert

```ts
insert: string;
```

LaTeX fragment to insert when the keycap is pressed
(ignored if command is specified)

</MemberCard>

<a id="virtualkeyboardkeycap_key" name="virtualkeyboardkeycap_key"></a>

<MemberCard>

##### VirtualKeyboardKeycap.key

```ts
key: string;
```

Key to insert when keycap is pressed
(ignored if `command`, `insert` or `latex` is specified)

</MemberCard>

<a id="virtualkeyboardkeycap_label" name="virtualkeyboardkeycap_label"></a>

<MemberCard>

##### VirtualKeyboardKeycap.label

```ts
label: string;
```

The HTML markup displayed for the keycap

</MemberCard>

<a id="virtualkeyboardkeycap_latex" name="virtualkeyboardkeycap_latex"></a>

<MemberCard>

##### VirtualKeyboardKeycap.latex

```ts
latex: string;
```

Label of the key as a LaTeX expression, also the LaTeX
inserted if no `command` or `insert` property is specified.

</MemberCard>

<a id="virtualkeyboardkeycap_layer" name="virtualkeyboardkeycap_layer"></a>

<MemberCard>

##### VirtualKeyboardKeycap.layer

```ts
layer: string;
```

Name of the layer to shift to when the key is pressed

</MemberCard>

<a id="virtualkeyboardkeycap_shift" name="virtualkeyboardkeycap_shift"></a>

<MemberCard>

##### VirtualKeyboardKeycap.shift

```ts
shift: 
  | string
| Partial<VirtualKeyboardKeycap>;
```

Variant of the keycap when the shift key is pressed

</MemberCard>

<a id="virtualkeyboardkeycap_stickyvariantpanel" name="virtualkeyboardkeycap_stickyvariantpanel"></a>

<MemberCard>

##### VirtualKeyboardKeycap.stickyVariantPanel

```ts
stickyVariantPanel: boolean;
```

Open variants panel without long press and does not close automatically

</MemberCard>

<a id="virtualkeyboardkeycap_tooltip" name="virtualkeyboardkeycap_tooltip"></a>

<MemberCard>

##### VirtualKeyboardKeycap.tooltip

```ts
tooltip: string;
```

</MemberCard>

<a id="virtualkeyboardkeycap_variants" name="virtualkeyboardkeycap_variants"></a>

<MemberCard>

##### VirtualKeyboardKeycap.variants

```ts
variants: 
  | string
  | (
  | string
  | Partial<VirtualKeyboardKeycap>)[];
```

A set of keycap variants displayed on a long press

```js
variants: [
 '\\alpha',    // Same label as value inserted
 { latex: '\\beta', label: 'beta' }
]

```

</MemberCard>

<a id="virtualkeyboardkeycap_width" name="virtualkeyboardkeycap_width"></a>

<MemberCard>

##### VirtualKeyboardKeycap.width

```ts
width: 0.5 | 1 | 1.5 | 2 | 5;
```

Width of the keycap, as a multiple of the standard keycap width

</MemberCard>

<a id="virtualkeyboardlayer" name="virtualkeyboardlayer"></a>

### VirtualKeyboardLayer

<a id="virtualkeyboardlayer_backdrop-1" name="virtualkeyboardlayer_backdrop-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.backdrop?

```ts
optional backdrop: string;
```

A CSS class name to customize the appearance of the background of the layer

</MemberCard>

<a id="virtualkeyboardlayer_container-2" name="virtualkeyboardlayer_container-2"></a>

<MemberCard>

##### VirtualKeyboardLayer.container?

```ts
optional container: string;
```

A CSS class name to customize the appearance of the container the layer

</MemberCard>

<a id="virtualkeyboardlayer_id-1" name="virtualkeyboardlayer_id-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.id?

```ts
optional id: string;
```

A unique string identifying the layer

</MemberCard>

<a id="virtualkeyboardlayer_markup-1" name="virtualkeyboardlayer_markup-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.markup?

```ts
optional markup: string;
```

</MemberCard>

<a id="virtualkeyboardlayer_rows-1" name="virtualkeyboardlayer_rows-1"></a>

<MemberCard>

##### VirtualKeyboardLayer.rows?

```ts
optional rows: (
  | string
  | Partial<VirtualKeyboardKeycap>)[][];
```

The rows of keycaps in this layer

</MemberCard>

<a id="virtualkeyboardlayer_style-2" name="virtualkeyboardlayer_style-2"></a>

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

<a id="virtualkeyboardoptions_normalizedlayouts-1" name="virtualkeyboardoptions_normalizedlayouts-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.normalizedLayouts

```ts
readonly normalizedLayouts: VirtualKeyboardLayoutCore & {
  layers: NormalizedVirtualKeyboardLayer[];
 }[];
```

This property is the "expanded" version of the `layouts` property.
It is normalized to include all the default values for the properties
of the layout and layers.

</MemberCard>

<a id="virtualkeyboardoptions_originvalidator-1" name="virtualkeyboardoptions_originvalidator-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.originValidator

```ts
originValidator: OriginValidator;
```

Specify behavior how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
should be validated.

**Default**: `"none"`

</MemberCard>

<a id="virtualkeyboardoptions_targetorigin-1" name="virtualkeyboardoptions_targetorigin-1"></a>

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

<a id="virtualkeyboardoptions_alphabeticlayout-1" name="virtualkeyboardoptions_alphabeticlayout-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.alphabeticLayout

```ts
set alphabeticLayout(value: AlphabeticKeyboardLayout): void
```

Layout of the alphabetic layers: AZERTY, QWERTY, etc...

</MemberCard>

<a id="virtualkeyboardoptions_container-3" name="virtualkeyboardoptions_container-3"></a>

<MemberCard>

##### VirtualKeyboardOptions.container

```ts
set container(value: HTMLElement): void
```

Element the virtual keyboard element gets appended to.

When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
that contain mathfield, set this property to the full screen element to
ensure the virtual keyboard will be visible.

**Default**: `document.body`

</MemberCard>

<a id="virtualkeyboardoptions_edittoolbar-1" name="virtualkeyboardoptions_edittoolbar-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.editToolbar

```ts
set editToolbar(value: EditToolbarOptions): void
```

Configuration of the action toolbar, displayed on the right-hand side.

Use `"none"` to disable the right hand side toolbar of the
virtual keyboard.

</MemberCard>

<a id="virtualkeyboardoptions_layouts-1" name="virtualkeyboardoptions_layouts-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.layouts

```ts
get layouts(): readonly (
  | VirtualKeyboardLayout
  | VirtualKeyboardName)[]
set layouts(value: 
  | VirtualKeyboardLayout
  | VirtualKeyboardName
  | VirtualKeyboardLayout | VirtualKeyboardName[]
  | readonly VirtualKeyboardLayout | VirtualKeyboardName[]): void
```

A layout is made up of one or more layers (think of the main layer
and the shift layer on a hardware keyboard).

A layout has a name and styling information.

In addition, a layout can be represented as a standard name which
includes `"numeric"`, `"functions"`, `"symbols"`, `"alphabetic"`
and `"greek".

**See* mathfield/guides/virtual-keyboards \| Guide: Virtual Keyboards

</MemberCard>

<a id="virtualkeyboardoptions_getkeycap-1" name="virtualkeyboardoptions_getkeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.getKeycap()

```ts
getKeycap(keycap): Partial<VirtualKeyboardKeycap>
```

Some keycaps can be customized:
`[left]`, `[right]`, `[up]`, `[down]`, `[return]`, `[action]`,
`[space]`, `[tab]`, `[backspace]`, `[shift]`,
`[undo]`, `[redo]`, `[foreground-color]`, `[background-color]`,
`[hide-keyboard]`,
`[.]`, `[,]`,
`[0]`, `[1]`, `[2]`, `[3]`, `[4]`,
`[5]`, `[6]`, `[7]`, `[8]`, `[9]`,
`[+]`, `[-]`, `[*]`, `[/]`, `[^]`, `[_]`, `[=]`, `[.]`,
`[(]`, `[)]`,

###### keycap

`string`

</MemberCard>

<a id="virtualkeyboardoptions_setkeycap-1" name="virtualkeyboardoptions_setkeycap-1"></a>

<MemberCard>

##### VirtualKeyboardOptions.setKeycap()

```ts
setKeycap(keycap, value): void
```

###### keycap

`string`

###### value

`Partial`\<[`VirtualKeyboardKeycap`](#virtualkeyboardkeycap)\>

</MemberCard>

<a id="alphabetickeyboardlayout" name="alphabetickeyboardlayout"></a>

<MemberCard>

### AlphabeticKeyboardLayout

```ts
type AlphabeticKeyboardLayout = "auto" | "qwerty" | "azerty" | "qwertz" | "dvorak" | "colemak";
```

</MemberCard>

<a id="edittoolbaroptions" name="edittoolbaroptions"></a>

<MemberCard>

### EditToolbarOptions

```ts
type EditToolbarOptions = "none" | "default";
```

</MemberCard>

<a id="normalizedvirtualkeyboardlayout" name="normalizedvirtualkeyboardlayout"></a>

<MemberCard>

### NormalizedVirtualKeyboardLayout

```ts
type NormalizedVirtualKeyboardLayout = VirtualKeyboardLayoutCore & {
  layers: NormalizedVirtualKeyboardLayer[];
};
```

</MemberCard>

<a id="originvalidator-2" name="originvalidator-2"></a>

<MemberCard>

### OriginValidator

```ts
type OriginValidator = (origin) => boolean | "same-origin" | "none";
```

Specify behavior for origin validation when using the virtual keyboard.

<div className='symbols-table' style={{"--first-col-width":"32ex"}}>

| Value | Description |
| ----- | ----------- |
| `"same-origin"` | The origin of received message must be the same of hosted window, instead exception will throw. |
| `(origin: string) => boolean` | The callback to verify origin to be expected validation. When callback return `false` value, message will rejected and exception will throw. |
| `"none"` | No origin validation for post messages. |

</div>

</MemberCard>

<a id="virtualkeyboardlayout" name="virtualkeyboardlayout"></a>

<MemberCard>

### VirtualKeyboardLayout

```ts
type VirtualKeyboardLayout = VirtualKeyboardLayoutCore & 
  | {
  layers: (string | VirtualKeyboardLayer)[];
 }
  | {
  rows: (
     | string
     | Partial<VirtualKeyboardKeycap>)[][];
 }
  | {
  markup: string;
};
```

</MemberCard>

<a id="virtualkeyboardlayoutcore" name="virtualkeyboardlayoutcore"></a>

<MemberCard>

### VirtualKeyboardLayoutCore

```ts
type VirtualKeyboardLayoutCore = {
  displayEditToolbar: boolean;
  displayShiftedKeycaps: boolean;
  id: string;
  label: string;
  labelClass: string;
  tooltip: string;
};
```

<a id="virtualkeyboardlayoutcore_displayedittoolbar" name="virtualkeyboardlayoutcore_displayedittoolbar"></a>

#### VirtualKeyboardLayoutCore.displayEditToolbar?

```ts
optional displayEditToolbar: boolean;
```

If false, do not include the edit toolbar in the layout

<a id="virtualkeyboardlayoutcore_displayshiftedkeycaps" name="virtualkeyboardlayoutcore_displayshiftedkeycaps"></a>

#### VirtualKeyboardLayoutCore.displayShiftedKeycaps?

```ts
optional displayShiftedKeycaps: boolean;
```

If false, keycaps that have a shifted variant will be displayed as if they don't

<a id="virtualkeyboardlayoutcore_id-3" name="virtualkeyboardlayoutcore_id-3"></a>

#### VirtualKeyboardLayoutCore.id?

```ts
optional id: string;
```

A unique string identifying the layout

<a id="virtualkeyboardlayoutcore_label-1" name="virtualkeyboardlayoutcore_label-1"></a>

#### VirtualKeyboardLayoutCore.label?

```ts
optional label: string;
```

A human readable string displayed in the layout switcher toolbar

<a id="virtualkeyboardlayoutcore_tooltip-1" name="virtualkeyboardlayoutcore_tooltip-1"></a>

#### VirtualKeyboardLayoutCore.tooltip?

```ts
optional tooltip: string;
```

A human readable tooltip associated with the label

</MemberCard>

<a id="virtualkeyboardmessage" name="virtualkeyboardmessage"></a>

<MemberCard>

### VirtualKeyboardMessage

```ts
type VirtualKeyboardMessage = 
  | {
  action: "execute-command";
  command:   | Selector
     | [Selector, ...any[]];
  type: "mathlive#virtual-keyboard-message";
 }
  | {
  action: "geometry-changed";
  boundingRect: DOMRect;
  type: "mathlive#virtual-keyboard-message";
 }
  | {
  action: "synchronize-proxy";
  alphabeticLayout: AlphabeticKeyboardLayout;
  boundingRect: DOMRect;
  editToolbar: EditToolbarOptions;
  isShifted: boolean;
  layers: Record<string, 
     | string
     | Partial<VirtualKeyboardLayer>>;
  layouts: Readonly<(string | VirtualKeyboardLayout)[]>;
  setKeycap: {
     keycap: string;
     value: Partial<VirtualKeyboardKeycap>;
    };
  type: "mathlive#virtual-keyboard-message";
 }
  | {
  action: "update-setting";
  alphabeticLayout: AlphabeticKeyboardLayout;
  editToolbar: EditToolbarOptions;
  layers: Record<string, 
     | string
     | Partial<VirtualKeyboardLayer>>;
  layouts: Readonly<(
     | VirtualKeyboardName
     | VirtualKeyboardLayout)[]>;
  setKeycap: {
     keycap: string;
     value: Partial<VirtualKeyboardKeycap>;
    };
  type: "mathlive#virtual-keyboard-message";
 }
  | {
  action: "show" | "hide";
  animate: boolean;
  type: "mathlive#virtual-keyboard-message";
 }
  | {
  action:   | "connect"
     | "disconnect"
     | "proxy-created"
     | "focus"
     | "blur"
     | "update-state"
     | "update-toolbar";
  type: "mathlive#virtual-keyboard-message";
};
```

</MemberCard>

<a id="virtualkeyboardmessageaction" name="virtualkeyboardmessageaction"></a>

<MemberCard>

### VirtualKeyboardMessageAction

```ts
type VirtualKeyboardMessageAction = 
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

</MemberCard>

<a id="virtualkeyboardname" name="virtualkeyboardname"></a>

<MemberCard>

### VirtualKeyboardName

```ts
type VirtualKeyboardName = 
  | "default"
  | "compact"
  | "minimalist"
  | "numeric-only"
  | "numeric"
  | "symbols"
  | "alphabetic"
  | "greek";
```

</MemberCard>

<a id="virtualkeyboardpolicy" name="virtualkeyboardpolicy"></a>

<MemberCard>

### VirtualKeyboardPolicy

```ts
type VirtualKeyboardPolicy = "auto" | "manual" | "sandboxed";
```

- `"auto"`: the virtual keyboard is triggered when a
mathfield is focused on a touch capable device.
- `"manual"`: the virtual keyboard is not triggered automatically
- `"sandboxed"`: the virtual keyboard is displayed in the current browsing
context (iframe) if it has a defined container or is the top-level browsing
context.

</MemberCard>

## Localization

<a id="keyboardlayoutname" name="keyboardlayoutname"></a>

<MemberCard>

### KeyboardLayoutName

```ts
type KeyboardLayoutName = 
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

</MemberCard>

<a id="setkeyboardlayout" name="setkeyboardlayout"></a>

<MemberCard>

### setKeyboardLayout()

```ts
function setKeyboardLayout(name): void
```

Change the current physical keyboard layout.

Note that this affects some keybindings, but not general text input.

If set to `auto` the keyboard layout is guessed.

##### name

`"auto"` | [`KeyboardLayoutName`](#keyboardlayoutname)

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

##### locale

`string`

</MemberCard>

## Static Rendering

<a id="staticrenderoptions" name="staticrenderoptions"></a>

<MemberCard>

### StaticRenderOptions

```ts
type StaticRenderOptions = Partial<LayoutOptions> & {
  asciiMath: {
     delimiters: {
        display: string[];
        inline: string[];
       };
    };
  ignoreClass: string;
  processClass: string;
  processMathJSONScriptType: string;
  processScriptType: string;
  readAloud: boolean;
  renderAccessibleContent: string;
  skipTags: string[];
  TeX: {
     className: {
        display: string;
        inline: string;
       };
     delimiters: {
        display: [string, string][];
        inline: [string, string][];
       };
     processEnvironments: boolean;
    };
};
```

#### StaticRenderOptions.ignoreClass?

```ts
optional ignoreClass: string;
```

A string used as a regular expression of class names of elements whose
content will not be scanned for delimiter

**Default**: `"tex2jax_ignore"`

#### StaticRenderOptions.processClass?

```ts
optional processClass: string;
```

A string used as a regular expression of class names of elements whose
content **will** be scanned for delimiters,  even if their tag name or
parent class name would have prevented them from doing so.

**Default**: `"tex2jax_process"`

#### StaticRenderOptions.processMathJSONScriptType?

```ts
optional processMathJSONScriptType: string;
```

`<script>` tags with this type will be processed as MathJSON.

**Default**: `"math/json"`

#### StaticRenderOptions.processScriptType?

```ts
optional processScriptType: string;
```

`<script>` tags with this type will be processed as LaTeX.

**Default**: `"math/tex"`

#### StaticRenderOptions.readAloud?

```ts
optional readAloud: boolean;
```

If true, generate markup that can
be read aloud later using speak

**Default**: `false`

#### StaticRenderOptions.renderAccessibleContent?

```ts
optional renderAccessibleContent: string;
```

The format(s) in which to render the math for screen readers:
- `"mathml"` MathML
- `"speakable-text"` Spoken representation

You can pass an empty string to turn off the rendering of accessible content.
You can pass multiple values separated by spaces, e.g `"mathml speakable-text"`

**Default**: `"mathml"`

#### StaticRenderOptions.skipTags?

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

##### options?

[`StaticRenderOptions`](#staticrenderoptions)

#### Example

```ts
import { renderMathInDocument } from 'https://unpkg.com/mathlive?module';
renderMathInDocument();
```

</MemberCard>

<a id="rendermathinelement" name="rendermathinelement"></a>

<MemberCard>

### renderMathInElement()

```ts
function renderMathInElement(element, options?): void
```

Transform all the children of `element` that contain LaTeX code
into typeset math, recursively.

##### element

An HTML DOM element, or a string containing
the ID of an element.

`string` | `HTMLElement`

##### options?

[`StaticRenderOptions`](#staticrenderoptions)

#### Example

```ts
import { renderMathInElement } from 'https://unpkg.com/mathlive?module';
renderMathInElement("formula");
```

</MemberCard>

## Conversion

<a id="latexsyntaxerrort" name="latexsyntaxerrort"></a>

<MemberCard>

### LatexSyntaxError\<T\>

```ts
type LatexSyntaxError<T> = {
  after: string;
  arg: string;
  before: string;
  code: T;
  latex: string;
};
```

#### Type Parameters

• T = [`ParserErrorCode`](#parsererrorcode)

</MemberCard>

<a id="parsererrorcode" name="parsererrorcode"></a>

<MemberCard>

### ParserErrorCode

```ts
type ParserErrorCode = 
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

</MemberCard>

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

##### ascii

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

##### latex

`string`

##### parseMode

`ParseMode` = `'math'`

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

##### text

`string`

A string of valid LaTeX. It does not have to start
with a mode token such as `$$` or `\(`.

##### options?

`Partial`\<`LayoutOptions`\>

</MemberCard>

<a id="convertlatextomathml" name="convertlatextomathml"></a>

<MemberCard>

### convertLatexToMathMl()

```ts
function convertLatexToMathMl(latex, options): string
```

Convert a LaTeX string to a string of MathML markup.

##### latex

`string`

A string of valid LaTeX. It does not have to start
with a mode token such as a `$$` or `\(`.

##### options

###### generateID?

`boolean`

If true, add an `"extid"` attribute
to the MathML nodes with a value matching the `atomID`. This can be used
to map items on the screen with their MathML representation or vice-versa.

</MemberCard>

<a id="convertlatextospeakabletext" name="convertlatextospeakabletext"></a>

<MemberCard>

### convertLatexToSpeakableText()

```ts
function convertLatexToSpeakableText(latex): string
```

Convert a LaTeX string to a textual representation ready to be spoken

##### latex

`string`

A string of valid LaTeX. It does not have to start
with a mode token such as a `$$` or `\(`.

#### Example

```ts
console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
// 'half'
```

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

##### json

[`Expression`](#expression-1)

</MemberCard>

<a id="validatelatex" name="validatelatex"></a>

<MemberCard>

### validateLatex()

```ts
function validateLatex(s): LatexSyntaxError[]
```

Check if a string of LaTeX is valid and return an array of syntax errors.

##### s

`string`

</MemberCard>

## MathJSON

<a id="expression-1" name="expression-1"></a>

<MemberCard>

### Expression

```ts
type Expression = 
  | number
  | string
  | {}
  | [Expression, ...Expression[]];
```

</MemberCard>

## Other

<a id="version-1" name="version-1"></a>

<MemberCard>

### version

```ts
const version: {
  mathlive: string;
};
```

Current version: `{{SDK_VERSION}}`

The version string of the SDK using the [semver](https://semver.org/) convention:

`MAJOR`.`MINOR`.`PATCH`

* **`MAJOR`** is incremented for incompatible API changes
* **`MINOR`** is incremented for new features
* **`PATCH`** is incremented for bug fixes

</MemberCard>
