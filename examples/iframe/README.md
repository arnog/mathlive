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

By default browsers will not allow a frame to access the content of another
frame if they are not on the same domain. 

To allow this, you need to set the `mathVirtualKeyboard.targetOrigin` property to `"*"` (any domain). This will allow the keyboard to communicate with the mathfield.

In addition, you may need to set the mathfield `virtualKeyboardTargetOrigin` property to `"*"` as well. This
will allow the mathfield to communicate with the virtual keyboard in the parent frame.

You may set the origin to a specific domain if you prefer.



