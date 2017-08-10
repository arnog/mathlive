# Using MathLive with `require.js`

When deploying a project using MathLive, it is best to use the minified
and transpiled version from the `dist/` directory.

However, if you are making changes to or debugging an issue in MathLive, 
it is convenient to use the raw source files instead.

Those files are organized in **modules**, and they can be loaded in
your browser using a module loader, such as **[require.js](http://requirejs.org/)**.

This example does just that! 

A few important points:
- You still need to load the `.css` files. It is recommended that you load
them from the `dist/` directory, as this directory also includes the `fonts/` 
directory referenced by the css files. If you want to use the `build/` 
directory, you will need to copy the `fonts/` directory manually
- Your Javascript content needs to be in a module of its own, that is in 
a separate file (called `main.js` in the example).
- Since the JS source files are not transpiled, you need to use a browser that 
supports the ES dialect used in the project. The latest version of Chrome 
works fine for this purpose.

## Step by step
### Load the stylesheets
Load the two CSS files from the `dist/` directory, preferably in the `<head>`
section.
```html
    <link rel="stylesheet" href="../../dist/mathlive.core.css">
    <link rel="stylesheet" href="../../dist/mathlive.css">
```

### Configure **require.js**
Before the `</body>` tag, configure **require.js** by specifying where the 
source files are located. Adjust the `../../src/` path as necessary.
This example also loads **jQuery** to demonstrate how to do it, should you 
need it.
```html
<script>
    var require = {
        baseUrl: './',
        paths: {
            "jquery": "vendor/jquery-3.2.1.min",
            "mathlive": "../../src"
        }
    };
</script>
```

### Load your Javascript script
Finally, load **require.js** and request that it loads, asynchronously, 
your main Javascript file.
```html
<script data-main="main" src="vendor/require.js"></script>
````
### Load the required modules
Call the `define()` function to load the modules you need, and give them a 
name. When the function which is the second argument to define is called,
the modules will have been loaded.
```javascript
define(['jquery', 'mathlive/mathlive'], 
    function($, MathLive) {
        // ...
});
```