# Iframe Example

This example shows how to interact with a MathLive mathfield on page with multiple iframes.

It uses the Mathlive SDK distributed via a CDN.

## Initialize child frame

Initialize a mathfield element as usual, just pass an option `useProxyHost` or `use-proxy-host` attribute with `true` value.

```html
<script src="https://unpkg.com/mathlive/dist/mathlive.js"></script>

<math-field virtual-keyboard-mode="onfocus" use-proxy-host="true"></math-field>
```

Once loaded, the global object `MathLive` will contain the main API entry points,
such as `MathLive.makeMathField()`

Note that the `mathlive.js` file in the `dist` directory is a UMD
(Universal Module Definition) file, meaning that you can use it with
several loaders, include requirejs, and CommonJS.

## Initialize parent frame

At parent frame you should also load Mathlive using a `<script>` tag and use `makeRemoteClient` method to initialize client.

```html
<script type="module">
    import { makeRemoteClient } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';

    const client = makeRemoteClient({});
</script>
```

Now, when you focus on keyboard in iframe container, the virtual keyboard will shown at parent frame window.

## Interact with a mathfield

On a parent frame window you can manipulate with mathfield element via commands and few additional methods.
That available only when mathfield element are focused in child frame. Multiple focuses is not supported by this feature.
