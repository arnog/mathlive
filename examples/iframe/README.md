# Iframe Example

This example shows how to interact with a MathLive mathfield on a page with
multiple iframes.

## Initialize Child Frame

Initialize a mathfield element as usual

```html
<script src="https://unpkg.com/mathlive/"></script>

<math-field></math-field>
```

## Initialize Parent Frame

In the parent frame you should also load MathLive using a `<script>` tag.

```html
<script type="module">
  import 'https://unpkg.com/mathlive?module';
</script>
```

The virtual keyboard will be shown in the parent frame window.

## Cross-Origin Communication

MathLive accepts keyboard messages from the same origin by default. To share
the host keyboard with a trusted cross-origin iframe, configure both sides
after importing MathLive, before focusing a mathfield.

In the host page (for example, `https://host.example`):

```js
mathVirtualKeyboard.targetOrigin = 'https://math.example';
mathVirtualKeyboard.originValidator = (origin) =>
  origin === 'https://math.example';
```

In the mathfield iframe (`https://math.example`):

```js
mathVirtualKeyboard.targetOrigin = 'https://host.example';
mathVirtualKeyboard.originValidator = (origin) =>
  origin === 'https://host.example';
```

Use exact origins, including the scheme and any non-default port. Avoid
`targetOrigin = '*'` and `originValidator = 'none'` on pages with untrusted
frames. The receiving proxy and mathfield also verify the sending window.

A cross-origin iframe can select built-in layout names, `alphabeticLayout`,
and `editToolbar`. Configure custom HTML layouts and keycap overrides in the
host page; they cannot be supplied through cross-origin messages, even when
origin validation is disabled.

For an isolated keyboard within an iframe, set
`mathfield.mathVirtualKeyboardPolicy = 'sandboxed'`. This does not require
cross-origin communication with the host keyboard.
