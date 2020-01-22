This guide is for developers who want to contribute code to MathLive,
or who want to understand in more depth how MathLive works.

If you simply want to use MathLive with your web content, see the {@tutorial USAGE_GUIDE}.

## Table of Contents

-   [Getting Started: Setting up Your Development Environment](#getting-started-setting-up-your-development-environment)
-   [Code Structure](#code-structure)
-   [Language and Coding Style](#language-and-coding-style)
-   [Naming Conventions](#naming-conventions)
-   [Browser Support](#browser-support)
-   [Accessibility](#accessibility-a11y)
-   [Architecture](#architecture)
-   [Files](#files)
-   [Common Tasks](#common-tasks)

## Getting Started: Setting up Your Development Environment

The project uses [NPM scripts](https://docs.npmjs.com/misc/scripts)
for its build system. The `package.json`
file and the `scripts/` directory contain the definitions of the build scripts.

To get started developing:

1. Install [Node.js](http://nodejs.org) on your dev machine
2. In your shell, type:

```bash
$ git clone https://github.com/arnog/mathlive
$ cd mathlive
$ npm ci
```

The `npm ci` command installs in the `mathlive/node_modules` directory all the Node
modules necessary to build and test the MathLive library and its documentation.

Depending on your system setup, you may need to run as admin, in which case use `sudo npm ci` or equivalent.

Once the installation is successful, you can use the following commands:

```bash
# Build the project for local use
# 1. Compile the `.css/.less` file to `build/*.css`
# 2. Bundle the javascript in the `dist/` directory
$ npm run build

# Auto re-build the project when a file changes.
# Watch for changed files, and does "npm run build" and "npm run test"
# Run a local server to view the examples and do some simple debugging
# Note that the use of native modules require a server (they do not work
# with local files)
# After running this command, visit http://localhost:8080/examples/ in a browser
$ npm start

# Run test scripts
$ npm test

# Lint JavaScript files
$ npm run lint

# Lint and fix automatically JavaScript files.
$ npm run lint:fix

# Calculate the code coverage and output to build/coverage/
$ npm run coverage

# Build the documentation file to `docs/`
$ npm run docs

# Clean up (deletes) the contents of the `build/`, `dist/` and `docs/` directories
$ npm run clean

# Clean, build, then minimize and bundle to `dist/`.
# The `dist/` folder will contain the `.js`, `.css` and font files necessary to
# use MathLive. The `docs/` folder will also be updated.
$ npm run dist

```

During development, it is recommended that you keep the `npm start`
command running in a terminal window while you make the necessary changes
to the source files of the project in your favorite editor. When you
save a file, if any problem with your code is detected (linting
failure, unit test failure), it will be displayed in the terminal window.

Before doing a commit the docs and dist folder will be updated
automatically (using a git pre-commit hook managed by Husky).

After you push your changes to `master`, a Travis continuous integration
task will run `npm run lint` and `npm run test` to make sure
the build can be reproduced in a clean environment. If either of those tasks
fail, the build will be marked as failed and will need immediate fixing.

### Publishing

Once you have made significant changes that are ready to be shared broadly,
use the following commands:

```bash
# Increase the version number of the library
# Only do this before making a new public distribution
# After doing this, you can `npm publish`
$ npm run deploy major | minor | patch
```

This command will

1. Trigger a Travis CI build
2. Increment the version number and create a corresponding git tag
3. Publish a git release
4. Publish to NPM

**Note on versioning** Use the [semver](http://semver.org/) convention for
versions:

-   `npm run deploy`: bug fixes and other minor changes. Last number of the
    version is incremented, e.g. `1.2.41` → `1.2.42`
-   `npm run deploy minor`: new features which don't break existing features. Middle
    number of the version is incremented, e.g. `1.2.42` → `1.3.0`
-   `npm run deploy major`: changes which break backward compatibility of the API.
    Increment the first number, e.g. `1.3.56` → `2.0.0`

## Code Structure

The MathLive library consists of the following key directories:

-   `css/` the stylesheets and fonts used by MathLive
-   `src/core` the core JavaScript code needed to render math. This module depends
    on the `css/` module.
-   `src/editor` the JavaScript code needed for the editor. This module depends
    on the `src/core` module.
-   `src/addons` some optional modules that provide additional functionality

You can include only the files you need. For example, if you only
need to display math, you can skip `src/editor/` and `src/addons`.

In addition, the `dist/` directories contain optimized
output generated from the `css/` and `src/` directories:

-   the `build/` directory contains intermediary build results. These
    intermediary results can be used for debugging during development, but are
    not suitable for distribution. For example, this directory will contain the
    `.css` files generated from the `.less` in `css/`. However, a transpiled or
    minified `.js` file would not, as those are intended for distribution and
    should be in the `dist/` directory.
-   the `dist/` directory contains the build results that are ready
    for distribution. The files in this directory should be transpiled (for
    `.js` files), autoprefixed (for `.css` files), minimized and bundled.
-   finally, the `docs/` directory contain documentation generated from the
    source code.

The content of the `build/`, `dist/` and `docs/` directories are entirely
generated as part of the build process. No other directory should contain
intermediated files generated as part of the build process.

## Language and Coding Style

MathLive is written in JavaScript, using the [ES2016 dialect](https://www.ecma-international.org/ecma-262/7.0/). This
includes in particular these features:

-   native modules: `import` and `export`
-   `let` and `const` instead of `var`
-   block-scoped variables and functions
-   `Array.prototype.includes()`
-   `Object.assign()`
-   arrow functions: `() => {}`
-   template strings
-   `for (...of...)` iterators
-   string searching `String.startsWith()`, `String.endsWith()`
-   number formatting

Some features have been partially adopted, and the codebase should get
cleaned up whenever the opportunity arises:

-   classes
-   use of rest/spread

Features that have not been adopted include:

-   getters/setters: would probably be a good idea
-   destructuring: probably some opportunities to simplify some code
-   default parameters: would clean up some code
-   generators

The code is minified and bundled to reduce the load time.

The code base attempts to follow these general guidelines:

-   **Consistency** All code in the codebase should look as if it had been
    written by a single person. Don't write code for yourself, but for the many
    people who will read it later.
-   **Clarity before performance** Write code that is easy to read, and avoid
    obscure constructs that may obfuscate the code to improve performance. For
    example, RegEx are crazy fast in all modern browsers, and trying to roll out
    your own pattern matching will result in more code and less performance.
    If you think something could be made faster, use [http://jsben.ch/](https://http://jsben.ch/) to
    try out options in various browsers and compare the results. You might be
    surprised.
-   **Follow Postel's Law, the Robustness Principle** "Be conservative in what
    you do, be liberal in what you accept from others". For example, functions that
    are invoked internally do not need to check that the input parameters are valid.
    However, public APIs should check the validity of parameters, and behave
    reasonably when they aren't.

Use the `.eslintrc.json` file to follow the linting conventions used in the
project. In addition, follow these guidelines:

-   **Tabs** are expanded to **four spaces**
-   Quotes are preferably **single quotes**. Use double-quotes when inside a
    single-quoted string. Using backtick (template strings)for multiline
    quotes is OK.

```javascript
let s = 'hello, ' + 'world';
s = 'hello, "world"';
s = `hello:
world`;
```

-   Use camelCase for variables and function names, PascalCase for Objects and Classes and UPPERCASE for constants. Use underscore-prefixed arguments for unused arguments,

```javascript
bar.filter((element, _, array) => {
    console.log(array, element);
});
// or
bar.filter((element, _index, array) => {
    console.log(array, element);
});
```

-   **Typecheck** using `typeof v === 'string'`, `typeof v === 'number'`, etc...
    Use `Array.isArray(v)` to check for arrays.
-   **Conditional evaluation.** Use conditional evaluation shortcuts when applicable
    for example, use `if (string)` instead of `if (string !== '')`
-   The variable holding the return value of a function is usually named
    **`result`**
-   **Avoid boolean as arguments.** Instead, use an `options` object with
    key/value pairs spelling out the meaning of the boolean.

Don't do:

```javascript
f(true);
```

Do:

```javascript
f({ reverse: true });
```

-   **Use `||` for default values.** For example

```javascript
m = f(n) || d;
```

If the function `f` returns `null`, `undefined` or an empty string,
`m` will have the value `d`

-   **Braces for control structures** should always be used, except for short
    `if` statement that can fit on one line, for example `if (done) return;`
-   **Avoid method chaining.** Method chaining is a programming style where a
    method returns the `this` object so that it can be called again. For example
    `div.css('color', 'white').height(50).width(50)`.
-   **Use loose typing.** For example, a function argument could accept a string
    or an array and behave appropriately:

```javascript
function f(argument) {
    if (Array.isArray(argument)) {
        argument = argument.join(';');
    }
}
```

## Naming Conventions

Those naming conventions are particularly important for objects that are exposed
as part of the public API, such as `MathLive` and `MathField`.

-   variables and function names that begin with `_` are private and should not
    be used.
-   functions that end in `_` are selectors and should not be invoked directly by
    a client of the MathLive library (they can be called internally).
    Instead, a [`MathField.$perform()`]{@link MathField#\$perform} call should be
    made. Note that the perform call does not include the `_`, so you would call
    `mathfield.$perform('selectAll')`.

Also note that `$perform` accepts both CamelCase and kebab-case, so
`mathfield.$perform('select-all')` is valid as well.

-   functions that begin with `$` are public.
-   functions that neither begin nor end with an `_` are public and can be called
    directly.

## Browser Support

MathLive is designed for the modern web. Supporting older browsers complicates
the effort involved in building new features, but it is also an insecure
practice that should not be encouraged.

In this context, _modern_ means the latest two releases of Chrome, Edge, Safari
and Firefox. Both desktop and mobile are supported.

Note that the HTML quirks mode is not supported. This means that the host page
should use the strict mode, indicated by a `<!doctype html>` directive at the
top of the page.

## Accessibility - A11Y

### Rendering

MathLive renders math using HTML and CSS. Digits, letters and math symbols are
displayed in `<span>` tags with the necessary CSS styling to display them in
the right place. In addition, rules (lines) such as the fraction line, are
rendered using CSS borders. In a few rare cases, SVG is used to render
some decorations, such as the annotations of the `\enclose` command.

The rendered math is not purely graphical, and as such can be accessed by
screen readers.

### Alternate renditions

However, in addition to the "visual" HTML+CSS representation that MathLive
outputs, it can also generate alternate renditions, including:

-   **LaTeX**: a string of LaTeX code equivalent to the formula.
-   **Spoken Text**: a text representation of the formula as someone would speak it,
    for example: `f(x) = x^2` → "f of x equals x squared"
-   **Annotated Spoken Text**: as above, but in addition prosody hints are
    inserted for a more natural rendition by text to speech systems (breathing
    pauses, variation in pitch, etc...).

Those alternate renditions can be rendered as an ARIA-label, or as an element
that is not visually rendered, but visible to screen readers.

### Speech

Although MathLive works with screen readers, since math is its own language
MathLive has its own built-in text to speech renderer. With the speech interface
it is possible to:

-   read the current group (numerator or subscript, for example)
    -   Mac: `Ctrl + Command + Down`
    -   Windows/Linux/ChromeOS: `Ctrl + Alt + Down`
-   read what's before or after the selection
    -   Mac: `Ctrl + Command + Left/Right`
    -   Windows/Linux/ChromeOS: `Ctrl + Alt + Left/Right`
-   read the parent of the current group
    -   Mac: `Ctrl + Command + Up`
    -   Windows/Linux/ChromeOS: `Ctrl + Alt + Up`
-   read the current selection
    -   Mac: `Ctrl + Command + Shift + Down`
    -   Windows/Linux/ChromeOS: `Ctrl + Alt + Shift + Down`

With these convenient keyboard shortcuts, it is possible to aurally navigate
and understand even complex formulas.

### Input and navigation

MathLive supports multiple modalities for input: in addition to pointer devices
(mouse, trackpad, touch screen), MathLive has an extensive set of keyboard
shortcuts that allow navigation and editing of the most complex formulas.
Every operation is possible without the use of a pointing device.

Conversely, it is possible to enter commands and complex mathematical symbols
using only a pointing device: the command bar can be invoked by tapping a round
toggle button displayed to the right of the formula. The command bar offers
large buttons that act as a virtual keyboard, but offer contextual operations
depending on the current selection, and the content around it. Those buttons
are easy to use on touch screens and for users of alternative pointing devices.

## Architecture

The core of MathLive is a math rendering engine that can output to HTML and
CSS. This engine uses the TeX layout algorithms because of their quality.
Given the same input, MathLive will render pixel for pixel what TeX would
have rendered.
To do so, it makes use of a web version of the fonts used by TeX and which are
included in the `dist/fonts/` directory.
Although the rendering engine follows the TeX algorithms, MathLive also has
an in-memory data structure to represent a math expression while it is being
edited (the math atom tree).

Here are some of the key concepts used throughout the code base.

### Span

A span is an object that is used to represent an element displayed in
a web page:
a symbol such as _x_ or _=_, an open brace, a line separating the numerator
and denominator of a fraction, etc...

The basic layout strategy is to calculate the vertical placement of the spans and
position them accordingly, while letting the HTML rendering engine position
and display the horizontal items. When horizontal adjustments need to be made,
such as additional space between items the CSS margin are adjusted.

**Spans** can be rendered to HTML markup with `Span.toMarkup()` before being
displayed on the page.

### Math Atom

An atom is an object encapsulating an elementary mathematical unit, independent
of its graphical representation.

It can be of one of the following types:

-   **ord**: ordinary symbol, e.g. _x_, _\alpha_
-   **bin**: binary operator: _+_, _\*_, etc...
-   **rel**: relational operator: _=_, _\ne_, etc...
-   **punct**: punctuation: _,_, _:_, etc...
-   **open**: opening fence: _(_, _\langle_, etc...
-   **close**: closing fence: _)_, _\rangle_, etc...
-   **op**: (big) operators, _\sum_, _\cap_.
-   **inner**: special layout cases, overlap
-   **accent**: a diacritic mark above a symbol

In addition to these basic types, which correspond to the TeX atom types,
some atoms represent more complex compounds, including:

-   **space** and **spacing**: blank space between atoms
-   **mathstyle**: to change the math style used: **display** or **text**. The
    layout rules are different for each, the latter being more compact and intended
    to be incorporated with surrounding non-math text.
-   **font**: to change the font used. Used by `\mathbb`, `\mathbb`, etc...
-   **sizing**: to change the size of the font used
-   **color**: to change the foreground color
-   **rule**: a line, for the `\rule` command
-   **line**: used by `\overline` and `\underline` commands
-   **box**: to draw a border around an expression and change its background color
-   **overlap**: display a symbol _over_ another
-   **overunder**: displays an annotation above or below a symbol
-   **group**: a simple group of atoms
-   **root**: a group, which has no parent
-   **array**: a group, which has children arranged in columns and rows. Used
    by environments such as `matrix`, `cases`, etc...
-   **genfrac**: a generalized fraction: a numerator and denominator, separated
    by an optional line, and surrounded by optional fences
-   **surd**: a surd, aka root
-   **leftright**: used by the `\left` and `\right` commands
-   **delim**: some delimiter
-   **sizeddelim**: a delimiter that can grow

The following types are used by the editor:

-   **command** indicate a command being entered. The text is displayed in
    blue in the editor.
-   **error**: indicate a command that is unknown, for example `\xyzy`. The text
    is displayed with a dotted red underline in the editor.
-   **placeholder**: indicate a temporary item. Placeholders are displayed with a
    a pill (rounded box) in the editor.
-   **first**: a special, empty, atom put as the first atom in math lists in
    order to more easily represent the cursor position. They are not displayed.

### Math List

A **math list** is simply an array of atoms. Although it's a common data
structure there is no class to represent it: it's simply an `Array` of
`MathAtom` objects.

### Lexer

The **lexer** converts a string of TeX code into tokens that can be digested
by the parser.

### Parser

The **parser** turns a stream of tokens generated by the lexer into
**math atoms**. Those atoms then can be rendered into **spans**, or back into
LaTeX or into spoken text.

### Editable Math List

An **Editable Math List** is a class specific to the editor. It
encapsulates the operations that can be done to an editable math list, including
adding and removing content and keeping track of and modifying an insertion
point and selection.

### Mathfield

A **MathField** is a user interface element that captures the keyboard and
pointing device events, and presents an appropriate user experience.

It
uses the **EditableMathList** to manipulate the in-memory representation of
the math expression being edited.

## Files

Here's a brief guide to the files of the project:

-   **mathlive.js** The public API to Mathlive

-   **core/lexer.js** Implements the `Lexer` class: strings to tokens

-   **core/parser.js** Implements the `Parser` class: tokens to atoms
-   **core/definitions.js** Dictionary of all the known LaTeX commands, and
    which symbol or atom type they map to. Used by the `Parser`
-   **core/color.js** Support to parse color arguments

-   **core/mathAtom.js** Implements the `MathAtom` class: atoms to spans
-   **core.delimiters.js** Rendering (atoms to span) for delimiters.
-   **core/context.js** Rendering context of the current parse level (math style,
    color, font size, font family, font style, etc...). Used by MathAtom while
    generating spans
-   **core/mathstyle.js** Provides info about the ** math styles**: display, text,
    scripttext, scripscripttext and their tight variants.
-   **core/fontMetrics.js** Provides glyph metrics: height above baseline, depth
    below baseline, italic correction.
-   **core/fontMetricsData.js** Used by `fontMetrics.js`

-   **core/span.js** Implements the `Span` class: spans to markup

-   **editor/editableMathlist.js**: The `EditableMathlist` keeps track of a tree
    of math atoms representing the math expression being edited, and a selection
    with can either be _collapsed_ (only the insertion point is visible) or not, in
    which case it has an _extent_ indicating how big the selection is. This class
    has no UI logic in it.
-   **editor/mathpath.js** A utility class that represents a path in an atom
    tree to a specific atom

-   **editor/mathfield.js** Public API for the editor. Implements the UI for the
    mathfield, including mouse and touch interaction, and the popover and the
    command bar
-   **editor/shortcuts.js** Defines the keyboard shortcuts
-   **editor/commands.js**: list of commands displayed in the command bar
-   **editor/popover.js** Implements the popover panel
-   **editor/keyboard.js** A utility class that captures keyboard events from
    a _Textarea_ DOM element.
-   **editor/undo.js** Implements the _Undo Manager_ which keeps tracks of the
    state of the mathfield as it is being edited in order to support undo/redo.

## Common Tasks

So, you want to...

### Add a new LaTeX command?

**(1)** Start with `core/definitions.js`. Add a new entry to the appropriate table
by calling `defineSymbol()` for commands that need no parameters, `defineFunction()` for commands that need some parameters or `defineEnvironment()` for environments, that is `\begin{}...\end{}` blocks.

For functions, the handler function in the definition will be called by the parser at the right
time. It's your chance to return info that will be used by to render the atom.

**(2)** If you can use the existing atom types, great. If needed, modify an
existing atom type to support what you want, including passing additional
parameters. If no atom types match, create a new one by adding a new
`MathAtom.decompose<atom-type>()` function and calling it from
`MathAtom.decompose()`.

**(3)** Call `makeSpan()` and its variants in your decompose function to construct
a representation of the atom.
