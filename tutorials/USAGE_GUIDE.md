This guide describes how to use the MathLive Javascript library with your own
web content. 

To contribute to the MathLive project, see the {@tutorial CONTRIBUTOR_GUIDE}.


## Getting Started

Install MathLive from gitHub or from NPM.

### From GitHub

You can find MathLive at [https://github.com/arnog/mathlive/](https://github.com/arnog/mathlive/)

The `dist/` directory contains all you need to use MathLive. MathLive has no 
dependency on other libraries (not even jQuery!) and you do not need to 
download or install anything else.

The `dist/` directory contains the following:
- `mathlive.js` The MathLive Javascript library. It is an optimized and minified 
Javascript file which exports the [`MathLive`]{@link module:mathlive} 
module which gives access to the MathLive API.
- `mathlive-core.css` The minimal amount of CSS to display math with MathLive.
- `mathlive.css` The rest of the CSS you need to display math. You can load
this file lazily to improve your page load time.
- `fonts/` A directory of fonts used by MathLive. Credit for those fonts goes to
the KaTeX project.

### From NPM
```bash
$ npm install -g mathlive
```

### Using MathLive in your project

Include the following in your web page. Adjust the `src` and `href` arguments 
to account for your directory structure.

```html
<!doctype html><html lang="en-US">
<head>
    ...
    <link rel="stylesheet" href="mathlive.core.css">
    <link rel="stylesheet" href="mathlive.css">
</head>
<body>
    ...
   <script src="mathlive.js"></script>
</body>
</html>
```



## Rendering Math Automatically

Call [`MathLive.renderMathInDocument()`]{@link module:mathlive#renderMathInDocument} 
 at the end of your document, or in a `onload` handler to render math contained 
 in the document.

```html
    ...
    <script src="mathlive.js"></script>
    <script>
        MathLive.renderMathInDocument();
    </script>
</body>
</html>
```

By default, any LaTeX code that is enclosed with the following delimiters
will be rendered as math:
* `$$`...`$$`
* `\[`...`\]`
* `\(`...`\)`

```html
<h1>Taxicab Number</h1>
<p>The second taxicab number is $$1729 = 10^3 + 9^3 = 12^3 + 1^3$$</p>
```

You can also wrap more complex expressions in a `<script>` tag with a type 
of `math/tex`. This is the recommended approach for stand-along formulas. One 
of the benefits of this approach is that the browser will not attempt to 
display the content of the `<script>` tag before it is typeset, avoiding an 
unsightly flash of LaTeX code on screen. If the type is `"math/tex; mode=text"` 
the inline text style will be used, otherwise if the type is 
`"math/tex; mode=display"`, the display style will be used. If no mode is 
provided, the display style is used.

```html
<h1>Quadratic roots</h1>
<script type="math/tex">
    ax^2+bx+c = 
    a 
    \left( x - \frac{-b + \sqrt {b^2-4ac}}{2a} \right) 
    \left( x - \frac{-b - \sqrt {b^2-4ac}}{2a} \right)
</script>

```

Elements with the following tags will be ignored for conversion: 
`noscript`, `style`, `textarea`, `pre`, `code`, `annotation` and `annotation-xml`.

If you dynamically generate content, call 
[`MathLive.renderMathInElement(element)`]{@link module:mathlive#renderMathInElement} 
to render your element after the page has been loaded. This is a recursive
call that will be applied to `element` and all its children.

It is possible to call `MathLive.renderMathInElement()` and 
`MathLive.renderMathInDocument` on elements and documents that have already 
been rendered, in which case they will be rendered again. This is useful 
if something in the environment changes that could require the layout to be 
updated.

The [`MathLive.renderMathInElement()`]{@link module:mathlive#renderMathInElement} and 
[`MathLive.renderMathInDocument()`]{@link module:mathlive#renderMathInDocument} 
functions take an optional `options` object which can be used to customize their 
behavior:

* `skipTags`: an array of tag names whose content will not be scanned for 
delimiters
* `processScriptType`: `<script>` tags of the indicated type will be processed 
while others will be ignored. Default: "math/tex".
* `ignoreClass`: a string used as a regular expression of class names of 
elements whose content will not be scanned for delimiters (`'tex2jax_ignore'` 
by default)
* `processClass`:   a string used as a regular expression of class names of 
elements whose content **will** be scanned for delimiters, even if their tag 
name or parent class name would have prevented them from doing so. 
(`'tex2jax_process'` by default)
* `TeX.processEnvironments`: if false, math expression that start with 
`\begin{` will not automatically be rendered. (true by default)
* `TeX.delimiters.inline` and `TeX.delimiters.display` arrays of delimiters
that will trigger a render of the content in 'textstyle' or 'displaystyle' style, 
respectively.

```javascript
    MathLive.renderMathInElement(
        document.getElementById('formulas'), {
            // Elements with a class of "instruction" or "source will be skipped            
            ignoreClass: 'instruction|source', 
            TeX : {
                delimiters: {
                    // Allow math formulas surround by $...$ or \(...\)
                    // to be rendered as textstyle content.
                    inline: [['$', '$'], ['\\(', '\\)']]
                }
            }
        }
    );
```



## Using the Math Editor with Javascript

To transform an existing HTML element into a math field, call 
[`MathLive.makeMathField(element, options)`]{@link module:mathlive#makeMathField}. 
Think of this original element as a placeholder. Typically, a `<div>` would 
be appropriate. If the element contains some LaTeX text, it will be used as the
 initial value of the math field.


For example:
```html
<!DOCTYPE html><html lang="en-US">
<head>
    <meta charset="utf-8">
    <title>MathLive Sample</title>

    <link rel="stylesheet" href="mathlive.core.css">
    <link rel="stylesheet" href="mathlive.css">
    <script src="mathlive.js"></script>
</head>
<body>
    <div id='mathfield' style='border: 1px solid #999;padding:5px;'>
        f(x)=
    </div>
<script>
    const mathfield = MathLive.makeMathField(document.getElementById('mathfield'));
</script>
</body>
</html>
```

You can control the math field using the public member functions of `MathField`,
that is, functions that do not contain an `_` at the beginning or end of their name.
Here's a short list for some common operations:

* `el()` the DOM element associated with this math field
* `text(format)` return a textual representation of the content of the math 
field, `format` can be either `"latex"` (default) or `"spoken"`.
* `.insert(content, options)` insert the specified content at the current 
insertion point. With `options` it is possible to specify the insertion mode,
as well as what will be selected after the insertion. If the content contains
a `#?` a placeholder will be indicated in its stead. The `#0` sequence will
be replaced by the item currently selected (or a placeholder if nothing is 
selected)
* `config()` customize how the math field behaves, as well as provide 
notification handlers, for example when the selection changes, or when 
navigation exists the math field.
* `select()` select all the items in the math field
* `clearSelection()` deletes the selection
* `perform()` executes a command such as moving the insertion point. Typically
invoked in response to a user action, such as pressing a keyboard shortcut
or pushing a button. The command will be undoable. See the list of available
commands in the **Selectors** section below.

## Selectors

User initiated commands that control the math field can be dispatched using
the [`perform()`]{@link MathField#perform} commands. Commands are identified by 
a string called the **selector**. Most commands take no parameters. When a 
command does have a parameter, an array made up of the selector and the 
commands arguments can be passed to [`perform()`]{@link MathField#perform}. 
For example:

``` javascript
   mf.perform(['insert', '(#0)']);
```

will insert an open and close parenthesis around the selection (the `#0`
sequence is replaced with the current selection).

### Editing
* `insert`. This selector takes two arguments. The first one is required and 
is the content to be inserted, as a string. The second one is an optional set 
of key value pairs:
  * `insertionMode`: one of `"replaceSelection"`, `"replaceAll"`, `"insertBefore"` or `"insertAfter"`.
  * `selectionMode`: one of `"placeholder"` (the selection will be 
the first available placeholder in the item that has been inserted),
`"after"` (the selection will be an insertion point after the item that has 
been inserted), `"before"` (the selection will be an insertion point before 
the item that has been inserted) or `"item"` (the item that was inserted will
be selected).
* `delete` synonym for `deleteNextChar`
* `deleteNextChar`, `deletePreviousChar`
* `deleteNextWord`, `deletePreviousWord`
* `deleteToGroupStart`, `deleteToGroupEnd`
* `deleteToMathFieldEnd`
* `transpose`

### Edit Menu
* `undo`
* `redo`
* `cutToClipboard`
* `copyToClipboard`
* `pasteFromClipboard`

### User Interface
* `enterCommandMode`
* `complete` exit command mode and insert result
* `nextSuggestion` and `previousSuggestion` when the popover panel is
selected, display the next/previous suggestion
* `toggleKeystrokeCaption` show/hide the keystroke caption panel. This panel
displays the keys being typed, including the shortcuts. Great for demos!
* `toggleCommandBar` show/hide the command bar

### Scrolling
* `scrollToStart`
* `scrollToEnd`
* `scrollIntoView`

### Navigating
* `moveToNextChar`, `moveToPreviousChar`
* `moveToNextPlaceholder`, `moveToPreviousPlaceholder`
* `moveToNextWord`, `moveToPreviousWord`
* `moveToGroupStart`, `moveToGroupEnd`
* `moveToMathFieldStart`, `moveToMathFieldEnd`
* `moveUp`, `moveDown`
* `moveToSuperscript`, `moveToSubscript`
* `moveToOpposite`
* `moveBeforeParent`, `moveAfterParent`


### Extending the Selection
* `selectGroup`
* `selectAll`
* `extendToNextChar`, `extendToPreviousChar`
* `extendToNextWord`, `extendToPreviousWord`
* `extendUp`, `extendDown`
* `extendToNextBoundary`, `extendToPreviousBoundary`
* `extendToGroupStart`, `extendToGroupEnd`
* `extendToMathFieldStart`, `extendToMathFieldEnd`

### Arrays
* `addRowAfter`, `addRowBefore`
* `addColumnAfter`, `addColumnBefore`

### Speech
* `speakAll`
* `speakSelection`
* `speakParent`
* `speakGroup`
* `speakLeftSibling`, `speakRightSibling`


