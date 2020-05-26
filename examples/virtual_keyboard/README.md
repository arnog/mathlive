# Virtual Keyboards

## Interact with a mathfield

Create a mathfield from an element on page. Here we used a `<div>` element
with an ID of `mf`. If the element has any textual content, it will be used
as the initial content of the mathfield.

Now is also a good time to customize the mathfield. Here, we'll provide a
handler to be notified when the content of the mathfield has changed, for
example when the user types something in the field.

```javascript
const mf = MathLive.makeMathField('mf', {
    onContentDidChange: updateOutput,
});
```

We'll process that notification by extracting a LaTeX representation from the
mathfield, and displaying it in an output element.

```javascript
function updateOutput(mathfield) {
    document.getElementById('output').innerHTML = mathfield.$text('latex');
}
```

## JSON keyboard layout

There is option to load keyboard from JSON file.
Simple JSON structure is:

```json
{
    "virtualKeyboardMode": "manual",
    "customVirtualKeyboardLayers": {
        "layer-name": {
            "styles": "",
            "rows": [
                [
                    {
                        "class": "keycap",
                        "latex": "\\frac{x}{y}"
                    }
                ]
            ]
        }
    },
    "customVirtualKeyboards": {
        "keyboard-name": {
            "label": "Json",
            "tooltip": "Json keyboard",
            "layer": "layer-name"
        }
    },
    "virtualKeyboards": "keyboard-name"
}
```

Full button JSON example:

```json
{
    "class": "",
    "insert": "",
    "key": "",
    "latex": "",
    "aside": "",
    "altKeys": "",
    "shifted": "",
    "shiftedCommand": "",
    "command": "",
    "label": ""
}
```

There are three modes of keyboard that can be set

`"virtualKeyboardMode": "manual"` will add button to hide/show keyboard
`"virtualKeyboardMode": "onfocus"` will open keyboard when editor field is focused
`"virtualKeyboardMode": "off"` will disable keyboard
