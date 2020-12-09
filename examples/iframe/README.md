# Iframe Example

This example shows how to interact with a MathLive mathfield on page with multiple iframes.

It uses the Mathlive SDK distributed via a CDN.

## Initialize child frame

Initialize a mathfield element as usual, just pass an option
`useSharedVirtualKeyboard` with a value of true or set a
`use-shared-virtual-keyboard` attribute.

```html
<script src="https://unpkg.com/mathlive/dist/mathlive.js"></script>

<math-field
    virtual-keyboard-mode="onfocus"
    use-shared-virtual-keyboard
></math-field>
```

## Initialize parent frame

In the parent frame you should also load Mathlive using a `<script>` tag and
invoke `makeSharedVirtualKeyboard()` function to create the shared virtual keyboard.

```html
<script type="module">
    import { makeSharedVirtualKeyboard } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';

    makeSharedVirtualKeyboard({});
</script>
```

Now, when you focus on keyboard in iframe container, the virtual keyboard will shown at parent frame window.

## Interact with a mathfield

On a parent frame window you can manipulate with mathfield element via commands and few additional methods.
That available only when mathfield element are focused in child frame. Multiple focuses is not supported by this feature.
