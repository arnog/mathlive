#MathLive Programming Guide

MathLive can be used to beautifully render and edit math in web pages.

This guide describes how to use the MathLive Javascript libraries in your own
web content. To contribute to the MathLive project, see the MathLive 
Contributor Guide.

## Overview

```
```

## Getting Started

The MathLive library is a series of Javascript modules and a few 
CSS files. The modules can be combined into a single library
using a bundler such as **webpack**, or they can be included 
individually. We recommend to use **require.js** to simplify
and optimize the loading of the individual modules.

To use **require.js**, include the following in your web page, 
preferably before the `</body>` tag:

```
<script data-main="js/main" src="js/vendor/require.js"></script>
```

``js/main`` should be a path to your "main" file, without the `.js`
extension.

Inside `main.js`, use the following:
```
define(['mathlive'], function(MathLive) {

        // YOUR CODE GOES HERE

});
```


## Rendering math automatically

Math in a web page can automatically be rendered after the page has 
loaded using the `auto-render` module. 

By default, any text that is enclosed with the following delimiters
will be converted to a math formula:
* `$$`...`$$`
* `\[`...`\]`
* `\(`...`\)`

When being considered for conversion, some tags are ignored: `script`, `noscript`, `style`, `textarea`, `pre` and `code`.

To use this module, add it to the list of modules you import, for example:
```
define(['mathlive', 'auto-render'], function(MathLive, AutoRender) {

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

If you dynamically generate content, you can request the autorenderer to run again using `AutoRender.renderMathInElement(el)`.

The `renderMathInElement()` functions takes a second parameter which can be used to customize the list of delimiters to consider, and the tags to ignore.



## Rendering math programatically

To make use of the MathLive API, include the MathLive module.


## Math Editor



#MathLive Contributor Guide

This guide describes how to make contributions to the MathLive project. If you
simply want to use MathLive with your web content, see the MathLive Programming
Guide.

## Code structure


## Architecture