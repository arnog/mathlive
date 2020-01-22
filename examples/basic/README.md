# Basic Example

This example shows how to interact with a MathLive mathfield.

It uses the minified version of the MathLive library.

## Load the stylesheets

Load both the "core" and regular stylesheet. The "core" stylesheet contains
only the basic to display a simple formula. You can lazily load the
regular stylesheet, but you will need both to display correctly formulas.

```html
<link rel="stylesheet" href="../../dist/mathlive.core.css" />
<link rel="stylesheet" href="../../dist/mathlive.css" />
```

## Load the JavaScript library...

There are multiple ways to load the MathLive JavaScript library, and this
example demonstrates two of them:

-   with a `<script>` tag (see `index.html`)
-   as a ES Module (see `index.esm.html`)

### 1. ... with a `<script>` tag

Include a `<script>` tag, preferably at the end of your page, before the
`</body>` tag, to avoid blocking rendering.

```html
<script src="../../dist/mathlive.js"></script>
```

Once loaded, the global object `MathLive` will contain the main API entry points,
such as `MathLive.makeMathField()`

This is a simple method, and well suited if you need little customization and
interactivity.

Note that the `mathlive.js` file in the `dist` directory is a UMD
(Universal Module Definition) file, meaning that you can use it with
several loaders, include requirejs, and CommonJS.

### 2. ... as a ES module

ES Modules, also known as JavaScript Modules, are a more recent method to load
JavaScript libraries. The script is loaded asynchronously, improving loading
performance, and you can choose the variable in which the API is imported.

```html
<script type="module">
    import MathLive from '../../dist/mathlive.mjs';
    // ...
</script>
```

This method is more modern, and better suited if you need to integrate
MathLive with significant amounts of JavaScript code, such as other libraries.

Note that the file `mathlive.mjs` in the `dist` directory is a ES
module, indicated by the `mjs` file extension.

Note that in order to use the `import` statement, the `<script>` tag has an attribute `type='module'`. Doing so will also require CORS to be
respected, which means that loading directly from a local filesystem
will not work, but will require a local server instead.

## Interact with a mathfield

Create a mathfield from an element on page. Here we used a `<div>` element
with an ID of `mf`. If the element has any textual content, it will be used
as the initial content of the mathfield.

Now is also a good time to customize the mathfield. Here, we'll provide a
handler to be notified when the content of the mathfield has changed, for
example when the user types something in the field. We'll process that
notification by extracting a LaTeX representation from the
mathfield, and displaying it in an output element.

```javascript
const mf = MathLive.makeMathField('mf', {
    onContentDidChange: mf => {
        document.getElementById('output').innerHTML = mf.$text();
    },
});
```
