# MathLive Usage Guide

This guide describes how to use the MathLive Javascript libraries with your own
web content. To contribute to the MathLive project, see the [MathLive 
Contributor Guide](CONTRIBUTOR_GUIDE.md)


## Getting Started

Download the content of the `dist/` directory and copy it at a location of 
your choice in your project. MathLive has no dependency (not even jQuery!) 
and you do not needs to install/download anything else.

The MathLive library is a series of Javascript modules, a few 
stylesheets and some font files. The modules can be combined into a single 
library using a bundler such as **webpack**, or they can be included 
individually. We recommend to use **require.js** to simplify
and optimize the loading of the individual modules.

If you use **require.js**, include the following in your web page, 
preferably before the `</body>` tag:

```
<script data-main="js/main" src="third-party/require.js"></script>
```

`js/main` should be a path to your "main" file, without the `.js`
extension, while `third-party/require.js` should be the path to your local
copy of `require.js`. You could use a CDN version as well.

Inside `main.js`, use the following:
```
define(['mathlive'], function(MathLive) {

        // YOUR CODE GOES HERE

});
```


## Rendering Math Automatically

Math in a web page will automatically be rendered after the page has 
loaded using the optional `auto-render` module.

By default, any text that is enclosed with the following delimiters
will be converted to a math formula:
* `$$`...`$$`
* `\[`...`\]`
* `\(`...`\)`

When being considered for conversion, some tags are ignored: `script`, 
`noscript`, `style`, `textarea`, `pre` and `code`.

To use the `auto-render` module, add it to the list of modules you import, 
for example:
```
define(['mathlive/core/mathlive', 'mathlive/auto-render'], function(MathLive, AutoRender) {

        // YOUR CODE GOES HERE

});
```

Alternatively, if you don't have a `main.js` file, you can load it 
directly from your main page:

```
<!doctype html>
<html lang="en-US">
<head>
    ...
</head>
<body onload = "
    requirejs.config({baseUrl:'js/'});
    requirejs(['auto-render'], function(AutoRender) {
        AutoRender.renderMathInElement(
            document.getElementsByTagName('body')[0])
    });
">
<h1>Taxicab Number</h1>
<p>The second taxicab number is $$1729 = 10^3 + 9^3 = 12^3 + 1^3$$</p>

<script data-main="js/main" src="js/vendor/require.js"></script>
</body>
</html>
```

If you dynamically generate content, you can request the autorenderer to run 
again using `AutoRender.renderMathInElement(el)`.

The `renderMathInElement()` functions takes a second parameter which can be 
used to customize the list of delimiters to consider, and the tags to ignore.



## Using the Math Editor Programatically

To make use of the MathLive API, include the `MathLive` module. This module
contains the public API to MathLive. 

To create a new math field, call `MathLive.makeMathField(element, options)`.
For example:
```
    let mf = MathLive.makeMathField(document.getElementById('math-field'));
```

You can control the math field using the public functions of MathField, that 
is, functions that do not contain an `_` at the beginnig or end of their name.
Here's a short list for some common operations:

* `el()` the DOM element associated with this math field
* `text(format)` return a textual representation of the content of the math 
field, `format` can be either `"latex"` (default) or `"spoken"`.
* `.write(content, options)` insert the specified content at the current 
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
invokved in response to a user action, such as pressing a keyboard shortcut
or pushing a button. The command will be undoable. See the list of available
commnads in the [**Selectors**](#selectors) section.

## Selectors

User initiated commands that control the mathfield can be dispatched using
the `perform()` commands. Commands are identified by a string called the
**selector**. Most commands take no parameters. When a command does have a 
parameter, an array made up of the selector and the commands arguments can be
passed to `perform()`. For example:

``` javascript
   mf.perform(['insert', '(#0)']);
```

will insert an open and close parenthesis around the selection (the `#0`
sequence is replaced with the current selection).

### Editing
* `insert`. This selector takes two arguments. The first one is required and 
is the content to be inserted, as a string. The second one is an optional set of key value pairs:
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
displays the keys being typed, including the shorcuts. Great for demos!
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


