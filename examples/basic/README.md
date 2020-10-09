# Basic Example

This example shows how to interact with a MathLive mathfield.

It uses the Mathlive SDK distributed via a CDN.

### 1. ... as a ES module

ES Modules, also known as JavaScript Modules, are the recommended way to load
JavaScript libraries. The library is loaded asynchronously, improving loading
performance, and it does not pollute the global environment.

```html
<script type="module">
    import { makeMathField } from 'https://unpkg.com/mathlive/dist/mathlive.mjs';
    // ...
</script>
```

The file `mathlive.min.mjs` in the `dist` directory is a JavaScript
module, indicated by the `mjs` file extension.

In order to use the `import` statement, the `<script>` tag has an attribute
`type='module'`. Doing so will also require CORS to be
respected, which means that loading directly from a local filesystem
will not work, but will require a local server instead.

### 2. ... with a `<script>` tag

It is also possible to load Mathlive using a `<script>` tag.

```html
<script src="https://unpkg.com/mathlive/dist/mathlive.js"></script>
```

Once loaded, the global object `MathLive` will contain the main API entry points,
such as `MathLive.makeMathField()`

Note that the `mathlive.js` file in the `dist` directory is a UMD
(Universal Module Definition) file, meaning that you can use it with
several loaders, include requirejs, and CommonJS.

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
    onContentDidChange: (mf) => {
        console.log(mf.getValue());
    },
});
```
