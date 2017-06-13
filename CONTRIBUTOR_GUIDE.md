# MathLive Contributor Guide

This guide describes the structure of the MathLive project. If you are 
interested in contributing to it, or if you want to better understand how
it works you will find it useful. If you simply want to use MathLive 
with your web content, see the [MathLive Usage Guide](USAGE_GUIDE.md).

## Code structure
The MathLive library consists of the following key directories:
* `css/` the stylesheets and fonts used by MathLive
* `src/core` the core Javascript code needed to render math. This module depends on the `css/` module.
* `src/editor` the Javascript code needed for the editor. This module depends
on the `src/core` module.
* `src/addons` some optional modules that provide additional functionality

You can include only the files you need. For example, if you only
need to display math, you can skip `src/editor/` and `src/addons`.

## Language and Coding Style

MathLive is written in Javascript, using the [ES2016 dialect]
(https://www.ecma-international.org/ecma-262/7.0/). This includes
in particular features such as:
* `let` and `const` instead of `var`
* block-scoped variables and functions
* `Array.prototype.includes()`
* `Object.assign()`
* arrow functions (to a limited extent, there appears to be issues with transpilers)
* template strings
* `for...of` iterators
* string searching `String.startsWith()`, `tring.endsWith()`
* number formatting

Features that have not been adopted include:
* classes. The syntax doesn't seem to offer that much benefit and forces 
utility functions to be separated from methods that use them.
* getters/setters: would probably be a good idea
* destructuring: probably somes opportunities to simply some code
* default parameters: would clean up some code
* rest/spread
* generators

Before publishing, the code is ran through [Babel](https://babeljs.io), which 
transpiles it to ES5 for compatibility with browsers that don't support all
those features

The code base attempts to follow these general guidelines:

* **Consistency** All code in the codebase should look as if it had been 
written by a single person. Don't write code for yourself, but for the many 
people who will read it later.
* **Clarity before performance** Write code that is easy to read, and avoid 
obscure constructs that may obfuscate the code to improve performance. For 
example, RegEx are crazy fast in all modern browsers, and trying to roll out
your own pattern matching will result in more code and less performance. If 
you think something could be made faster, use `jsperf.com` to try out options
in various browsers and compare the results. You might be surprised.

Use the `.eslintrc.json` file to follow the linting conventions used in the 
project. In addition, follow these guidelines:
* **Tabs** are expanded to **four spaces**
* Quotes are preferably **single quotes**. Use double-quotes when inside a 
single-quoted string. Using backtick for multiline quotes is OK.
* **Typecheck** using `typeof v === 'string'`, `typeof v === 'number'`, etc... 
Use `Array.isArray(v)` to check for arrays.
* **Conditional evaluation** Use conditional evaluation shortcuts when applicable
for example, use `if (string)` instead of `if (string !== '')`
* The return variable of a function is usually named **`result`**
* Avoid boolean as arguments. Instead, use an `options` Object that can have 
key value pairs spelling out the meaning of the boolean. Instead of `f(true);` 
you would have `f({reverse: true})`. 
* Use `||` for default values, for example `m = f(n) || d`. If the function
`f` returns `null`, `undefined` or an empty string, `m` will have the value `d`
* **Braces for control structures** should always be used, except for short
`if` statement, for example `if (done) return;`
* **Avoid method chaining** Method chaining is a programming style where a 
method returns the `this` object so that is can be called again. For example 
`div.css('color', 'white').height(50).width(50)`.
* **Use loose typing** For example, a function argument could accept a string
or an array and behave appropriately. For example:
```
    function f(argument) {
        if (Array.isArray(argument)) {
            argument = argument.join(';');
        }
    }
```

## Naming Convention

Those naming conventions are particularly important for objects that are exposed
as part of the public API, such as `MathLive` and `MathField`.

* variables and function names that begin with `_` are private and should not
 be used.
* functions that end in '_' are selectors and should not be invoked directly.
Instead, a `MathField.perform()` call should be made. Note that the perform call
does not include the `_`, so you would call `MathField.perform('selectAll')`.
* functions that neither begin nor end with an `_` are public and can be called
directly.


## Compatibility

MathLive is designed for the modern web. Supporting older browsers complicates
the effort involved in building new features, but it is also an insecure 
practice that should not be encouraged. In this context, _modern_ means the
latest release of Chrome, IE, Safari, Firefox. Both desktop and mobile are
supported.

## Architecture

The core of MathLive is a renderer that can display complex math content
using HTML and CSS. This renderer uses the TeX layout algorithms because of 
their quality. Given the same input, MathLive will render pixel for pixel what 
TeX would have rendered.
To do so, it make use of a web version of the fonts used by TeX and which are
included in the `css/fonts/` directory.

 Here are some of the key concepts used throughtout the code base.

 ### Span

A span is an object that is used to represent an element displayed in the page:
a symbol such as _x_ or _=_, an open brace, a line separating the numerator 
and denominator of a fraction, etc...

The basic layout strategy is to calculate the vertical placement of the spans and 
position them accordingly, while letting the HTML rendering engine position
and display the horizontal items. An exception is when some horizontal 
adjustment needs to be made, such as additional space between items, in which 
case CSS margin adjustments are made.

**Spans** can be rendered to HTML markup with `Span.toMarkup()` before being 
displayed on the page.

 ### Math Atom

An atom is an object encapsulating an elementary mathematical unit, indepdent of
its graphical representation. It can be of one of the following types:
* **ord**: ordinary symbol, e.g. _x_, _\alpha_
* **bin**: binary operator: _+_, _*_, etc...
* **rel**: relational operator: _=_, _\ne_, etc...
* **punct**: punctuation: _,_, _:_, etc...
* **open**: opening fence: _(_, _\langle_, etc...
* **close**: closing fence: _)_, _\rangle_, etc...
* **op**: (big) operators, _\sum_, _\cap_.
* **inner**: special layout cases, overlap
* **accent**: a diacritic mark above a symbol

In addition to these basic types, which correspond to the TeX atom types,
some atoms represent more complex compounds, including:
* **space** and **spacing**: blank space between atoms
* **mathstyle**: to change the math style used: **display** or **text**. The 
layout rules are different for each, the latter being more compact and intended
to be incorporated with surrounding non-math text.
* **font**: to change the font used. Used by `\mathbb`, `\mathbb`, etc...
* **sizing**: to change the size of the font used
* **color**: to change the foreground color
* **rule**: a line, for the `\rule` command
* **line**: used by `\overline` and `\underline` commands
* **box**: to draw a border around an expression and change its background color
* **overlap**: display a symbol _over_ another
* **overunder**: displays an annotation above or below a symbold
* **group**: a simple group of atoms
* **root**: a group, which has no parent
* **array**: a group, which has children arranged in columns and rows. Used
by environments such as `matrix`, `cases`, etc...
* **genfrac**: a generalized fraction: a numerator and denominator, separated
by an optional line, and surrounded by optional fences
* **surd**: a surd, aka root
* **leftright**: used by the `\left` and `\right` commands
* **delim**: some delimiter
* **sizeddelim**: a delimiter that can grow

The following types are used by the editor:
* **command** indicate a command being entered. The text is displayed in 
blue in the editor.
* **error**: indicate a command that is unknown, for example `\xyzy`. The text
is displayed with a dotted red underline in the editor.
* **placeholder**: indicate a temporary item. Placeholders are displayed with a 
a pill (rounded box) in the editor.
* **first**: a special, empty, atom put as the first atom in math lists in 
order to more easily represent the cursor position. They are not displayed.


 ### Math List
A **math list** is simply an array of atoms. Although it's a common data 
structure there is no class to represent it: it's simply an `Array()` of `MathAtom`.

### Lexer
The **lexer** converts a string of TeX code into tokens that can be digested
by the parser.

### Parser
The **parser** turns a stream of tokens generated by the lexer into 
**math atoms**. Those atoms then can be rendered into **spans**, or back into 
LaTeX or into spoken text.

### Editable Math List
An **Editable Math List** is a class specific to the editor and that
encapsulates the manipulations that can be done to a math list, including 
adding and removing content and keeping track of and modifying an insertion 
point and selection.


## Files

Here's a brief guide to the files of the project:

* **mathlive.js** The public API to Mathlive

* **core/lexer.js** Implements the `Lexer` class: strings to tokens

* **core/parser.js** Implements the `Parser` class: tokens to atoms
* **core/definitions.js** Dictionary of all the known LaTeX commands, and 
which symbol or atom type they map to. Used by the `Parser`
* **core/color.js** Support to parse color arguments

* **core/mathAtom.js** Implements the `MathAtom` class: atoms to spans
* **core.delimiters.js** Rendering (atoms to span) for delimiters. 
* **core/context.js** Rendering context of the current parse level (math style,
color, font size, font family, font style, etc...). Used by MathAtom while 
generating spans
* **core/mathstyle.js** Provides info about the ** math styles**: display, text,
scripttext, scripscripttext and their tight variants.
* **core/fontMetrics.js** Provides glyph metrics: height above baseline, depth
below baseline, italic correction.
* **core/fontMetricsData.js** Used by `fontMetrics.js`

* **core/span.js** Implements the `Span` class: spans to markup

* **editor/editableMathlist.js**: The `EditableMathlist` keeps track of a tree
of math atoms representing the math expression being edited, and a selection
with can either be _collapsed_ (only the insertion point is visible) or not, in
which case it has an _extent_ indicating how big the selection is. This class
has no UI logic in it.
* **editor/mathpath.js** A utility class that represents a path in an atom
tree to a specific atom

* **editor/mathfield.js** Public API for the editor. Implements the UI for the
mathfield, including mouse and touch interaction, and  the popover and the 
command bar
* **editor/shortcuts.js** Defines the keyboard shorcuts
* **editor/commands.js**: list of commands displayed in the command bar
* **editor/popover.js** Implements the popover panel
* **editor/keyboard.js** A utility class that captures keyboard events from 
a _Textarea_ DOM element.
* **editor/undo.js** Implements the _Undo Manager_ which keeps tracks of the 
state of the mathfield as it is being edited in order to support undo/redo.


## Common Tasks

So, you want to...

### Add a new LaTeX command?

1. Start with `core/definitions.js`. Add a new entry to the appropriate table.
The handler function in the definition will be called by the parser at the right
time. It's your chance to store data that will be used by the atoms to render
the symbold later.
2. If you can use the existing atom types, great. If needed, modify an 
existing atom type to support what you want, including passing additional 
parameters. If no atom types match, create a new one by adding a new
`MathAtom.decompose<atom-type>()` function and calling it from 
`MathAtom.decompose()`.
3. Call `makeSpan()` and its variants in your decompose function to construct
a representation of the atom.

